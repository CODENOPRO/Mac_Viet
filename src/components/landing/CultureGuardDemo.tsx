import { useState } from 'react';
import { GARMENTS } from '../../data/garments';
import { CULTURE_RULES } from '../../data/cultureRules';
import { EVENTS } from '../../data/events';
import { layTenMucTrangTrong } from '../../data/palettes';
import SourceTag from '../shared/SourceTag';
import { LookState } from '../../types';

interface CultureGuardDemoProps {
  onExploreRules?: () => void;
}

export default function CultureGuardDemo({ onExploreRules }: CultureGuardDemoProps) {
  const nhatBinh = GARMENTS.find((g) => g.id === 'G06') || null;
  const aoTac = GARMENTS.find((g) => g.id === 'G05') || null;
  const quanTrang = GARMENTS.find((g) => g.id === 'G10') || null;
  const eventCafe = EVENTS.find((e) => e.id === 'E07') || EVENTS[6];

  const [demoLook, setDemoLook] = useState<LookState>({
    thuongY: nhatBinh,
    haY: quanTrang,
    thuPhuc: null,
    hai: null,
    phuKien: [],
    hoaVan: null,
    mauChinh: '#A8322A',
  });

  const ruleCR01 = CULTURE_RULES.find((r) => r.id === 'CR-01')!;
  const isRuleViolated = ruleCR01 ? ruleCR01.kiemTra(demoLook, eventCafe) : false;

  const handleAutoFix = () => {
    if (ruleCR01 && ruleCR01.apDung) {
      const fixedLook = ruleCR01.apDung(demoLook);
      setDemoLook(fixedLook);
    } else {
      setDemoLook((prev) => ({
        ...prev,
        thuongY: aoTac,
      }));
    }
  };

  const handleResetDemo = () => {
    setDemoLook({
      thuongY: nhatBinh,
      haY: quanTrang,
      thuPhuc: null,
      hai: null,
      phuKien: [],
      hoaVan: null,
      mauChinh: '#A8322A',
    });
  };

  return (
    <div className="w-full max-w-2xl border border-current/20 bg-[#0D1826]/90 backdrop-blur-md p-6 sm:p-8 corner-mark shadow-2xl flex flex-col gap-6 text-[#F2EDE3]">
      <div className="flex items-center justify-between pb-4 border-b border-[#F2EDE3]/15">
        <span className="font-mono text-xs uppercase tracking-widest text-[#C39A27]">
          BÀN THỰC HÀNH · CULTURE GUARD
        </span>
        <span className="font-mono text-[11px] text-[#F2EDE3]/70 uppercase">
          BỐI CẢNH: {eventCafe.ten.toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="p-3.5 bg-[#16243A] border border-[#F2EDE3]/15">
          <span className="font-mono text-[10px] text-[#F2EDE3]/60 uppercase tracking-wider block">
            THƯỢNG Y ĐANG THỬ
          </span>
          <span className="font-display text-lg text-[#F2EDE3] font-medium block mt-1">
            {demoLook.thuongY?.ten}
          </span>
          <span className="text-xs text-[#C39A27] font-mono mt-0.5 block">
            Mức: {layTenMucTrangTrong(demoLook.thuongY?.mucTrangTrong)}
          </span>
        </div>

        <div className="p-3.5 bg-[#16243A] border border-[#F2EDE3]/15">
          <span className="font-mono text-[10px] text-[#F2EDE3]/60 uppercase tracking-wider block">
            SỰ KIỆN HIỆN DIỆN
          </span>
          <span className="font-display text-lg text-[#F2EDE3] font-medium block mt-1">
            {eventCafe.ten}
          </span>
          <span className="text-xs text-[#F2EDE3]/70 font-mono mt-0.5 block">
            Yêu cầu: {layTenMucTrangTrong(eventCafe.mucTrangTrongYeuCau)}
          </span>
        </div>
      </div>

      {isRuleViolated ? (
        <div className="border border-[#A8322A] bg-[#A8322A]/20 p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="font-mono text-xs uppercase tracking-wider text-[#A8322A] font-bold">
              CẢNH BÁO ĐỎ · {ruleCR01.ten.toUpperCase()}
            </span>
            <SourceTag sourceIds={ruleCR01.sourceIds} />
          </div>
          <p className="text-sm font-sans text-[#F2EDE3] leading-relaxed">
            {ruleCR01.thongDiep}
          </p>
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[#A8322A]/30">
            <span className="text-xs font-sans text-[#F2EDE3]/80 italic">
              Gợi ý: {Array.isArray(ruleCR01.cachSua) ? ruleCR01.cachSua[0]?.moTa : ruleCR01.cachSua}
            </span>
            <button
              type="button"
              onClick={handleAutoFix}
              className="px-4 py-2 bg-[#A8322A] text-[#F2EDE3] hover:bg-[#A8322A]/85 text-xs font-mono uppercase tracking-wider shrink-0 transition-all cursor-pointer corner-mark font-medium"
            >
              SỬA GIÚP TÔI
            </button>
          </div>
        </div>
      ) : (
        <div className="border border-[#2D6A4F] bg-[#2D6A4F]/25 p-5 flex flex-col gap-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="font-mono text-xs uppercase tracking-wider text-[#74C69D] font-bold">
              HOÀN TOÀN PHÙ HỢP · MỨC XANH
            </span>
            <span className="font-mono text-[10px] text-[#F2EDE3]/70">
              ĐÁNH GIÁ: CHUẨN MỰC
            </span>
          </div>
          <p className="text-sm font-sans text-[#F2EDE3] leading-relaxed">
            Đã chuyển sang {demoLook.thuongY?.ten}. Áo tấc hoặc ngũ thân giữ trọn nét nho nhã
            mà không bị cồng kềnh hay lấn át tính chất đời thường của buổi cà phê phố cổ.
          </p>
          <div className="pt-2 flex items-center justify-between border-t border-[#2D6A4F]/30">
            <button
              type="button"
              onClick={handleResetDemo}
              className="text-xs font-mono text-[#C39A27] underline hover:text-[#F2EDE3] cursor-pointer"
            >
              ↺ Thử lại với áo Nhật Bình
            </button>
            {onExploreRules && (
              <button
                type="button"
                onClick={onExploreRules}
                className="text-xs font-mono text-[#F2EDE3]/75 hover:text-[#F2EDE3] cursor-pointer"
              >
                Xem quy tắc điển chế →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
