import { useState } from 'react';
import { useStore, store } from '../../lib/store';
import { kiemTraVanHoa } from '../../lib/cultureGuard';
import { CultureFlag, LookState } from '../../types';
import SourceTag from '../shared/SourceTag';

interface CultureFlagPanelProps {
  customFlag?: CultureFlag;
  onApplyFix?: (updatedLook: LookState) => void;
  className?: string;
}

export default function CultureFlagPanel({
  customFlag,
  onApplyFix,
  className = '',
}: CultureFlagPanelProps) {
  const { lookState, selectedEvent, contextSetup } = useStore();
  const [acknowledgedRules, setAcknowledgedRules] = useState<string[]>([]);
  const [expandedSourceId, setExpandedSourceId] = useState<string | null>(null);

  // Tính toán cờ văn hóa
  const flag =
    customFlag ||
    kiemTraVanHoa(
      lookState,
      selectedEvent,
      contextSetup.phongCach,
      contextSetup.regionId,
      contextSetup.nguoiMac
    );

  const topRuleItem = flag.luatViPham[0];
  const activeRuleIds = flag.luatViPham.map((l) => l.rule.id);
  const currentKey = activeRuleIds.sort().join('+');

  const isAcknowledged =
    activeRuleIds.length > 0 &&
    activeRuleIds.every((id) => acknowledgedRules.includes(id));

  const handleAcknowledge = () => {
    setAcknowledgedRules((prev) => Array.from(new Set([...prev, ...activeRuleIds])));
  };

  const handleApplyFix = (fixer?: (look: LookState) => LookState) => {
    if (!fixer) return;
    const updated = fixer(lookState);
    if (onApplyFix) {
      onApplyFix(updated);
    } else {
      store.setLookState(updated);
    }
  };

  // Xác định màu và cấu hình giao diện theo mức độ
  const colorMap = {
    do: {
      bg: 'bg-[#A8322A]/10',
      border: 'border-[#A8322A]',
      box: 'bg-[#A8322A]',
      text: 'text-[#A8322A]',
    },
    vang: {
      bg: 'bg-[#C39A27]/10',
      border: 'border-[#C39A27]',
      box: 'bg-[#C39A27]',
      text: 'text-[#6E5439]',
    },
    xanh: {
      bg: 'bg-[#2D6A4F]/10',
      border: 'border-[#2D6A4F]',
      box: 'bg-[#2D6A4F]',
      text: 'text-[#2D6A4F]',
    },
  };

  const currentTheme = colorMap[flag.mucDoChung] || colorMap.xanh;

  // Bản đồ nhãn độ chắc chắn
  const doChacChanMap = {
    da_xac_lap: 'Đã xác lập',
    thuc_hanh_hien_nay: 'Thực hành hiện nay',
    dang_tranh_luan: 'Đang tranh luận',
  };

  return (
    <div
      className={`border p-4 corner-mark transition-all duration-200 select-none ${
        currentTheme.border
      } ${currentTheme.bg} ${
        isAcknowledged ? 'opacity-40 filter grayscale-[0.3]' : 'opacity-100'
      } ${className}`}
    >
      {/* Hàng trên: Ô vuông màu 12px và dòng tiêu đề */}
      <div className="flex items-center justify-between pb-2 border-b border-[#2C2A26]/10">
        <div className="flex items-center gap-2.5">
          {/* Ô vuông màu 12px */}
          <div
            className={`w-3 h-3 shrink-0 ${currentTheme.box}`}
            aria-hidden="true"
          />
          <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-[#2C2A26]">
            {flag.tieuDe}
          </h4>
        </div>

        {flag.tongSoLuatBan > 0 && (
          <span className="font-mono text-[10px] text-[#6E5439]">
            {flag.tongSoLuatBan} LƯU Ý
          </span>
        )}
      </div>

      {/* Thông điệp chính */}
      <p className="text-xs font-sans text-[#2C2A26] mt-2.5 leading-relaxed">
        {flag.thongDiep}
      </p>

      {/* Dòng mảnh làm rõ phạm vi chấm cờ */}
      <p className="font-sans text-[11px] text-[#6E5439] mt-2 pt-2 border-t border-[#2C2A26]/10 leading-normal">
        Cờ chấm trên lựa chọn của bạn, không chấm trên ảnh.
      </p>

      {/* Trạng thái đã ghi nhận lựa chọn */}
      {isAcknowledged ? (
        <div className="mt-3 p-2 bg-[#F2EDE3] border border-[#2C2A26]/15 text-[11px] font-mono text-[#6E5439]">
          Đã ghi nhận lựa chọn của bạn. Hệ thống sẽ giữ nguyên phối đồ này.
        </div>
      ) : (
        <>
          {/* Khối cách sửa đề xuất */}
          {flag.luatViPham.length > 0 && (
            <div className="mt-3 pt-3 border-t border-[#2C2A26]/10 flex flex-col gap-2.5">
              <span className="micro-label text-[10px] text-[#6E5439]">
                CÁCH ĐIỀU CHỈNH ĐỀ XUẤT
              </span>

              {flag.luatViPham.map((item) => (
                <div key={item.rule.id} className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        store.setScreen('culture_rules');
                        window.location.hash = `#luat-van-hoa-${item.rule.id.toLowerCase()}`;
                      }}
                      className="text-xs font-display text-[#2C2A26] hover:text-[#A8322A] text-left underline decoration-[#2C2A26]/30 hover:decoration-[#A8322A] transition-colors cursor-pointer"
                      title="Xem chi tiết quy tắc trong trang Luật Văn Hoá"
                    >
                      {item.rule.ten}
                    </button>
                    {item.isDowngraded && (
                      <span className="text-[9px] font-mono text-[#6E5439] bg-[#C39A27]/20 px-1 border border-[#C39A27]/30">
                        SÂN KHẤU
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5 pl-2 border-l border-[#2C2A26]/15">
                    {item.rule.cachSua.map((cs, idx) => (
                      <div
                        key={idx}
                        className="flex items-start justify-between gap-3 text-xs font-sans text-[#2C2A26]"
                      >
                        <span className="leading-snug pt-0.5">· {cs.moTa}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {cs.apDung && (
                            <button
                              type="button"
                              onClick={() => handleApplyFix(cs.apDung)}
                              className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider bg-[#2C2A26] text-[#F2EDE3] hover:bg-[#A8322A] transition-colors corner-mark cursor-pointer"
                            >
                              Áp dụng
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={handleAcknowledge}
                            className="px-2 py-1 text-[9px] font-mono uppercase tracking-wider border border-[#2C2A26]/30 text-[#6E5439] hover:text-[#2C2A26] hover:border-[#2C2A26] transition-colors cursor-pointer"
                            title="Giữ nguyên phối đồ theo ý bạn"
                          >
                            Tôi vẫn muốn giữ
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Nút phụ: Tôi vẫn muốn giữ */}
          {flag.mucDoChung !== 'xanh' && (
            <div className="mt-3 pt-2 flex items-center justify-end">
              <button
                type="button"
                onClick={handleAcknowledge}
                className="text-[10px] font-mono underline text-[#6E5439] hover:text-[#2C2A26] cursor-pointer"
              >
                TÔI VẪN MUỐN GIỮ
              </button>
            </div>
          )}
        </>
      )}

      {/* Dưới cùng: Nhãn độ chắc chắn và nguồn tham khảo */}
      {topRuleItem && (
        <div className="mt-3 pt-2.5 border-t border-[#2C2A26]/10 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono">
          <div className="flex items-center gap-1.5 text-[#6E5439]">
            <span>ĐỘ CHẮC CHẮN:</span>
            <strong className="text-[#2C2A26]">
              {doChacChanMap[topRuleItem.rule.doChacChan] || topRuleItem.rule.doChacChan}
            </strong>
          </div>

          {/* Nguồn tham khảo */}
          <SourceTag sourceIds={topRuleItem.rule.sourceIds} />
        </div>
      )}
    </div>
  );
}
