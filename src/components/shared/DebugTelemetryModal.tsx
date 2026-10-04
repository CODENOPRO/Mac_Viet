import { useState, useEffect } from 'react';
import {
  tryOnStats,
  demSoLuongCacheTryOn,
  xoaToanBoCacheTryOn,
} from '../../lib/tryOn';
import { geminiStats, getGeminiConnectionStatus } from '../../lib/gemini';

export default function DebugTelemetryModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [cacheCount, setCacheCount] = useState<number>(0);
  const [justCleared, setJustCleared] = useState(false);

  // Lắng nghe tổ hợp phím Ctrl+Shift+D hoặc Cmd+Shift+D
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Cập nhật số lượng ảnh trong IndexedDB khi mở bảng
  useEffect(() => {
    if (isOpen) {
      demSoLuongCacheTryOn().then((count) => setCacheCount(count));
      setJustCleared(false);
    }
  }, [isOpen]);

  const handleClearCache = async () => {
    await xoaToanBoCacheTryOn();
    setCacheCount(0);
    setJustCleared(true);
    setTimeout(() => setJustCleared(false), 2500);
  };

  if (!isOpen) return null;

  const connectionStatus = getGeminiConnectionStatus();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="telemetry-title"
      className="fixed inset-0 z-50 bg-[#0D1826]/85 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-[#16243A] border border-[#C39A27] w-full max-w-2xl text-[#F2EDE3] shadow-2xl rounded-[1px] overflow-hidden animate-in fade-in duration-150">
        {/* HEADER */}
        <div className="p-4 md:px-6 border-b border-[#C39A27]/25 flex items-center justify-between bg-[#0D1826]">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#C39A27]">
              HE THONG DO DAC & GIAM SAT (CTRL+SHIFT+D)
            </span>
            <h2 id="telemetry-title" className="font-display text-xl text-[#F2EDE3] font-normal mt-0.5">
              Chỉ số vận hành Mặc Thử & Gemini
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="font-mono text-xs text-[#F2EDE3]/70 hover:text-[#F2EDE3] px-2.5 py-1 border border-[#F2EDE3]/20 hover:border-[#F2EDE3]"
            aria-label="Đóng bảng đo đạc"
          >
            DONG [ESC]
          </button>
        </div>

        {/* NỘI DUNG CHỈ SỐ */}
        <div className="p-5 md:p-6 space-y-6 max-h-[80vh] overflow-y-auto font-sans text-sm">
          {/* HÀNG 1: CHỈ SỐ CỐT LÕI YÊU CẦU */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1. Số lượt gọi ảnh */}
            <div className="p-3.5 bg-[#0D1826]/70 border border-[#F2EDE3]/10">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#F2EDE3]/60 block mb-1">
                SO LUOT GOI ANH
              </span>
              <div className="font-mono text-2xl text-[#F2EDE3] font-medium">
                {tryOnStats.soLuotGoiAnh}
              </div>
              <span className="font-mono text-[11px] text-[#F2EDE3]/50 block mt-1">
                Nhanh: {tryOnStats.soLanTheoChatLuong.nhanh} | Kỹ: {tryOnStats.soLanTheoChatLuong.ky}
              </span>
            </div>

            {/* 2. Thời gian chờ trung bình */}
            <div className="p-3.5 bg-[#0D1826]/70 border border-[#F2EDE3]/10">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#F2EDE3]/60 block mb-1">
                THOI GIAN CHO TB
              </span>
              <div className="font-mono text-2xl text-[#C39A27] font-medium">
                {tryOnStats.thoiGianChoTrungBinhMs} ms
              </div>
              <span className="font-mono text-[11px] text-[#F2EDE3]/50 block mt-1">
                Tổng chờ: {Math.round(tryOnStats.tongThoiGianChoMs / 1000)}s
              </span>
            </div>

            {/* 3. Số lần rơi dự phòng */}
            <div className="p-3.5 bg-[#0D1826]/70 border border-[#F2EDE3]/10">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#F2EDE3]/60 block mb-1">
                SO LAN ROI DU PHONG
              </span>
              <div className="font-mono text-2xl text-[#A8322A] font-medium">
                {tryOnStats.soLanDuPhong}
              </div>
              <span className="font-mono text-[11px] text-[#F2EDE3]/50 block mt-1">
                Lỗi API: {tryOnStats.soLanLoi}
              </span>
            </div>
          </div>

          {/* HÀNG 2: PHÂN RÃ DỰ PHÒNG BA TẦNG */}
          <div className="p-4 bg-[#0D1826]/50 border border-[#F2EDE3]/10">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#C39A27] block mb-2">
              CHI TIET DU PHONG BA TANG
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-xs">
              <div className="p-2.5 bg-[#16243A] border border-[#F2EDE3]/10">
                <div className="text-[#F2EDE3]/60 mb-0.5">TẦNG 1: THỬ LẠI NỀN GỐC</div>
                <div className="text-base text-[#F2EDE3]">{tryOnStats.soLanTheoTangDuPhong.tang1} lượt</div>
              </div>
              <div className="p-2.5 bg-[#16243A] border border-[#F2EDE3]/10">
                <div className="text-[#F2EDE3]/60 mb-0.5">TẦNG 2: NHÂN VẬT MẪU</div>
                <div className="text-base text-[#F2EDE3]">{tryOnStats.soLanTheoTangDuPhong.tang2} lượt</div>
              </div>
              <div className="p-2.5 bg-[#16243A] border border-[#F2EDE3]/10">
                <div className="text-[#F2EDE3]/60 mb-0.5">TẦNG 3: MINH HỌA PHẲNG</div>
                <div className="text-base text-[#F2EDE3]">{tryOnStats.soLanTheoTangDuPhong.tang3} lượt</div>
              </div>
            </div>
          </div>

          {/* HÀNG 3: BỘ NHỚ ĐỆM INDEXEDDB VÀ TRẠNG THÁI KẾT NỐI */}
          <div className="p-4 bg-[#0D1826]/50 border border-[#F2EDE3]/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#C39A27] block mb-1">
                BO NHO DEM INDEXEDDB (TOI DA 20 ANH)
              </span>
              <p className="font-mono text-xs text-[#F2EDE3]/80">
                Đang lưu trữ: <span className="text-[#F2EDE3] font-bold">{cacheCount} / 20</span> ảnh · Đã phục vụ từ cache: <span className="text-[#C39A27] font-bold">{tryOnStats.soLanTrungCache}</span> lần
              </p>
              <p className="font-mono text-[11px] text-[#F2EDE3]/50 mt-1">
                Lưu trong IndexedDB thay vì localStorage để không bị giới hạn 5MB và tránh nghẽn luồng giao diện.
              </p>
            </div>

            <button
              type="button"
              onClick={handleClearCache}
              className="font-mono text-xs px-3 py-1.5 border border-[#C39A27] text-[#C39A27] hover:bg-[#C39A27] hover:text-[#0D1826] transition-colors whitespace-nowrap"
            >
              {justCleared ? 'DA DON DEP' : 'XOA BO NHO DEM'}
            </button>
          </div>

          {/* HÀNG 4: TOÀN BỘ CHỈ SỐ GEMINI CHUNG */}
          <div className="p-4 bg-[#0D1826]/30 border border-[#F2EDE3]/10 font-mono text-xs text-[#F2EDE3]/70 space-y-1">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#F2EDE3]/50 block mb-1">
              TRANG THAI GEMINI CHUNG
            </span>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <span>Trạng thái: <strong className="text-[#F2EDE3] uppercase">{connectionStatus}</strong></span>
              <span>Tổng gọi text/chat: <strong className="text-[#F2EDE3]">{geminiStats.soLanGoi}</strong></span>
              <span>Trúng cache text: <strong className="text-[#F2EDE3]">{geminiStats.soLanTrungCache}</strong></span>
              <span>Lỗi text: <strong className="text-[#F2EDE3]">{geminiStats.soLanLoi}</strong></span>
              <span>Dự phòng text: <strong className="text-[#F2EDE3]">{geminiStats.soLanDuPhong}</strong></span>
            </div>
          </div>

          {/* HÀNG 5: GIÁM SÁT CHUYỂN CẢNH GSAP & SCROLLTRIGGER */}
          <div className="p-4 bg-[#0D1826]/50 border border-[#C39A27]/30 font-mono text-xs text-[#F2EDE3]/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#C39A27] font-bold">
                CHUYỂN CẢNH GSAP &amp; SCROLLTRIGGER
              </span>
              <span className="text-[10px] text-[#2D6A4F] bg-[#2D6A4F]/20 px-2 py-0.5 border border-[#2D6A4F]/40 font-bold">
                HOẠT ĐỘNG CHUẨN MỰC
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
              <div className="p-2 bg-[#16243A] border border-[#F2EDE3]/10">
                <span className="text-[#F2EDE3]/50 block">TRIGGERS:</span>
                <strong className="text-base text-[#C39A27]">
                  {typeof window !== 'undefined' && (window as any).ScrollTrigger
                    ? (window as any).ScrollTrigger.getAll().length
                    : 0}
                </strong>
              </div>
              <div className="p-2 bg-[#16243A] border border-[#F2EDE3]/10">
                <span className="text-[#F2EDE3]/50 block">PIN SPACERS:</span>
                <strong className="text-base text-[#F2EDE3]">
                  {typeof document !== 'undefined'
                    ? document.querySelectorAll('.pin-spacer').length
                    : 0}
                </strong>
              </div>
              <div className="p-2 bg-[#16243A] border border-[#F2EDE3]/10">
                <span className="text-[#F2EDE3]/50 block">REDUCED MOTION:</span>
                <strong className="text-base text-[#F2EDE3]">
                  {typeof window !== 'undefined' &&
                  window.matchMedia('(prefers-reduced-motion: reduce)').matches
                    ? 'BẬT'
                    : 'TẮT'}
                </strong>
              </div>
              <div className="p-2 bg-[#16243A] border border-[#F2EDE3]/10">
                <span className="text-[#F2EDE3]/50 block">GSAP VERSION:</span>
                <strong className="text-base text-[#F2EDE3]">
                  {typeof window !== 'undefined' && (window as any).gsap
                    ? (window as any).gsap.version
                    : '3.12.5'}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-3 px-6 bg-[#0D1826] border-t border-[#C39A27]/25 flex items-center justify-between font-mono text-[11px] text-[#F2EDE3]/50">
          <span>Phím tắt đóng mở: Ctrl+Shift+D (hoặc Cmd+Shift+D)</span>
          <span>MẶC VIỆT TELEMETRY V1.0</span>
        </div>
      </div>
    </div>
  );
}
