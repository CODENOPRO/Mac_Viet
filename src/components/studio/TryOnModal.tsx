import React, { useState, useRef, useEffect } from 'react';
import { LookState } from '../../types';
import { nenAnhChoAI } from '../../lib/gemini';
import { macThu } from '../../lib/tryOn';
import { getDailyQuota, KY_QUOTA_LIMIT } from '../../lib/tryOnGuard';
import { chonBoiCanhTuDong } from '../../data/backgrounds';
import { useStore, store } from '../../lib/store';
import { EVENTS } from '../../data/events';

interface TryOnModalProps {
  isOpen: boolean;
  onClose: () => void;
  lookState: LookState;
  onSuccess: (imageUrl: string) => void;
  onErrorToast?: (msg: string) => void;
}

export default function TryOnModal({
  isOpen,
  onClose,
  lookState,
  onSuccess,
  onErrorToast,
}: TryOnModalProps) {
  const { selectedEvent, selectedRegion } = useStore();

  // Trạng thái modal:
  // 'xin_phep': Màn hình xin phép quyền riêng tư trước khi tải ảnh
  // 'tai_anh': Tải ảnh lên & cắt cúp 3:4
  const [tab, setTab] = useState<'xin_phep' | 'tai_anh'>('xin_phep');

  // ĐIỀU KIỆN TIÊN QUYẾT: CHECKBOX TUYỆT ĐỐI KHÔNG BẬT SẴN (mặc định là false)
  const [consentChecked, setConsentChecked] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // File ảnh người dùng đã chọn
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);

  // Tinh chỉnh cắt ảnh 3:4 thủ công bằng CSS Transform (không dùng thư viện ngoài)
  const [scale, setScale] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Trạng thái đang gọi AI tạo ảnh
  const [isProcessing, setIsProcessing] = useState(false);
  const [gentleErrorMessage, setGentleErrorMessage] = useState<string | null>(null);

  // Reset trạng thái khi mở modal
  useEffect(() => {
    if (isOpen) {
      setTab('xin_phep');
      setConsentChecked(false);
      setUploadError(null);
      setRawImageSrc(null);
      setScale(1);
      setPanX(0);
      setPanY(0);
      setIsProcessing(false);
      setGentleErrorMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // ---------------------------------------------------------------------------
  // XỬ LÝ NHẬN FILE ẢNH
  // ---------------------------------------------------------------------------
  const handleSelectFile = (file: File) => {
    setUploadError(null);

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Chỉ hỗ trợ file ảnh định dạng JPEG, PNG hoặc WebP.');
      return;
    }

    const MAX_SIZE = 8 * 1024 * 1024; // 8MB
    if (file.size > MAX_SIZE) {
      setUploadError('Ảnh vượt quá dung lượng tối đa 8MB. Vui lòng chọn ảnh nhẹ hơn.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setRawImageSrc(result);
      setScale(1);
      setPanX(0);
      setPanY(0);
    };
    reader.onerror = () => {
      setUploadError('Không thể đọc file ảnh. Vui lòng thử lại với ảnh khác.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleSelectFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleSelectFile(file);
    }
  };

  // ---------------------------------------------------------------------------
  // XỬ LÝ CẮT ẢNH 3:4 & NÉN CẠNH DÀI 1024PX
  // ---------------------------------------------------------------------------
  const handleProcessCroppedImage = async () => {
    if (!rawImageSrc) return;

    setIsProcessing(true);
    setGentleErrorMessage(null);

    try {
      // 1. Cắt cúp khung 3:4 trên canvas và nén ảnh (xoá EXIF)
      const croppedBase64 = await new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const targetW = 768;
          const targetH = 1024;

          const canvas = document.createElement('canvas');
          canvas.width = targetW;
          canvas.height = targetH;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context unavailable'));
            return;
          }

          ctx.fillStyle = '#F2EDE3';
          ctx.fillRect(0, 0, targetW, targetH);

          ctx.save();
          ctx.translate(targetW / 2 + panX, targetH / 2 + panY);
          ctx.scale(scale, scale);

          const drawW = img.width;
          const drawH = img.height;
          ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
          ctx.restore();

          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          resolve(dataUrl);
        };
        img.onerror = () => reject(new Error('Image load failed'));
        img.src = rawImageSrc;
      });

      // Lưu ảnh vào store của người dùng
      store.setUserPhoto(croppedBase64);

      // 2. Gửi ảnh đã xử lý tới Gemini qua macThu với chế độ kỹ 2 lượt
      const boiCanh = selectedEvent || EVENTS[0];
      const bg = chonBoiCanhTuDong(boiCanh.id);
      // Chế độ Kỹ giới hạn 2 lượt mỗi ngày như ở màn phối đồ; hết lượt thì dùng chế độ Nhanh
      const conLuotKy = getDailyQuota().countKy < KY_QUOTA_LIMIT;
      const res = await macThu({
        anhNguoi: croppedBase64,
        look: lookState,
        boiCanh,
        background: bg,
        chatLuong: conLuotKy ? 'ky' : 'nhanh',
      });

      if (res?.anh) {
        store.setActiveTryOnImage(res.anh);
        store.addToTryOnHistory(res.anh);
        store.setLastTriedLook(lookState);
        store.setIsTryOnStale(false);
        onSuccess(res.anh);
        onClose();
      } else {
        // Nói đúng lý do app trả về (ảnh nhiều người, hết lượt, chưa có máy dựng...), không gộp thành lỗi chung
        setGentleErrorMessage(res.canhBao[0] || 'Lần này chưa dựng được ảnh. Bạn thử lại với một bức ảnh khác.');
      }
    } catch {
      setGentleErrorMessage(
        'Không thể xử lý ảnh lúc này. Bạn có thể thử lại với một bức ảnh khác hoặc tiếp tục tinh chỉnh trang phục.'
      );
      if (onErrorToast) {
        onErrorToast('Không thể kết nối dịch vụ tạo ảnh. Vui lòng thử lại sau.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Kéo di chuyển ảnh (pan)
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX - panX, y: e.clientY - panY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    setPanX(e.clientX - dragStartRef.current.x);
    setPanY(e.clientY - dragStartRef.current.y);
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-[#0D1826]/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div className="bg-[#FBF8F2] border border-[#2C2A26] w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden rounded-[2px]">
        {/* THANH TIÊU ĐỀ */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2C2A26]/15 bg-[#F2EDE3]">
          <div>
            <span className="micro-label text-[#A8322A]">THỬ TRANG PHỤC CÁ NHÂN</span>
            <h2 className="font-display text-xl text-[#2C2A26] font-normal">
              Mặc thử trên ảnh của bạn
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="w-8 h-8 flex items-center justify-center font-mono text-sm border border-[#2C2A26]/20 text-[#2C2A26] hover:bg-[#2C2A26] hover:text-[#F2EDE3] transition-colors cursor-pointer"
            title="Đóng modal"
          >
            ✕
          </button>
        </div>

        {/* NỘI DUNG CHÍNH THEO BƯỚC */}
        <div className="p-6 md:p-8 flex-1 overflow-y-auto">
          {/* ===================================================================
              BƯỚC 1: MÀN HÌNH XIN PHÉP QUYỀN RIÊNG TƯ
              ĐÚNG BỐN GẠCH ĐẦU DÒNG - CHECKBOX TUYỆT ĐỐI KHÔNG BẬT SẴN
              =================================================================== */}
          {tab === 'xin_phep' && (
            <div className="flex flex-col gap-6">
              <div>
                <span className="micro-label text-[#A8322A]">CAM KẾT QUYỀN RIÊNG TƯ</span>
                <h3 className="font-display text-xl text-[#2C2A26] mt-1">
                  Minh bạch về việc sử dụng hình ảnh cá nhân
                </h3>
                <p className="text-xs font-sans text-[#6E5439] mt-1">
                  Trước khi tải ảnh chân dung lên, xin vui lòng đọc rõ chính sách bảo vệ dữ liệu cục bộ:
                </p>
              </div>

              {/* ĐÚNG BỐN GẠCH ĐẦU DÒNG */}
              <div className="p-5 border border-[#2C2A26]/20 bg-[#F2EDE3] flex flex-col gap-3 rounded-[1px]">
                <ul className="text-xs font-sans text-[#2C2A26] space-y-3 leading-relaxed">
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#A8322A] mt-1.5 shrink-0" />
                    <span>Ảnh của bạn được thu nhỏ ngay trên máy bạn trước khi gửi, thao tác này cũng xoá luôn thông tin vị trí đi kèm ảnh.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#A8322A] mt-1.5 shrink-0" />
                    <span>Ảnh được gửi tới Google Gemini để tạo ảnh mô phỏng, và không lưu trên máy chủ nào của chúng tôi.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#A8322A] mt-1.5 shrink-0" />
                    <span>Chúng tôi không lưu ảnh gốc, không lưu ảnh kết quả, trừ khi bạn tự bấm lưu vào Lookbook trên máy bạn.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#A8322A] mt-1.5 shrink-0" />
                    <span>Ảnh kết quả là ảnh do AI dựng, không phải ảnh thật, và luôn có dấu ghi rõ điều đó.</span>
                  </li>
                </ul>
              </div>

              {/* CHECKBOX XÁC NHẬN (CẤM BẬT SẴN, MẶC ĐỊNH LÀ FALSE) */}
              <label className="flex items-center gap-3 p-3 border border-[#2C2A26]/15 bg-[#FBF8F2] cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  className="w-4 h-4 accent-[#A8322A] cursor-pointer"
                />
                <span className="font-mono text-xs text-[#2C2A26]">
                  Tôi đã đọc và đồng ý với cam kết bảo vệ quyền riêng tư nêu trên.
                </span>
              </label>

              {/* HAI NÚT: "ĐỂ SAU" VÀ "TÔI ĐỒNG Ý" */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-2.5 border border-[#2C2A26]/30 text-[#2C2A26] font-mono text-xs uppercase hover:bg-[#2C2A26]/5 cursor-pointer text-center"
                >
                  ĐỂ SAU
                </button>

                <button
                  type="button"
                  disabled={!consentChecked}
                  onClick={() => setTab('tai_anh')}
                  className={`w-full sm:w-auto px-7 py-2.5 font-mono text-xs uppercase tracking-wider text-center rounded-[1px] transition-colors ${
                    consentChecked
                      ? 'bg-[#A8322A] text-[#F2EDE3] hover:bg-[#A8322A]/90 cursor-pointer shadow-sm'
                      : 'bg-[#2C2A26]/20 text-[#2C2A26]/40 cursor-not-allowed'
                  }`}
                >
                  TÔI ĐỒNG Ý
                </button>
              </div>
            </div>
          )}

          {/* ===================================================================
              BƯỚC 2: TẢI ẢNH LÊN & KHUNG KÉO CẮT 3:4 THỦ CÔNG
              =================================================================== */}
          {tab === 'tai_anh' && (
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="micro-label text-[#A8322A]">ẢNH CÁ NHÂN ĐÃ ĐƯỢC CHẤP THUẬN</span>
                  <p className="text-xs font-sans text-[#6E5439] mt-0.5">
                    Hỗ trợ JPG, PNG, WEBP (tối đa 8MB). Kéo chuột để điều chỉnh khung dọc 3:4.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setTab('xin_phep')}
                  className="font-mono text-[11px] text-[#6E5439] hover:text-[#A8322A] underline cursor-pointer"
                >
                  Xem lại điều khoản
                </button>
              </div>

              {!rawImageSrc ? (
                /* VÙNG THẢ ẢNH */
                <label
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className="border-2 border-dashed border-[#2C2A26]/30 hover:border-[#A8322A] p-8 md:p-12 flex flex-col items-center justify-center gap-3 bg-[#F2EDE3]/50 cursor-pointer transition-colors text-center"
                >
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                  <div className="w-12 h-16 border border-[#2C2A26]/40 flex items-center justify-center font-mono text-xs text-[#2C2A26]/60">
                    3:4
                  </div>
                  <span className="font-display text-base text-[#2C2A26]">
                    Bấm để chọn ảnh từ máy hoặc kéo thả vào đây
                  </span>
                  <span className="font-mono text-xs text-[#6E5439]">
                    Ảnh nửa người hoặc toàn thân, góc chụp thẳng, ánh sáng đều
                  </span>
                </label>
              ) : (
                /* KHUNG KÉO CẮT 3:4 TỰ VIẾT BẰNG CSS TRANSFORM */
                <div className="flex flex-col gap-4">
                  <div
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    className="relative w-full max-w-[280px] mx-auto aspect-[3/4] border-2 border-[#A8322A] bg-[#2C2A26]/10 overflow-hidden cursor-move select-none shadow-md"
                  >
                    <img
                      src={rawImageSrc}
                      alt="Ảnh tải lên đang căn chỉnh"
                      draggable={false}
                      style={{
                        transform: `translate(${panX}px, ${panY}px) scale(${scale})`,
                        transformOrigin: 'center center',
                        maxWidth: 'none',
                      }}
                      className="absolute inset-0 m-auto select-none pointer-events-none"
                    />

                    {/* Lưới chữ thập hướng dẫn mắt nhìn */}
                    <div className="absolute inset-0 pointer-events-none border border-[#A8322A]/20">
                      <div className="w-full h-1/3 border-b border-[#A8322A]/20 top-1/3 absolute" />
                      <div className="w-full h-1/3 border-b border-[#A8322A]/20 top-2/3 absolute" />
                      <div className="h-full w-1/3 border-r border-[#A8322A]/20 left-1/3 absolute" />
                      <div className="h-full w-1/3 border-r border-[#A8322A]/20 left-2/3 absolute" />
                    </div>
                  </div>

                  {/* THANH ĐIỀU CHỈNH PHÓNG TO / THU NHỎ */}
                  <div className="flex items-center gap-3 max-w-sm mx-auto w-full px-2">
                    <span className="font-mono text-[10px] text-[#6E5439]">THU NHỎ</span>
                    <input
                      type="range"
                      min="0.6"
                      max="2.5"
                      step="0.05"
                      value={scale}
                      onChange={(e) => setScale(parseFloat(e.target.value))}
                      className="flex-1 accent-[#A8322A] cursor-pointer"
                    />
                    <span className="font-mono text-[10px] text-[#6E5439]">PHÓNG TO</span>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[#2C2A26]/10">
                    <button
                      type="button"
                      onClick={() => setRawImageSrc(null)}
                      className="font-mono text-xs text-[#6E5439] hover:text-[#A8322A] underline cursor-pointer"
                    >
                      Chọn bức ảnh khác
                    </button>

                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={handleProcessCroppedImage}
                      className="px-6 py-2.5 bg-[#A8322A] text-[#F2EDE3] font-mono text-xs uppercase tracking-wider hover:bg-[#A8322A]/90 transition-colors cursor-pointer shadow-sm"
                    >
                      {isProcessing ? 'ĐANG DỰNG ẢNH...' : 'ÁP DỤNG & MẶC THỬ'}
                    </button>
                  </div>
                </div>
              )}

              {uploadError && (
                <div className="p-3 bg-[#A8322A]/10 border border-[#A8322A]/30 text-xs font-mono text-[#A8322A]">
                  {uploadError}
                </div>
              )}

              {gentleErrorMessage && (
                <div className="p-3 bg-[#C39A27]/10 border border-[#C39A27]/40 text-xs font-sans text-[#2C2A26]">
                  {gentleErrorMessage}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
