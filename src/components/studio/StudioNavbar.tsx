import { useStore, store } from '../../lib/store';
import { ScreenType } from '../../types';
import { geminiStats, getGeminiConnectionStatus } from '../../lib/gemini';

export default function StudioNavbar() {
  const { currentScreen } = useStore();
  const liveStatus = getGeminiConnectionStatus();

  const navItems: { id: ScreenType; label: string }[] = [
    { id: 'studio', label: 'XUONG PHOI' },
    { id: 'culture_rules', label: 'LUAT VAN HOA' },
    { id: 'lookbook', label: 'LOOKBOOK' },
    { id: 'cu_nghe', label: 'CU NGHE' },
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
    <header className="h-[56px] bg-[#F2EDE3] text-[#2C2A26] border-b border-[#2C2A26]/18 sticky top-0 z-[var(--z-thanh-dieu-huong)] px-6 flex items-center justify-between select-none print:hidden">
      {/* Trái: Chữ MAC VIET mono hoa bấm quay về landing */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => store.setScreen('landing')}
          className="font-mono text-sm tracking-[0.2em] uppercase font-bold text-[#2C2A26] hover:text-[#A8322A] transition-colors cursor-pointer"
        >
          MAC VIET
        </button>
      </div>

      {/* Giữa: Bốn mục mono hoa: XUONG PHOI · BAO TANG · LOOKBOOK · CU NGHE */}
      <nav className="flex items-center gap-6 md:gap-8 h-full">
        {navItems.map((item) => {
          const isActive = currentScreen === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => store.setScreen(item.id)}
              className={`relative h-full flex items-center micro-label transition-colors cursor-pointer ${
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
      <div className="flex items-center gap-4">
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
