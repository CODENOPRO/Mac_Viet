import React, { useState, useEffect, useRef } from 'react';
import { useStore, store } from '../../lib/store';
import { GARMENTS } from '../../data/garments';
import { TRADITIONAL_COLORS, HISTORICAL_PALETTES } from '../../data/palettes';
import { MOTIFS } from '../../data/motifs';
import { BACKGROUNDS, chonBoiCanhTuDong } from '../../data/backgrounds';
import { GarmentLayer, Garment, Motif, Background } from '../../types';
import { tinhHaiHoa, ColorInputItem } from '../../lib/colorHarmony';
import { kiemTraVanHoa } from '../../lib/cultureGuard';
import { macThu } from '../../lib/tryOn';
import CultureFlagPanel from './CultureFlagPanel';
import BanDaChonPanel from './BanDaChonPanel';
import AiExplanationModal from './AiExplanationModal';
import { DEMO_RESPONSES } from '../../data/demoResponses';
import { getDailyQuota, exportStampedImage } from '../../lib/tryOnGuard';

export default function Step3PhoiDo() {
  const {
    lookState,
    selectedEvent,
    selectedRegion,
    contextSetup,
    userPhoto,
    activeTryOnImage,
    tryOnHistory,
    tryOnBackgroundId,
    tryOnQuality,
    isTryOnStale,
    lastTriedLook,
  } = useStore();

  const [activeLayer, setActiveLayer] = useState<'L1' | 'L2' | 'L3' | 'L4' | 'L5' | 'L6'>('L1');
  const [isProcessing, setIsProcessing] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [showBgDropdown, setShowBgDropdown] = useState(false);
  const [showDisclaimerModal, setShowDisclaimerModal] = useState(false);
  const [showWhyModal, setShowWhyModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [dailyQuota, setDailyQuota] = useState(getDailyQuota);
  const [isNetworkError, setIsNetworkError] = useState(false);
  const [isRefusalError, setIsRefusalError] = useState(false);

  const timerRef = useRef<any>(null);

  // 1. Xác định bối cảnh nền mặc định (nếu chưa chọn, tự khớp theo sự kiện & vùng)
  const currentBg: Background =
    BACKGROUNDS.find((b) => b.id === tryOnBackgroundId) ||
    chonBoiCanhTuDong(selectedEvent.id, selectedRegion.id);

  // 2. Trạng thái ảnh: kiểm tra người dùng đã có ảnh hay chưa
  const hasPhoto = Boolean(userPhoto || activeTryOnImage);
  const displayedImage = activeTryOnImage || userPhoto || '';

  // ---------------------------------------------------------------------------
  // 3. ĐẾM THỜI GIAN KHI ĐANG DỰNG ẢNH
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (isProcessing) {
      setSecondsElapsed(0);
      timerRef.current = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isProcessing]);

  // ---------------------------------------------------------------------------
  // 4. LẮNG NGHE PHÍM TẮT UNDO / REDO
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          store.redo();
        } else {
          e.preventDefault();
          store.undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        store.redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ---------------------------------------------------------------------------
  // 5. THỰC HIỆN HÀNH ĐỘNG MẶC THỬ / MẶC LẠI
  // ---------------------------------------------------------------------------
  const handleTriggerTryOn = async () => {
    if (isProcessing) return;

    // Giới hạn chế độ Kỹ tính 2 lượt / ngày
    let actualQuality = tryOnQuality;
    if (tryOnQuality === 'ky' && dailyQuota.countKy >= 2) {
      actualQuality = 'nhanh';
      store.setTryOnQuality('nhanh');
      setStatusMessage('Hôm nay bạn đã dùng hết 2 lượt chế độ Kỹ tính. Hệ thống chuyển sang chế độ Nhanh.');
    }

    setIsProcessing(true);
    setIsNetworkError(false);
    setIsRefusalError(false);
    if (!statusMessage?.includes('2 lượt')) {
      setStatusMessage(null);
    }
    const controller = new AbortController();
    setAbortController(controller);

    try {
      // Chuẩn bị ảnh gốc làm đầu vào
      const sourcePersonPhoto = userPhoto || DEMO_RESPONSES.renderLook.imageUrl;

      // Kiểm tra chế độ đổi nhanh 1 món nếu đã có ảnh mặc thử trước và chỉ đúng 1 món thay đổi
      const canQuickChange = Boolean(activeTryOnImage && lastTriedLook);

      const res = await macThu({
        anhNguoi: sourcePersonPhoto,
        look: lookState,
        boiCanh: selectedEvent,
        background: currentBg,
        chatLuong: actualQuality,
        anhTruoc: canQuickChange ? activeTryOnImage || undefined : undefined,
      });

      if (!controller.signal.aborted) {
        if (res?.anh) {
          store.setActiveTryOnImage(res.anh);
          store.addToTryOnHistory(res.anh);
          store.setLastTriedLook(lookState);
          store.setIsTryOnStale(false);
        }
        if (res.canhBao && res.canhBao.length > 0) {
          const mainWarning = res.canhBao[0];
          setStatusMessage(mainWarning);
          if (mainWarning.includes('chưa dựng được ảnh') || mainWarning.includes('người mẫu')) {
            setIsRefusalError(true);
          }
        }
        setDailyQuota(getDailyQuota());
      }
    } catch (err: any) {
      if (!controller.signal.aborted) {
        if (err?.message === 'NETWORK_DISCONNECTED') {
          setIsNetworkError(true);
          setStatusMessage('Mạng bị ngắt quãng trong lúc dựng ảnh. Ảnh cũ vẫn được giữ nguyên.');
        } else {
          setStatusMessage('Lần này hệ thống chưa dựng được ảnh. Bạn thử ảnh sáng hơn và nền đơn giản hơn, hoặc dùng người mẫu.');
          setIsRefusalError(true);
        }
      }
    } finally {
      setIsProcessing(false);
      setAbortController(null);
      setDailyQuota(getDailyQuota());
    }
  };

  const handleCancelProcessing = () => {
    if (abortController) {
      abortController.abort();
    }
    setIsProcessing(false);
    setStatusMessage('Đã huỷ tác vụ mặc thử. Ảnh cũ vẫn được giữ nguyên.');
  };

  const handleSwitchToModelPersona = () => {
    store.setUserPhoto(DEMO_RESPONSES.renderLook.imageUrl);
    setIsRefusalError(false);
    setStatusMessage('Đã chuyển sang dáng người mẫu tham chiếu chuẩn mực. Đang chuẩn bị dựng lại...');
    setTimeout(() => {
      handleTriggerTryOn();
    }, 150);
  };

  // ---------------------------------------------------------------------------
  // 6. TÍNH TOÁN CÁC CHỈ SỐ HÀI HÒA & CỜ VĂN HÓA (CỘT PHẢI 24%)
  // ---------------------------------------------------------------------------
  const mauThucTe: ColorInputItem[] = [
    {
      hex: lookState.mauChinh || lookState.thuongY?.mauTruyenThong?.[0] || '#16243A',
      trongSo: 0.5,
      lop: 'thuong_y',
    },
    {
      hex: lookState.haY?.mauTruyenThong?.[0] || '#F2EDE3',
      trongSo: 0.25,
      lop: 'ha_y',
    },
    {
      hex: lookState.thuPhuc?.mauTruyenThong?.[0] || '#2C2A26',
      trongSo: 0.1,
      lop: 'thu_phuc',
    },
    {
      hex: lookState.hai?.mauTruyenThong?.[0] || '#16243A',
      trongSo: 0.05,
      lop: 'hai',
    },
    {
      hex: '#F2EDE3',
      trongSo: 0.1,
      lop: 'phu_kien',
    },
  ];

  const colorHarmonyResult = tinhHaiHoa(mauThucTe, selectedEvent);
  const scoreMau = colorHarmonyResult.diem;

  const topLevel = lookState.thuongY?.mucTrangTrong ?? 3;
  const diffFormality = Math.abs(topLevel - selectedEvent.mucTrangTrongYeuCau);
  const scoreBoiCanh = diffFormality === 0 ? 96 : diffFormality === 1 ? 82 : 55;

  const cultureFlagResult = kiemTraVanHoa(
    lookState,
    selectedEvent,
    contextSetup.phongCach,
    contextSetup.regionId
  );

  const getGarmentsByLayer = (layer: GarmentLayer): Garment[] => {
    return GARMENTS.filter((g) => g.lop === layer);
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-150 select-none pb-28 md:pb-12">
      {/* THANH ĐIỀU HƯỚNG BƯỚC Ở TRÊN & NÚT HOÀN TÁC */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-[#FBF8F2] border border-[#2C2A26]/15 corner-mark">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => store.setStudioStep(2)}
            className="px-3 py-1.5 font-mono text-xs text-[#2C2A26] border border-[#2C2A26]/20 hover:border-[#2C2A26] transition-colors"
          >
            ← BƯỚC 2: ĐỔI ẢNH
          </button>

          <span className="font-mono text-xs text-[#6E5439] hidden sm:inline ml-2">
            Đang phối cho sự kiện: <strong className="text-[#2C2A26]">{selectedEvent.ten}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => store.undo()}
            disabled={!store.canUndo()}
            title="Hoàn tác (Ctrl+Z)"
            className={`px-2.5 py-1 text-xs font-mono border transition-colors ${
              store.canUndo()
                ? 'border-[#2C2A26] bg-[#F2EDE3] text-[#2C2A26] hover:bg-[#2C2A26] hover:text-[#F2EDE3] cursor-pointer'
                : 'border-[#2C2A26]/20 text-[#2C2A26]/30 cursor-not-allowed'
            }`}
          >
            ← HOÀN TÁC
          </button>

          <button
            type="button"
            onClick={() => store.redo()}
            disabled={!store.canRedo()}
            title="Làm lại (Ctrl+Y)"
            className={`px-2.5 py-1 text-xs font-mono border transition-colors ${
              store.canRedo()
                ? 'border-[#2C2A26] bg-[#F2EDE3] text-[#2C2A26] hover:bg-[#2C2A26] hover:text-[#F2EDE3] cursor-pointer'
                : 'border-[#2C2A26]/20 text-[#2C2A26]/30 cursor-not-allowed'
            }`}
          >
            LÀM LẠI →
          </button>

          <button
            type="button"
            onClick={() => store.pickRandomValidLook()}
            className="px-3 py-1 border border-[#C39A27] text-[#C39A27] hover:bg-[#C39A27] hover:text-[#0D1826] text-xs font-mono uppercase tracking-wider transition-colors ml-2"
          >
            PHỐI NGẪU NHIÊN
          </button>

          <button
            type="button"
            onClick={() => store.setStudioStep(4)}
            className="px-4 py-1.5 bg-[#2C2A26] text-[#F2EDE3] hover:bg-[#16243A] font-mono text-xs uppercase tracking-wider transition-colors ml-1"
          >
            XEM LOOK CARD →
          </button>
        </div>
      </div>

      {/* =======================================================================
          BỐ CỤC BA KHU VỰC: TRÁI 50% (ẢNH + BẠN ĐÃ CHỌN) | GIỮA 28% (6 LỚP) | PHẢI 22% (CHỈ SỐ)
          ======================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-[50%_28%_22%] gap-5 items-start">
        {/* =====================================================================
            CỘT TRÁI (50%): KHU ẢNH VÀ KHỐI BẠN ĐÃ CHỌN NẰM NGAY CẠNH NHAU
            ===================================================================== */}
        <div className="lg:sticky lg:top-4 grid grid-cols-1 md:grid-cols-2 gap-3.5 items-start">
          <div className="border border-[#2C2A26]/18 bg-[#FBF8F2] p-3.5 corner-mark flex flex-col gap-2.5 shadow-xs">
            {/* 1. KHUNG ẢNH CHÍNH TỈ LỆ 3:4 */}
            <div className="w-full aspect-[3/4] bg-[#0D1826] border border-[#2C2A26]/30 relative overflow-hidden flex items-center justify-center">
              {isProcessing ? (
                /* SKELETON 3:4 ĐÚNG HÌNH KHỐI VỚI HIỆU ỨNG LƯỚT SÁNG (KHÔNG DÙNG SPINNER TRÒN) */
                <div className="w-full h-full relative flex flex-col items-center justify-center p-6 text-center bg-[#0D1826]">
                  {/* Dải lướt sáng skeleton */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#F2EDE3]/10 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />

                  {/* Khung mô phỏng dáng người */}
                  <div className="w-28 h-36 border border-[#C39A27]/40 mb-4 flex items-center justify-center bg-[#16243A]/60">
                    <span className="font-mono text-[10px] text-[#C39A27] tracking-widest uppercase">
                      VIỆT PHỤC
                    </span>
                  </div>

                  <span className="font-display text-lg text-[#F2EDE3] block mb-1">
                    Đang dệt lên người bạn
                  </span>

                  <span className="font-mono text-xs text-[#C39A27] tracking-wider block mb-4">
                    {secondsElapsed < 10 ? `0${secondsElapsed}` : secondsElapsed}S TRÔI QUA · CHẾ ĐỘ {tryOnQuality.toUpperCase()}
                  </span>

                  <button
                    type="button"
                    onClick={handleCancelProcessing}
                    className="px-3.5 py-1 border border-[#F2EDE3]/30 text-[#F2EDE3]/70 hover:text-[#F2EDE3] hover:border-[#F2EDE3] font-mono text-[11px] uppercase tracking-wider transition-colors z-10 cursor-pointer"
                  >
                    HUỶ THAO TÁC
                  </button>
                </div>
              ) : !hasPhoto ? (
                /* KHỐI TRỐNG TỈ LỆ 3:4 VIỀN ĐỨT NÉT KHI CHƯA CÓ ẢNH */
                <div className="w-full h-full border-2 border-dashed border-[#2C2A26]/30 bg-[#F2EDE3]/50 flex flex-col items-center justify-center p-6 text-center gap-3">
                  <div className="w-16 h-20 border border-dashed border-[#2C2A26]/40 flex items-center justify-center bg-[#FBF8F2]/80">
                    <span className="font-mono text-[10px] text-[#6E5439] tracking-widest uppercase">3:4</span>
                  </div>
                  <span className="font-display text-lg text-[#2C2A26]">
                    Chưa có ảnh để mặc thử
                  </span>
                  <button
                    type="button"
                    onClick={() => store.setStudioStep(2)}
                    className="px-3.5 py-1.5 border border-[#A8322A] bg-[#A8322A] text-[#F2EDE3] hover:bg-[#A8322A]/90 font-mono text-[11px] uppercase tracking-wider transition-colors cursor-pointer shadow-xs"
                  >
                    Thêm ảnh của tôi
                  </button>
                </div>
              ) : (
                /* ẢNH HIỂN THỊ (GỐC HOẶC MẶC THỬ) */
                <div className="w-full h-full relative">
                  <img
                    src={displayedImage}
                    alt="Người mặc trang phục cổ truyền"
                    className="w-full h-full object-cover"
                  />

                  {/* KHI CHƯA MẶC THỬ: PHỦ LỚP MỜ NHẸ VÀ DÒNG CHỮ GIỮA ẢNH */}
                  {!activeTryOnImage && (
                    <div className="absolute inset-0 bg-[#0D1826]/40 backdrop-blur-[1px] flex flex-col items-center justify-center p-4 text-center">
                      <span className="font-display text-xl text-[#F2EDE3] drop-shadow-md">
                        Chọn đồ rồi bấm Mặc thử
                      </span>
                      <span className="font-mono text-[11px] text-[#F2EDE3]/80 mt-1 uppercase tracking-widest">
                        ẢNH GỐC ĐÃ SẴN SÀNG
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 3. DƯỚI ẢNH: HAI DÒNG NHÃN BẮT BUỘC THEO QUY CHUẨN */}
            <div className="pt-2 flex flex-col gap-1 border-t border-[#2C2A26]/12">
              <div className="font-mono text-[11px] font-bold text-[#A8322A] tracking-wider uppercase">
                ANH MINH HOA DO AI DUNG
              </div>
              <button
                type="button"
                onClick={() => setShowWhyModal(true)}
                className="text-left font-sans text-xs text-[#6E5439] hover:text-[#A8322A] hover:underline transition-colors cursor-pointer leading-snug"
              >
                Chi tiết cổ áo, số khuy, hoa văn trong ảnh có thể chưa đúng. Đối chiếu với bảng bên cạnh.
              </button>
            </div>

            {/* 4. NÚT DỰNG LẠI NGAY DƯỚI ẢNH, KÈM DÒNG NHỎ */}
            <div className="flex flex-col gap-1 pt-0.5">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => {
                  if (!hasPhoto) {
                    store.setStudioStep(2);
                    return;
                  }
                  handleTriggerTryOn();
                }}
                className={`w-full py-2.5 px-3 border border-[#2C2A26]/30 font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs ${
                  !hasPhoto
                    ? 'bg-[#16243A]/40 text-[#F2EDE3]/60 hover:bg-[#16243A]/60'
                    : 'bg-[#16243A] text-[#F2EDE3] hover:bg-[#0D1826]'
                }`}
                title={!hasPhoto ? 'Cần một tấm ảnh để mặc thử.' : ''}
              >
                <span>DỰNG LẠI</span>
              </button>
              <span className="font-sans text-[11px] text-[#6E5439] text-center">
                Mỗi lần dựng cho kết quả hơi khác.
              </span>
            </div>

            {/* CÁC THAO TÁC MẶC THỬ VÀ CHẾ ĐỘ */}
            <div className="flex flex-col gap-2.5 pt-1 border-t border-[#2C2A26]/10">
              <div className="flex items-center gap-2">
                {/* NÚT CHÍNH: MẶC THỬ */}
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => {
                    if (!hasPhoto) {
                      store.setStudioStep(2);
                      return;
                    }
                    handleTriggerTryOn();
                  }}
                  className={`flex-1 py-2.5 px-3 text-xs font-mono uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all corner-mark shadow-sm cursor-pointer ${
                    isProcessing
                      ? 'bg-[#A8322A]/50 text-[#F2EDE3]/60 cursor-not-allowed'
                      : !hasPhoto
                      ? 'bg-[#A8322A]/40 text-[#F2EDE3]/70 hover:bg-[#A8322A]/60'
                      : 'bg-[#A8322A] text-[#F2EDE3] hover:bg-[#A8322A]/90 active:scale-[0.99]'
                  }`}
                  title={!hasPhoto ? 'Cần một tấm ảnh để mặc thử.' : ''}
                >
                  {isTryOnStale && activeTryOnImage && (
                    <span className="w-2 h-2 rounded-full bg-[#F2EDE3] animate-pulse" />
                  )}
                  <span>{activeTryOnImage ? (isTryOnStale ? 'MẶC LẠI' : 'MẶC THỬ LẠI') : 'MẶC THỬ'}</span>
                </button>

                {/* CÔNG TẮC CHẤT LƯỢNG: NHANH / KỸ */}
                <div className="flex items-center border border-[#2C2A26]/20 bg-[#F2EDE3] p-0.5 text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => store.setTryOnQuality('nhanh')}
                    className={`px-2.5 py-1.5 transition-colors cursor-pointer ${
                      tryOnQuality === 'nhanh'
                        ? 'bg-[#16243A] text-[#F2EDE3] font-bold'
                        : 'text-[#6E5439] hover:text-[#2C2A26]'
                    }`}
                  >
                    NHANH
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (dailyQuota.countKy >= 2) {
                        setStatusMessage('Hôm nay bạn đã dùng hết 2 lượt chế độ Kỹ tính. Hệ thống sẽ dựng ở chế độ Nhanh.');
                        store.setTryOnQuality('nhanh');
                      } else {
                        store.setTryOnQuality('ky');
                      }
                    }}
                    title="Kỹ tính tối đa 2 lượt / ngày"
                    className={`px-2.5 py-1.5 transition-colors cursor-pointer ${
                      tryOnQuality === 'ky'
                        ? 'bg-[#16243A] text-[#F2EDE3] font-bold'
                        : 'text-[#6E5439] hover:text-[#2C2A26]'
                    }`}
                  >
                    KỸ
                  </button>
                </div>
              </div>

              {/* DÒNG NHẮC HẠN MỨC MỀM TRONG NGÀY (MỤC 2) */}
              {dailyQuota.totalCount >= 20 && (
                <div className="p-2 bg-[#F2EDE3] border border-[#A8322A]/30 text-[11px] font-sans text-[#A8322A]">
                  Bạn đã dựng 20 ảnh hôm nay, cân nhắc dùng chế độ Nhanh.
                </div>
              )}

              {/* Chú thích công tắc chất lượng */}
              <div className="flex items-center justify-between text-[10px] font-mono text-[#6E5439] px-0.5">
                <span>{tryOnQuality === 'ky' ? `Kỹ (${dailyQuota.countKy}/2 lượt hôm nay)` : `Nhanh (${dailyQuota.totalCount} lượt hôm nay)`}</span>
                {isTryOnStale && activeTryOnImage && (
                  <span className="text-[#A8322A] font-bold">Lựa chọn đồ đã đổi</span>
                )}
              </div>

              {/* Ô CHỌN BỐI CẢNH NỀN (MẶC ĐỊNH THEO SỰ KIỆN, BẤM MỞ 8 NỀN) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowBgDropdown(!showBgDropdown)}
                  className="w-full flex items-center justify-between p-2.5 border border-[#2C2A26]/20 bg-[#F2EDE3] text-left hover:border-[#2C2A26]/50 transition-colors cursor-pointer"
                >
                  <div className="flex flex-col">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-[#6E5439]">
                      BỐI CẢNH NỀN ({currentBg.id})
                    </span>
                    <span className="font-display text-xs text-[#2C2A26] font-medium">
                      {currentBg.ten}
                    </span>
                  </div>
                  <span className="font-mono text-xs text-[#6E5439]">
                    {showBgDropdown ? '▲' : '▼'}
                  </span>
                </button>

                {showBgDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[#FBF8F2] border border-[#2C2A26] shadow-xl z-30 max-h-56 overflow-y-auto p-1.5">
                    {BACKGROUNDS.map((bg) => {
                      const isSelected = bg.id === currentBg.id;
                      return (
                        <button
                          key={bg.id}
                          type="button"
                          onClick={() => {
                            store.setTryOnBackgroundId(bg.id);
                            setShowBgDropdown(false);
                          }}
                          className={`w-full text-left p-2 flex flex-col transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-[#16243A] text-[#F2EDE3]'
                              : 'hover:bg-[#F2EDE3] text-[#2C2A26]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-display text-xs">{bg.ten}</span>
                            <span className="font-mono text-[10px] opacity-75">{bg.id}</span>
                          </div>
                          <span className="font-sans text-[10px] opacity-70 line-clamp-1 mt-0.5">
                            {bg.moTaChoAI}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* 3. DẢI ẢNH NHỎ CÁC LẦN MẶC THỬ TRƯỚC */}
            {tryOnHistory.length > 0 && (
              <div className="pt-2 border-t border-[#2C2A26]/12">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#6E5439] block mb-1.5">
                  LỊCH SỬ THỬ TRONG PHIÊN ({tryOnHistory.length}/6)
                </span>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {tryOnHistory.map((histImg, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => store.setActiveTryOnImage(histImg)}
                      className={`w-12 aspect-[3/4] shrink-0 border overflow-hidden cursor-pointer transition-all ${
                        activeTryOnImage === histImg
                          ? 'border-[#A8322A] ring-2 ring-[#A8322A]/50 scale-105'
                          : 'border-[#2C2A26]/30 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={histImg} alt={`Lần thử ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 4. DƯỚI CÙNG: CÁC NÚT HÀNH ĐỘNG VÀ RANH GIỚI VĂN HÓA */}
            <div className="pt-2 border-t border-[#2C2A26]/12 flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => exportStampedImage(displayedImage, `mac-viet-${selectedEvent.id}.jpg`)}
                  className="px-3 py-1.5 border border-[#2C2A26]/30 hover:border-[#2C2A26] bg-[#F2EDE3] font-mono text-[10px] uppercase tracking-wider text-[#2C2A26] transition-colors cursor-pointer flex-1 text-center"
                >
                  TẢI ẢNH (CÓ DẤU AI)
                </button>

                <button
                  type="button"
                  onClick={() => setShowWhyModal(true)}
                  className="text-right font-sans text-xs text-[#A8322A] hover:underline cursor-pointer"
                >
                  Ranh giới văn hoá AI →
                </button>
              </div>
            </div>

            {/* KHỐI XỬ LÝ LỖI VÀ THÔNG BÁO VĂN HOÁ TỬ TẾ */}
            {statusMessage && (
              <div className="p-3 bg-[#F2EDE3] border border-[#2C2A26]/20 flex flex-col gap-2">
                <p className="font-sans text-xs text-[#2C2A26] leading-relaxed">
                  {statusMessage}
                </p>

                {/* NÚT THỬ LẠI KHI MẠNG RỚT (TÌNH HUỐNG F) */}
                {isNetworkError && (
                  <button
                    type="button"
                    onClick={handleTriggerTryOn}
                    className="self-start px-3 py-1 bg-[#A8322A] text-[#F2EDE3] font-mono text-[11px] uppercase tracking-wider hover:bg-[#A8322A]/90 cursor-pointer"
                  >
                    THỬ LẠI
                  </button>
                )}

                {/* NÚT CHUYỂN SANG DÙNG NGƯỜI MẪU (TÌNH HUỐNG A) */}
                {isRefusalError && (
                  <button
                    type="button"
                    onClick={handleSwitchToModelPersona}
                    className="self-start px-3 py-1 bg-[#16243A] text-[#F2EDE3] font-mono text-[11px] uppercase tracking-wider hover:bg-[#2C2A26] cursor-pointer"
                  >
                    DÙNG NGƯỜI MẪU THAM CHIẾU
                  </button>
                )}
              </div>
            )}
          </div>

          {/* CỘT 2 NẰM NGAY CẠNH ẢNH: KHỐI BẠN ĐÃ CHỌN */}
          <BanDaChonPanel onOpenWhyModal={() => setShowWhyModal(true)} />
        </div>

        {/* =====================================================================
            CỘT GIỮA (36%): KHU CHỌN SÁU LỚP PHỤC TRANG (THU GỌN VỪA KHUNG)
            ===================================================================== */}
        <div className="flex flex-col gap-4">
          {/* Thanh 6 tab lớp */}
          <div className="flex flex-wrap gap-1 p-1 bg-[#F2EDE3] border border-[#2C2A26]/15">
            {[
              { id: 'L1', label: '1. THƯỢNG Y' },
              { id: 'L2', label: '2. HẠ Y' },
              { id: 'L3', label: '3. THỦ PHỤC' },
              { id: 'L4', label: '4. HÀI' },
              { id: 'L5', label: '5. HOA VĂN' },
              { id: 'L6', label: '6. MÀU SẮC' },
            ].map((tab) => {
              const isActive = activeLayer === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveLayer(tab.id as any)}
                  className={`flex-1 min-w-[70px] py-1.5 px-1 font-mono text-[10px] tracking-wider text-center transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#16243A] text-[#F2EDE3] font-bold'
                      : 'text-[#6E5439] hover:text-[#2C2A26]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* NỘI DUNG TỪNG LỚP */}
          <div className="border border-[#2C2A26]/15 bg-[#FBF8F2] p-4 corner-mark min-h-[460px]">
            {/* LỚP 1: THƯỢNG Y */}
            {activeLayer === 'L1' && (
              <div className="flex flex-col gap-3">
                <span className="micro-label text-[#2C2A26]">LỚP 1 · ÁO KHOÁC CHÍNH (THƯỢNG Y)</span>
                <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto pr-1">
                  {getGarmentsByLayer('thuong_y').map((g) => {
                    const isSelected = lookState.thuongY?.id === g.id;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => store.setThuongY(g)}
                        className={`p-3 text-left border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#A8322A] bg-[#F2EDE3]'
                            : 'border-[#2C2A26]/15 bg-[#FBF8F2] hover:border-[#2C2A26]/40'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-display text-sm font-medium text-[#2C2A26]">{g.ten}</span>
                        </div>
                        <p className="font-sans text-xs text-[#6E5439] line-clamp-2 mt-1">{g.moTaNgan}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* LỚP 2: HẠ Y */}
            {activeLayer === 'L2' && (
              <div className="flex flex-col gap-3">
                <span className="micro-label text-[#2C2A26]">LỚP 2 · QUẦN VÀ VÁY (HẠ Y)</span>
                <div className="flex flex-col gap-2">
                  {getGarmentsByLayer('ha_y').map((g) => {
                    const isSelected = lookState.haY?.id === g.id;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => store.setHaY(g)}
                        className={`p-3 text-left border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#A8322A] bg-[#F2EDE3]'
                            : 'border-[#2C2A26]/15 bg-[#FBF8F2] hover:border-[#2C2A26]/40'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-display text-sm font-medium text-[#2C2A26]">{g.ten}</span>
                        </div>
                        <p className="font-sans text-xs text-[#6E5439] mt-1">{g.moTaNgan}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* LỚP 3: THỦ PHỤC */}
            {activeLayer === 'L3' && (
              <div className="flex flex-col gap-3">
                <span className="micro-label text-[#2C2A26]">LỚP 3 · MŨ VÀ KHĂN (THỦ PHỤC)</span>
                <div className="flex flex-col gap-2">
                  {getGarmentsByLayer('thu_phuc').map((g) => {
                    const isSelected = lookState.thuPhuc?.id === g.id;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => store.setThuPhuc(g)}
                        className={`p-3 text-left border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#A8322A] bg-[#F2EDE3]'
                            : 'border-[#2C2A26]/15 bg-[#FBF8F2] hover:border-[#2C2A26]/40'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-display text-sm font-medium text-[#2C2A26]">{g.ten}</span>
                        </div>
                        <p className="font-sans text-xs text-[#6E5439] mt-1">{g.moTaNgan}</p>
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => store.setThuPhuc(null)}
                    className={`p-2.5 text-center font-mono text-xs border border-dashed transition-all cursor-pointer ${
                      lookState.thuPhuc === null ? 'border-[#A8322A] bg-[#F2EDE3]' : 'border-[#2C2A26]/30'
                    }`}
                  >
                    KHÔNG ĐỘI MŨ / ĐỂ ĐẦU TRẦN
                  </button>
                </div>
              </div>
            )}

            {/* LỚP 4: HÀI */}
            {activeLayer === 'L4' && (
              <div className="flex flex-col gap-3">
                <span className="micro-label text-[#2C2A26]">LỚP 4 · GIÀY VÀ HÀI</span>
                <div className="flex flex-col gap-2">
                  {getGarmentsByLayer('hai').map((g) => {
                    const isSelected = lookState.hai?.id === g.id;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => store.setHai(g)}
                        className={`p-3 text-left border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#A8322A] bg-[#F2EDE3]'
                            : 'border-[#2C2A26]/15 bg-[#FBF8F2] hover:border-[#2C2A26]/40'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-display text-sm font-medium text-[#2C2A26]">{g.ten}</span>
                        </div>
                        <p className="font-sans text-xs text-[#6E5439] mt-1">{g.moTaNgan}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* LỚP 5: HOA VĂN */}
            {activeLayer === 'L5' && (
              <div className="flex flex-col gap-3">
                <span className="micro-label text-[#2C2A26]">LỚP 5 · HOA VĂN TRANG TRÍ</span>
                <div className="grid grid-cols-1 gap-2 max-h-[480px] overflow-y-auto">
                  {MOTIFS.map((m) => {
                    const isSelected = lookState.hoaVan?.id === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => store.setHoaVan(m)}
                        className={`p-3 text-left border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#A8322A] bg-[#F2EDE3]'
                            : 'border-[#2C2A26]/15 bg-[#FBF8F2] hover:border-[#2C2A26]/40'
                        }`}
                      >
                        <span className="font-display text-sm font-medium text-[#2C2A26] block">{m.ten}</span>
                        <p className="font-sans text-xs text-[#6E5439] mt-0.5">{m.yNghia}</p>
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => store.setHoaVan(null)}
                    className={`p-2.5 text-center font-mono text-xs border border-dashed transition-all cursor-pointer ${
                      lookState.hoaVan === null ? 'border-[#A8322A] bg-[#F2EDE3]' : 'border-[#2C2A26]/30'
                    }`}
                  >
                    KHÔNG DÙNG HOA VĂN (VẢI TRƠN)
                  </button>
                </div>
              </div>
            )}

            {/* LỚP 6: MÀU SẮC */}
            {activeLayer === 'L6' && (
              <div className="flex flex-col gap-4">
                <span className="micro-label text-[#2C2A26]">LỚP 6 · MÀU CHÍNH & BẢNG MÀU LỊCH SỬ</span>
                <div className="grid grid-cols-2 gap-2">
                  {TRADITIONAL_COLORS.map((c) => {
                    const isSelected = lookState.mauChinh?.toLowerCase() === c.hex.toLowerCase();
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => store.setMauChinh(c.hex)}
                        className={`flex items-center gap-2.5 p-2 border transition-all cursor-pointer ${
                          isSelected ? 'border-[#A8322A] bg-[#F2EDE3]' : 'border-[#2C2A26]/15 bg-[#FBF8F2]'
                        }`}
                      >
                        <span className="w-5 h-5 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: c.hex }} />
                        <span className="font-display text-xs text-[#2C2A26]">{c.ten}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-3 border-t border-[#2C2A26]/12">
                  <span className="font-mono text-[10px] uppercase text-[#6E5439] block mb-2">BẢNG MÀU DI SẢN</span>
                  <div className="flex flex-col gap-2">
                    {HISTORICAL_PALETTES.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => store.setMauChinh(p.mauSac[0])}
                        className="p-2 border border-[#2C2A26]/15 text-left bg-[#FBF8F2] hover:border-[#2C2A26]/40 cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-display text-xs text-[#2C2A26]">{p.ten}</span>
                          <div className="flex gap-1">
                            {p.mauSac.map((hex, i) => (
                              <span key={i} className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: hex }} />
                            ))}
                          </div>
                        </div>
                        <p className="font-sans text-[11px] text-[#6E5439] line-clamp-1">{p.moTa}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* =====================================================================
            CỘT PHẢI (24%): BẢNG BA CHỈ SỐ HÀI HÒA & QUY CHUẨN VĂN HÓA
            ===================================================================== */}
        <div className="flex flex-col gap-4">
          <div className="border border-[#2C2A26]/18 bg-[#FBF8F2] p-4 corner-mark flex flex-col gap-4">
            <span className="micro-label text-[#A8322A]">ĐÁNH GIÁ TỔNG THỂ</span>

            {/* CHỈ SỐ 1: HÀI HOÀ MÀU SẮC */}
            <div className="p-3 bg-[#F2EDE3]/70 border border-[#2C2A26]/10">
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-[10px] uppercase text-[#6E5439]">HÀI HOÀ MÀU</span>
                <span className="font-mono text-sm font-bold text-[#A8322A]">{scoreMau}/100</span>
              </div>
              <div className="w-full bg-[#2C2A26]/15 h-1.5 mt-2">
                <div className="bg-[#A8322A] h-full" style={{ width: `${scoreMau}%` }} />
              </div>
              <p className="font-sans text-[11px] text-[#2C2A26] mt-2 leading-relaxed">
                {colorHarmonyResult.goiYSua[0]}
              </p>
            </div>

            {/* CHỈ SỐ 2: HỢP BỐI CẢNH */}
            <div className="p-3 bg-[#F2EDE3]/70 border border-[#2C2A26]/10">
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-[10px] uppercase text-[#6E5439]">HỢP BỐI CẢNH</span>
                <span className="font-mono text-sm font-bold text-[#16243A]">{scoreBoiCanh}/100</span>
              </div>
              <div className="w-full bg-[#2C2A26]/15 h-1.5 mt-2">
                <div className="bg-[#16243A] h-full" style={{ width: `${scoreBoiCanh}%` }} />
              </div>
              <p className="font-sans text-[11px] text-[#6E5439] mt-2">
                Trang trọng: Cấp {lookState.thuongY?.mucTrangTrong ?? 3} / Yêu cầu: Cấp {selectedEvent.mucTrangTrongYeuCau}
              </p>
            </div>

            {/* CHỈ SỐ 3: CỜ VĂN HÓA */}
            <div className="p-3 bg-[#F2EDE3]/70 border border-[#2C2A26]/10">
              <div className="flex items-baseline justify-between mb-1">
                <span className="font-mono text-[10px] uppercase text-[#6E5439]">CỜ VĂN HOÁ</span>
                <span
                  className={`font-mono text-[10px] px-1.5 py-0.5 uppercase ${
                    cultureFlagResult.mucDoChung === 'xanh'
                      ? 'bg-[#3F6B5A] text-[#F2EDE3]'
                      : cultureFlagResult.mucDoChung === 'vang'
                      ? 'bg-[#C39A27] text-[#0D1826]'
                      : 'bg-[#A8322A] text-[#F2EDE3]'
                  }`}
                >
                  {cultureFlagResult.mucDoChung === 'xanh' ? 'HỢP LỆ' : 'CẦN LƯU Ý'}
                </span>
              </div>
              <p className="font-sans text-[11px] text-[#6E5439] mb-2">
                Cờ chấm trên lựa chọn của bạn, không chấm trên ảnh.
              </p>
              <CultureFlagPanel customFlag={cultureFlagResult} />
            </div>
          </div>
        </div>
      </div>

      {/* MODAL GIẢI THÍCH VÌ SAO CHI TIẾT ẢNH AI CHƯA ĐÚNG */}
      <AiExplanationModal isOpen={showWhyModal} onClose={() => setShowWhyModal(false)} />

      {/* =======================================================================
          THANH ĐIỀU HƯỚNG DÍNH Ở ĐÁY MÀN HÌNH TRÊN ĐIỆN THOẠI
          ======================================================================= */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-3 bg-[#FBF8F2] border-t border-[#2C2A26]/18 z-40 flex items-center gap-2 shadow-2xl">
        <button
          type="button"
          onClick={handleTriggerTryOn}
          disabled={isProcessing}
          className="flex-1 py-3 bg-[#A8322A] text-[#F2EDE3] font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm"
        >
          {isTryOnStale && activeTryOnImage && <span className="w-2 h-2 rounded-full bg-[#F2EDE3] animate-pulse" />}
          <span>{activeTryOnImage ? (isTryOnStale ? 'MẶC LẠI' : 'MẶC THỬ LẠI') : 'MẶC THỬ'}</span>
        </button>

        <button
          type="button"
          onClick={() => store.setStudioStep(4)}
          className="px-4 py-3 bg-[#16243A] text-[#F2EDE3] font-mono text-xs uppercase tracking-wider"
        >
          LOOK CARD →
        </button>
      </div>

      {/* =======================================================================
          MODAL GIẢI THÍCH VÌ SAO ẢNH AI CHỈ MANG TÍNH MINH HỌA
          ======================================================================= */}
      {showDisclaimerModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-[#0D1826]/85 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-[#FBF8F2] border border-[#2C2A26] w-full max-w-md p-6 shadow-2xl animate-in fade-in duration-150">
            <span className="micro-label text-[#A8322A] block mb-1">RANH GIỚI VĂN HOÁ CỦA ẢNH AI</span>
            <h4 className="font-display text-xl text-[#2C2A26] mb-4">
              Bốn nguyên tắc đối soát hình ảnh
            </h4>
            <div className="font-sans text-xs text-[#2C2A26] space-y-3 leading-relaxed">
              <div className="flex items-start gap-2.5">
                <span className="font-mono text-[11px] text-[#A8322A] font-bold select-none shrink-0">·</span>
                <p>Ảnh trong ứng dụng do mô hình AI dựng, nhằm giúp bạn hình dung bộ đồ trên chính mình.</p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="font-mono text-[11px] text-[#A8322A] font-bold select-none shrink-0">·</span>
                <p>Chi tiết như kiểu cổ áo, đường tà, số khuy hay hoa văn trong ảnh có thể chưa đúng với hiện vật thật.</p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="font-mono text-[11px] text-[#A8322A] font-bold select-none shrink-0">·</span>
                <p>Phần mô tả và nguồn tham khảo bên cạnh ảnh mới là thông tin đã được đối chiếu.</p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="font-mono text-[11px] text-[#A8322A] font-bold select-none shrink-0">·</span>
                <p>Cờ văn hoá được chấm trên lựa chọn của bạn, không chấm trên ảnh. Nghĩa là nếu bạn chọn đúng, cờ vẫn xanh kể cả khi ảnh vẽ chưa chuẩn.</p>
              </div>
            </div>
            <div className="pt-4 mt-4 border-t border-[#2C2A26]/12 flex justify-end">
              <button
                type="button"
                onClick={() => setShowDisclaimerModal(false)}
                className="px-5 py-2 bg-[#2C2A26] text-[#F2EDE3] font-mono text-xs hover:bg-[#16243A]"
              >
                ĐÃ HIỂU
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
