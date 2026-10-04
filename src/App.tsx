import { useState } from 'react';
import { useStore } from './lib/store';
import { ScrollTrigger } from './lib/gsap';
import Preloader from './components/landing/Preloader';
import Landing from './components/landing/Landing';
import StudioNavbar from './components/studio/StudioNavbar';
import StudioWorkflow from './components/studio/StudioWorkflow';
import LookbookScreen from './components/studio/LookbookScreen';
import CuNgheScreen from './components/studio/CuNgheScreen';
import CultureRulesScreen from './components/studio/CultureRulesScreen';
import DebugTelemetryModal from './components/shared/DebugTelemetryModal';

export default function App() {
  const { currentScreen } = useStore();
  const [isPreloaded, setIsPreloaded] = useState(false);

  const isStudioWorld = currentScreen !== 'landing';

  return (
    <div className="min-h-screen bg-[#0D1826] text-[#F2EDE3] flex flex-col font-sans selection:bg-[#A8322A] selection:text-[#F2EDE3]">
      {/* SVG Filter duy nhất toàn ứng dụng theo DESIGN.md mục 2.2: Ánh xạ đen về chàm sâu (#0D1826) và trắng về ngà (#F2EDE3) */}
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <filter id="duo-cham-nga" colorInterpolationFilters="sRGB">
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncR type="table" tableValues="0.051 0.949" />
            <feFuncG type="table" tableValues="0.094 0.929" />
            <feFuncB type="table" tableValues="0.149 0.890" />
          </feComponentTransfer>
        </filter>
      </svg>

      {/* Màn 0: Preloader điện ảnh che toàn màn cho đến khi sẵn sàng */}
      {!isPreloaded && (
        <Preloader
          onComplete={() => {
            setIsPreloaded(true);
            // Báo cho tiền sảnh bắt đầu mở màn
            window.dispatchEvent(new Event('macviet:mo-man'));
            // Gọi ScrollTrigger.refresh() sau khi preloader đóng để đồng bộ kích thước khung hình
            requestAnimationFrame(() => {
              ScrollTrigger.refresh();
            });
          }}
        />
      )}

      {/* THẾ GIỚI 1: LANDING TOÀN CẢNH */}
      {currentScreen === 'landing' && (
        <Landing />
      )}

      {/* THẾ GIỚI 2: KHÔNG GIAN THAO TÁC ỨNG DỤNG (XƯỞNG PHỐI, BẢO TÀNG, LOOKBOOK, CỬ NGHỆ) */}
      {isStudioWorld && (
        <div className="min-h-screen bg-[#FBF8F2] text-[#2C2A26] flex flex-col">
          {/* Thanh điều hướng cố định cao 56px, nền --nga, border-b hairline */}
          <StudioNavbar />

          {/* Vùng nội dung chuyển màn: hiệu ứng mờ dần 180ms, không trượt, không nảy */}
          <main className="flex-1 w-full transition-opacity duration-180 ease-out">
            {currentScreen === 'studio' && (
              <div className="animate-in fade-in duration-180">
                <StudioWorkflow />
              </div>
            )}

            {currentScreen === 'lookbook' && (
              <div className="animate-in fade-in duration-180">
                <LookbookScreen />
              </div>
            )}

            {currentScreen === 'cu_nghe' && (
              <div className="animate-in fade-in duration-180">
                <CuNgheScreen />
              </div>
            )}

            {currentScreen === 'culture_rules' && (
              <div className="animate-in fade-in duration-180">
                <CultureRulesScreen />
              </div>
            )}
          </main>
        </div>
      )}

      {/* Bảng chẩn đoán & đo đạc Telemetry (Ctrl+Shift+D) */}
      <DebugTelemetryModal />
    </div>
  );
}
