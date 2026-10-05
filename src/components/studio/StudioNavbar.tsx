import { useStore, store } from '../../lib/store';
import { ScreenType } from '../../types';
import { geminiStats, getGeminiConnectionStatus } from '../../lib/gemini';

export default function StudioNavbar() {
  const { currentScreen } = useStore();
  const liveStatus = getGeminiConnectionStatus();

  const navItems: { id: ScreenType; label: string }[] = [
    { id: 'studio', label: 'XƯỞNG PHỐI' },
    { id: 'culture_rules', label: 'LUẬT VĂN HOÁ' },
    { id: 'lookbook', label: 'LOOKBOOK' },
    { id: 'cu_nghe', label: 'CỤ NGHỆ' },
  ];

  // Chấm trạng thái kết nối Gemini: xanh là sẵn sàng, vàng là cache, xám là dự phòng
  const getGeminiIndicator = () => {
    switch (liveStatus) {
      case 'ready':
        return { color: 'bg-[#2D6A4F]', label: 'Sẵn sàng' };
      case 'cached':
        return { color: 'bg-[#C39A27]', label: 'Bộ nhớ đệm' };
      case 'fallback':
      default:
        return { color: 'bg-[#6E5439]/60', label: 'Chế độ dự phòng' };
    }
  };

  const indicator = getGeminiIndicator();

  return (
    <header className="md:h-[56px] bg-[#F2EDE3] text-[#2C2A26] border-b border-[#2C2A26]/18 sticky top-0 z-[var(--z-thanh-dieu-huong)] px-4 md:px-6 flex flex-wrap md:flex-nowrap items-center justify-between select-none print:hidden">
      {/* Trái: Chữ MẶC VIỆT mono hoa bấm quay về landing */}
      <div className="flex items-center gap-4 h-12 md:h-auto">
        <button
          type="button"
          onClick={() => store.setScreen('landing')}
          className="font-mono text-sm tracking-[0.2em] uppercase font-bold text-[#2C2A26] hover:text-[#A8322A] transition-colors cursor-pointer"
        >
          MẶC VIỆT
        </button>
      </div>

      {/* Giữa: Bốn mục mono hoa: XƯỞNG PHỐI · BAO TANG · LOOKBOOK · CỤ NGHỆ */}
      <nav className="order-3 md:order-none w-full md:w-auto flex items-center justify-between md:justify-start gap-3 md:gap-8 h-11 md:h-full overflow-x-auto border-t border-[#2C2A26]/10 md:border-t-0 -mx-4 px-4 md:mx-0 md:px-0">
        {navItems.map((item) => {
          const isActive = currentScreen === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => store.setScreen(item.id)}
              className={`relative h-full flex items-center shrink-0 whitespace-nowrap micro-label max-md:tracking-[0.08em] transition-colors cursor-pointer ${
                isActive ? 'text-[#2C2A26] font-bold' : 'text-[#2C2A26]/60 hover:text-[#2C2A26]'
              }`}
            >
              {item.label}
              {/* Gạch chân 2px màu --dieu khi mục đang mở */}
              {isActive && (
                <div className="absolute bottom-0 inset-x-0 h-[2px] bg-[#A8322A]" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Phải: Chấm báo trạng thái Gemini */}
      <div className="flex items-center gap-4 h-12 md:h-auto">
        {/* Chấm tròn báo trạng thái kết nối Gemini */}
        <div
          className="flex items-center gap-1.5 cursor-help"
          title={`Kết nối AI Studio: ${indicator.label} (Gọi: ${geminiStats.soLanGoi} | Cache: ${geminiStats.soLanTrungCache} | Dự phòng: ${geminiStats.soLanDuPhong} | Lỗi: ${geminiStats.soLanLoi})`}
        >
          <span className={`w-2 h-2 rounded-full ${indicator.color}`} />
          <span className="font-mono text-[10px] text-[#2C2A26]/60 hidden sm:inline uppercase">
            {indicator.label}
          </span>
        </div>
      </div>
    </header>
  );
}
