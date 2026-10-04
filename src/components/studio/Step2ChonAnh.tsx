import React, { useState, useRef, useLayoutEffect } from 'react';
import { useStore, store } from '../../lib/store';
import { formatStudioStepLabel } from '../../types';
import { checkImageQuality } from '../../lib/tryOnGuard';

// Kích thước ảnh xuất ra: dọc 3:4, cạnh dài 1024px
const XUAT_W = 768;
const XUAT_H = 1024;

// Tỉ lệ để ảnh phủ kín khung (như object-fit: cover)
const tiLePhuKin = (khungW: number, khungH: number, anhW: number, anhH: number) =>
  Math.max(khungW / anhW, khungH / anhH);

export default function Step2ChonAnh() {
  const { userPhoto, selectedEvent, selectedRegion } = useStore();

  // Trạng thái modal xin phép quyền riêng tư
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [hasConsented, setHasConsented] = useState(false);
  const [hasDismissedConsent, setHasDismissedConsent] = useState(false);

  // File ảnh thô vừa chọn trước khi cắt cúp
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [qualityWarning, setQualityWarning] = useState<string | null>(null);

  // Trạng thái kéo & phóng to cắt ảnh 3:4 thủ công (không dùng thư viện ngoài)
  const [scale, setScale] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Kích thước thật của ảnh và bề rộng khung cắt trên màn hình.
  // Khung xem trước và ảnh xuất dùng chung một phép quy đổi, nên cắt sao ra vậy.
  const [anhGoc, setAnhGoc] = useState<{ w: number; h: number } | null>(null);
  const khungCatRef = useRef<HTMLDivElement | null>(null);
  const [khungW, setKhungW] = useState(320);
  const khungH = (khungW * 4) / 3;

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ---------------------------------------------------------------------------
  // 1. XỬ LÝ SỰ KIỆN BẤM TẢI ẢNH: BẬT MÀN XIN PHÉP NẾU CHƯA ĐỒNG Ý
  // ---------------------------------------------------------------------------
  const handleTriggerUpload = () => {
    setUploadError(null);
    if (!hasConsented) {
      setConsentChecked(false);
      setShowConsentModal(true);
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleConfirmConsent = () => {
    setHasConsented(true);
    setShowConsentModal(false);
    setHasDismissedConsent(false);
    // Kích hoạt mở hộp chọn file ngay sau khi đồng ý
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 100);
  };

  const handleDismissConsentModal = () => {
    setShowConsentModal(false);
    setConsentChecked(false);
    setHasDismissedConsent(true);
  };

  // ---------------------------------------------------------------------------
  // 2. NHẬN FILE ẢNH & KIỂM TRA ĐỊNH DẠNG (JPEG, PNG, WEBP, TỐI ĐA 8MB)
  // ---------------------------------------------------------------------------
  const processSelectedFile = (file: File) => {
    setUploadError(null);

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Chỉ nhận định dạng ảnh JPEG, PNG hoặc WebP.');
      return;
    }

    const MAX_SIZE = 8 * 1024 * 1024; // 8MB
    if (file.size > MAX_SIZE) {
      setUploadError('Dung lượng ảnh vượt quá 8MB, vui lòng chọn ảnh nhẹ hơn.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setRawImageSrc(result);
      setAnhGoc(null);
      setScale(1);
      setPanX(0);
      setPanY(0);
      setShowCropModal(true);
    };
    reader.onerror = () => {
      setUploadError('Không thể đọc file ảnh này. Vui lòng thử lại với ảnh khác.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
    // Reset value để người dùng có thể chọn lại cùng 1 file nếu muốn
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!hasConsented) {
        setConsentChecked(false);
        setShowConsentModal(true);
      } else {
        processSelectedFile(file);
      }
    }
  };

  // ---------------------------------------------------------------------------
  // 3. CẮT VỀ KHUNG DỌC 3:4 & XUẤT RASTER CANVAS (XOÁ EXIF, CẠNH DÀI 1024PX)
  // ---------------------------------------------------------------------------
  const handleConfirmCrop = () => {
    if (!rawImageSrc) return;

    const img = new Image();
    img.onload = () => {
      // Chuẩn hóa khung tỉ lệ 3:4, chiều rộng 768px, chiều cao 1024px (tối đa 1024px)
      const targetW = XUAT_W;
      const targetH = XUAT_H;
      const anhW = img.naturalWidth;
      const anhH = img.naturalHeight;

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Nền ngà giữ vùng trống nếu kéo lệch
      ctx.fillStyle = '#F2EDE3';
      ctx.fillRect(0, 0, targetW, targetH);

      // Quy đổi đúng như khung xem trước: ảnh phủ kín khung ở mức phóng 1,
      // độ kéo tính theo pixel khung xem trước nên nhân với tỉ lệ canvas trên khung.
      const quyDoi = targetW / khungW;
      const phuKin = tiLePhuKin(targetW, targetH, anhW, anhH);
      ctx.imageSmoothingQuality = 'high';
      ctx.save();
      ctx.translate(targetW / 2 + panX * quyDoi, targetH / 2 + panY * quyDoi);
      ctx.scale(phuKin * scale, phuKin * scale);
      ctx.drawImage(img, -anhW / 2, -anhH / 2, anhW, anhH);
      ctx.restore();

      // VẼ LÊN CANVAS MỚI ĐỂ LOẠI BỎ TOÀN BỘ SIÊU DỮ LIỆU EXIF (BAO GỒM TOẠ ĐỘ GPS,
      // THÔNG TIN THIẾT BỊ VÀ THỜI GIAN CHỤP) TRƯỚC KHI LƯU HOẶC GỬI ĐI.
      const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.85);

      // Kiểm tra chất lượng ảnh (độ sáng & kích thước) trên canvas
      checkImageQuality(croppedDataUrl).then((check) => {
        setQualityWarning(check.warningMessage);
      });

      store.setUserPhoto(croppedDataUrl);
      setShowCropModal(false);
      setRawImageSrc(null);
    };
    img.src = rawImageSrc;
  };

  // ---------------------------------------------------------------------------
  // 4. KÉO THẢ DI CHUYỂN KHUNG HÌNH (PAN)
  // ---------------------------------------------------------------------------
  // Không cho kéo hay thu nhỏ tới mức lộ khoảng trống trong khung
  const gioiHanKeo = (x: number, y: number, s: number) => {
    if (!anhGoc) return { x: 0, y: 0 };
    const phuKin = tiLePhuKin(khungW, khungH, anhGoc.w, anhGoc.h);
    const duX = Math.max(0, (anhGoc.w * phuKin * s - khungW) / 2);
    const duY = Math.max(0, (anhGoc.h * phuKin * s - khungH) / 2);
    return { x: Math.min(duX, Math.max(-duX, x)), y: Math.min(duY, Math.max(-duY, y)) };
  };

  // Đo bề rộng khung cắt, đo lại khi đổi kích thước màn hình
  useLayoutEffect(() => {
    const el = khungCatRef.current;
    if (!showCropModal || !el) return;
    const capNhat = () => setKhungW(el.clientWidth || 320);
    capNhat();
    const ro = new ResizeObserver(capNhat);
    ro.observe(el);
    return () => ro.disconnect();
  }, [showCropModal]);

  const handleMouseDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStartRef.current = { x: e.clientX - panX, y: e.clientY - panY };
  };

  const handleMouseMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const p = gioiHanKeo(e.clientX - dragStartRef.current.x, e.clientY - dragStartRef.current.y, scale);
    setPanX(p.x);
    setPanY(p.y);
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const doiMucPhong = (s: number) => {
    setScale(s);
    const p = gioiHanKeo(panX, panY, s);
    setPanX(p.x);
    setPanY(p.y);
  };

  const phuKinXemTruoc = anhGoc ? tiLePhuKin(khungW, khungH, anhGoc.w, anhGoc.h) : 1;

  // Chỉ bật nút sang bước 3 khi đã có ảnh người dùng
  const canProceed = Boolean(userPhoto);

  return (
    <div className="w-full flex flex-col gap-8 animate-in fade-in duration-200 select-none pb-20 md:pb-6">
      {/* Tiêu đề bước */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-[#2C2A26]/15 pb-4">
        <div>
          <span className="micro-label text-[#A8322A]">{formatStudioStepLabel(2, 'ANH CUA BAN')}</span>
          <h2 className="font-display text-2xl md:text-3xl text-[#2C2A26] font-normal mt-1">
            Tải ảnh của bạn để đưa vào trung tâm Xưởng phối
          </h2>
        </div>
        <div className="font-mono text-xs text-[#6E5439]">
          SỰ KIỆN: <strong className="text-[#2C2A26]">{selectedEvent.ten}</strong> ({selectedRegion.ten})
        </div>
      </div>

      {/* Input file ẩn */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* KHU VỰC TẢI ẢNH DUY NHẤT: GIÃN RỘNG TOÀN BỘ BỀ NGANG, KHÔNG CHIA CỘT */}
      <div className="w-full max-w-4xl mx-auto flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="micro-label text-[#2C2A26]">ẢNH CHÂN DUNG CÁ NHÂN</span>
          <span className="font-mono text-[11px] text-[#6E5439]">TỈ LỆ CHUẨN 3:4</span>
        </div>

        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={handleTriggerUpload}
          className={`border-2 border-dashed p-8 md:p-14 flex flex-col items-center justify-center text-center cursor-pointer transition-all relative corner-mark ${
            userPhoto
              ? 'border-[#A8322A] bg-[#F2EDE3]/50'
              : 'border-[#2C2A26]/30 bg-[#FBF8F2] hover:border-[#A8322A] hover:bg-[#F2EDE3]/30 min-h-[360px] md:min-h-[420px]'
          }`}
        >
          {userPhoto ? (
            <div className="flex flex-col items-center gap-5">
              <div className="w-48 md:w-56 aspect-[3/4] border border-[#A8322A] overflow-hidden shadow-md relative">
                <img
                  src={userPhoto}
                  alt="Ảnh chân dung của bạn đã cắt cúp"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 bg-[#A8322A] text-[#F2EDE3] font-mono text-[10px] px-2 py-0.5 tracking-wider">
                  3:4 ĐÃ CẮT
                </div>
              </div>

              <div className="text-center">
                <span className="font-mono text-xs uppercase tracking-wider text-[#A8322A] font-bold block">
                  ĐÃ SẴN SÀNG ĐƯA VÀO XƯỞNG PHỐI
                </span>
                <p className="font-sans text-xs text-[#6E5439] mt-1">
                  Bấm vào đây nếu muốn chọn một tấm ảnh khác
                </p>

                {qualityWarning && (
                  <div className="mt-3 p-3 bg-[#C39A27]/10 border border-[#C39A27]/30 text-left max-w-md mx-auto">
                    <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#8C6D1F] font-bold uppercase">
                      <span>▲</span> LƯU Ý CHẤT LƯỢNG ẢNH
                    </div>
                    <p className="font-sans text-xs text-[#2C2A26] mt-1 leading-relaxed">
                      {qualityWarning}
                    </p>
                    <span className="font-mono text-[10px] text-[#6E5439] block mt-1">
                      Bạn vẫn có thể tiếp tục sang bước phối đồ nếu muốn.
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center max-w-xl">
              {/* Biểu tượng khung ảnh hình khối tỉ lệ 3:4 */}
              <div className="w-16 h-20 border-2 border-[#2C2A26]/40 flex flex-col items-center justify-center mb-5 text-[#2C2A26]/60 bg-[#F2EDE3]/40">
                <span className="font-mono text-xs font-bold text-[#2C2A26]">3:4</span>
                <span className="font-mono text-[9px] text-[#6E5439]">DỌC</span>
              </div>

              <span className="font-display text-xl md:text-2xl text-[#2C2A26] block">
                Kéo thả ảnh của bạn vào đây hoặc bấm để chọn
              </span>
              <span className="font-mono text-xs text-[#6E5439] mt-1.5 mb-6">
                Định dạng JPEG, PNG, WebP · Dung lượng tối đa 8MB
              </span>

              {/* Bốn dòng hướng dẫn rõ ràng, nổi bật */}
              <div className="w-full border-t border-[#2C2A26]/15 pt-5 text-left font-sans text-sm text-[#2C2A26] space-y-2.5 bg-[#F2EDE3]/40 p-4 md:p-5 corner-mark">
                <div className="font-mono text-[11px] uppercase tracking-wider text-[#A8322A] font-bold mb-1">
                  BỐN GỢI Ý ĐỂ ẢNH MẶC THỬ RA ĐẸP NHẤT
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[#A8322A] font-bold text-base leading-relaxed select-none shrink-0">·</span>
                  <span className="leading-relaxed">Chụp đứng thẳng, thấy từ đầu gối trở lên.</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[#A8322A] font-bold text-base leading-relaxed select-none shrink-0">·</span>
                  <span className="leading-relaxed">Nền càng đơn giản càng dễ thay.</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[#A8322A] font-bold text-base leading-relaxed select-none shrink-0">·</span>
                  <span className="leading-relaxed">Ánh sáng đều, tránh ngược sáng.</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[#A8322A] font-bold text-base leading-relaxed select-none shrink-0">·</span>
                  <span className="leading-relaxed">Nên dùng ảnh một người để AI nhận diện và mặc thử chính xác nhất.</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {uploadError && (
          <p className="font-mono text-xs text-[#A8322A] bg-[#A8322A]/10 p-3 border border-[#A8322A]/20">
            {uploadError}
          </p>
        )}
      </div>

      {/* THANH ĐIỀU HƯỚNG BƯỚC Ở DƯỚI */}
      <div className="flex flex-col gap-2 pt-6 border-t border-[#2C2A26]/15">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => store.setStudioStep(1)}
            className="px-5 py-2.5 font-mono text-xs text-[#2C2A26] border border-[#2C2A26]/25 hover:border-[#2C2A26] transition-colors cursor-pointer"
          >
            ← QUAY LẠI BỐI CẢNH
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => store.setStudioStep(3)}
              className="px-4 py-3 font-mono text-xs text-[#2C2A26] border border-[#2C2A26]/30 hover:border-[#2C2A26] hover:bg-[#2C2A26]/5 transition-colors cursor-pointer"
            >
              XEM TRƯỚC KHÔNG CẦN ẢNH
            </button>

            <button
              type="button"
              onClick={() => store.setStudioStep(3)}
              className="px-8 py-3.5 text-xs font-mono uppercase tracking-widest corner-mark transition-all bg-[#A8322A] text-[#F2EDE3] hover:bg-[#A8322A]/90 cursor-pointer shadow-md"
            >
              TIẾP TỤC: VÀO XƯỞNG PHỐI →
            </button>
          </div>
        </div>

        {/* DÒNG MẢNH NHẮC NHỞ KHI CHƯA CÓ ẢNH HOẶC ĐÃ BẤM "ĐỂ SAU" */}
        {(!userPhoto || hasDismissedConsent) && (
          <div className="text-right">
            <span className="font-sans text-xs text-[#6E5439] inline-block pt-1">
              Cần một tấm ảnh để mặc thử. Bạn có thể quay lại bước này bất cứ lúc nào.
            </span>
          </div>
        )}
      </div>

      {/* =======================================================================
          MÀN XIN PHÉP (MODAL QUYỀN RIÊNG TƯ TRƯỚC KHI MỞ HỘP CHỌN FILE)
          ======================================================================= */}
      {showConsentModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-[#0D1826]/85 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-[#FBF8F2] border border-[#2C2A26] w-full max-w-lg shadow-2xl p-6 md:p-8 animate-in fade-in duration-150">
            <span className="micro-label text-[#A8322A] block mb-1">
              CAM KET QUYEN RIENG TU
            </span>
            <h3 className="font-display text-xl text-[#2C2A26] font-normal mb-4">
              Trước khi bạn tải ảnh chân dung lên
            </h3>

            {/* Bốn gạch đầu dòng cam kết minh bạch */}
            <ul className="space-y-3 font-sans text-xs text-[#2C2A26] border-y border-[#2C2A26]/12 py-4">
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 bg-[#A8322A] mt-1.5 shrink-0" />
                <span>
                  Ảnh của bạn được thu nhỏ ngay trên máy bạn trước khi gửi, thao tác này cũng xoá luôn thông tin vị trí đi kèm ảnh.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 bg-[#A8322A] mt-1.5 shrink-0" />
                <span>
                  Ảnh được gửi tới Google Gemini để dựng ảnh mô phỏng, và không lưu trên máy chủ nào của chúng tôi.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 bg-[#A8322A] mt-1.5 shrink-0" />
                <span>
                  Chúng tôi không giữ ảnh gốc và ảnh kết quả, trừ khi bạn tự bấm lưu vào Lookbook trên máy mình.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 bg-[#A8322A] mt-1.5 shrink-0" />
                <span>
                  Ảnh kết quả là ảnh do AI dựng, không phải ảnh thật, và luôn có dấu ghi rõ điều đó.
                </span>
              </li>
            </ul>

            {/* Ô ĐỒNG Ý — ĐIỀU KIỆN TIÊN QUYẾT: KHÔNG BẬT SẴN (mặc định là false) */}
            <label className="flex items-start gap-3 mt-4 pt-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={consentChecked}
                onChange={(e) => setConsentChecked(e.target.checked)}
                className="mt-0.5 accent-[#A8322A] w-4 h-4 rounded-none cursor-pointer"
              />
              <span className="font-sans text-xs text-[#2C2A26] font-medium">
                Tôi đã đọc và hiểu các điều khoản quyền riêng tư trên.
              </span>
            </label>

            {/* Hai nút lựa chọn: "ĐỂ SAU" và "TÔI ĐỒNG Ý" */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 mt-6 pt-4 border-t border-[#2C2A26]/12">
              <button
                type="button"
                onClick={handleDismissConsentModal}
                className="w-full sm:w-auto px-5 py-2.5 font-mono text-xs text-[#2C2A26] border border-[#2C2A26]/20 hover:border-[#2C2A26] transition-colors cursor-pointer"
              >
                ĐỂ SAU
              </button>

              <button
                type="button"
                disabled={!consentChecked}
                onClick={handleConfirmConsent}
                className={`w-full sm:w-auto px-6 py-2.5 font-mono text-xs uppercase tracking-wider transition-all ${
                  consentChecked
                    ? 'bg-[#A8322A] text-[#F2EDE3] hover:bg-[#A8322A]/90 cursor-pointer shadow-sm'
                    : 'bg-[#2C2A26]/20 text-[#2C2A26]/40 cursor-not-allowed'
                }`}
              >
                TÔI ĐỒNG Ý
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          MODAL CẮT CÚP KHUNG DỌC 3:4 THỦ CÔNG BẰNG TAY (KHÔNG DÙNG THƯ VIỆN NGOÀI)
          ======================================================================= */}
      {showCropModal && rawImageSrc && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-[#0D1826]/90 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-[#FBF8F2] border border-[#2C2A26] w-full max-w-xl shadow-2xl p-6 flex flex-col gap-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-[#2C2A26]/12 pb-3">
              <div>
                <span className="micro-label text-[#A8322A]">CAN CHINH KHUNG HINH</span>
                <h3 className="font-display text-lg text-[#2C2A26]">
                  Cắt ảnh về tỉ lệ 3:4 để lên dáng chuẩn
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowCropModal(false);
                  setRawImageSrc(null);
                }}
                className="text-xs font-mono text-[#6E5439] hover:text-[#2C2A26]"
              >
                HUỶ
              </button>
            </div>

            <p className="font-sans text-xs text-[#6E5439]">
              Giữ và kéo chuột để di chuyển khung hình; dùng thanh trượt để phóng to hoặc thu nhỏ cho vừa vặn.
            </p>

            {/* Vùng xem trước 3:4 có thể kéo (Pan) */}
            <div
              ref={khungCatRef}
              onPointerDown={handleMouseDown}
              onPointerMove={handleMouseMove}
              onPointerUp={handleMouseUp}
              onPointerCancel={handleMouseUp}
              className="w-full max-w-xs mx-auto aspect-[3/4] border-2 border-[#A8322A] overflow-hidden relative bg-[#F2EDE3] cursor-move select-none shadow-inner touch-none"
            >
              <img
                src={rawImageSrc}
                alt="Ảnh đang căn chỉnh"
                draggable={false}
                onLoad={(e) => {
                  const el = e.currentTarget;
                  setAnhGoc({ w: el.naturalWidth, h: el.naturalHeight });
                }}
                style={{
                  // Ở mức phóng 1 ảnh phủ kín khung, giống hệt ảnh xuất ra
                  width: anhGoc ? anhGoc.w * phuKinXemTruoc : undefined,
                  height: anhGoc ? anhGoc.h * phuKinXemTruoc : undefined,
                  left: '50%',
                  top: '50%',
                  transform: `translate(-50%, -50%) translate(${panX}px, ${panY}px) scale(${scale})`,
                  transformOrigin: 'center center',
                  maxWidth: 'none',
                  opacity: anhGoc ? 1 : 0,
                }}
                className="absolute select-none pointer-events-none"
              />

              {/* Lưới chữ thập canh tỉ lệ */}
              <div className="absolute inset-0 pointer-events-none border border-[#A8322A]/30">
                <div className="w-full h-1/3 border-b border-[#A8322A]/20 top-1/3 absolute" />
                <div className="w-full h-1/3 border-b border-[#A8322A]/20 top-2/3 absolute" />
                <div className="h-full w-1/3 border-r border-[#A8322A]/20 left-1/3 absolute" />
                <div className="h-full w-1/3 border-r border-[#A8322A]/20 left-2/3 absolute" />
              </div>
            </div>

            {/* Thanh trượt phóng to / thu nhỏ */}
            <div className="flex items-center gap-3 pt-2">
              <span className="font-mono text-xs text-[#6E5439]">THU NHỎ</span>
              <input
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={scale}
                onChange={(e) => doiMucPhong(parseFloat(e.target.value))}
                className="flex-1 accent-[#A8322A] cursor-pointer"
              />
              <span className="font-mono text-xs text-[#6E5439]">PHÓNG TO</span>
            </div>

            {/* Nút lưu xác nhận cắt cúp */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#2C2A26]/12">
              <button
                type="button"
                onClick={() => {
                  setShowCropModal(false);
                  setRawImageSrc(null);
                }}
                className="px-4 py-2 font-mono text-xs text-[#2C2A26] border border-[#2C2A26]/20 hover:border-[#2C2A26]"
              >
                CHỌN LẠI ẢNH KHÁC
              </button>

              <button
                type="button"
                onClick={handleConfirmCrop}
                className="px-6 py-2 bg-[#A8322A] text-[#F2EDE3] font-mono text-xs uppercase tracking-wider hover:bg-[#A8322A]/90 shadow-sm"
              >
                XÁC NHẬN CẮT 3:4
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
