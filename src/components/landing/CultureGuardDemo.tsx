import { useMemo, useState } from 'react';
import { GARMENTS } from '../../data/garments';
import { CULTURE_RULES } from '../../data/cultureRules';
import { EVENTS } from '../../data/events';
import { TRADITIONAL_COLORS } from '../../data/palettes';
import { kiemTraVanHoa } from '../../lib/cultureGuard';
import SourceTag from '../shared/SourceTag';
import { CultureRule, LookState } from '../../types';

// Bàn thực hành: khách tự chọn áo, màu, khăn nón và dịp; Culture Guard thật chấm ngay.
// Mọi chữ trong phần kết quả đều lấy từ bộ máy kiểm tra và dữ liệu luật, không viết tay.

interface CultureGuardDemoProps {
  onExploreRules?: () => void;
}

const g = (id: string) => GARMENTS.find((x) => x.id === id) || null;

const CHON_AO = ['G06', 'G05', 'G04', 'G08', 'G03', 'G09'];
const CHON_KHAN = ['', 'G12', 'G13', 'G14'];
const CHON_MAU = ['Chàm', 'Điều', 'Ngà', 'Nâu non'];
const CHON_DIP = ['E07', 'E01', 'E04', 'E05', 'E03'];

// Hạ y đi kèm theo đúng hệ của áo, để demo không báo lệch bộ vì một món khách không được chọn
const HA_Y_THEO_AO: Record<string, string> = { G03: 'G11' };

const MUC_DO = {
  do: { chu: 'Cần cân nhắc', mau: '#A8322A' },
  vang: { chu: 'Hơi lệch bối cảnh', mau: '#9A7A1C' },
  xanh: { chu: 'Chưa thấy điểm lệch', mau: '#3F6B5A' },
} as const;

const DO_CHAC_CHAN: Record<CultureRule['doChacChan'], string> = {
  da_xac_lap: 'Đã xác lập',
  thuc_hanh_hien_nay: 'Thực hành hiện nay',
  dang_tranh_luan: 'Đang tranh luận',
};

const hexMau = (ten: string) => TRADITIONAL_COLORS.find((c) => c.ten === ten)?.hex || '#16243A';
const tenMauTheoHex = (hex?: string) => TRADITIONAL_COLORS.find((c) => c.hex === hex)?.ten;

function Chip({ chon, onClick, children }: { chon: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={chon}
      onClick={onClick}
      className={`min-h-[40px] px-3.5 py-1.5 border text-sm font-sans transition-colors cursor-pointer inline-flex items-center gap-2 ${
        chon
          ? 'border-[#2C2A26] bg-[#2C2A26] text-[#FBF8F2]'
          : 'border-[#2C2A26]/20 bg-transparent text-[#2C2A26] hover:border-[#2C2A26]/60'
      }`}
    >
      {children}
    </button>
  );
}

function Hang({ nhan, children }: { nhan: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[6.5rem_minmax(0,1fr)] gap-x-4 gap-y-2 py-3.5 border-b border-[#2C2A26]/12">
      <span className="font-display italic text-lg text-[#2C2A26]/80 pt-1.5">{nhan}</span>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export default function CultureGuardDemo({ onExploreRules }: CultureGuardDemoProps) {
  // Mở đầu bằng một ca có cờ đỏ để khách thấy ngay Culture Guard làm việc
  // Giữ cả bộ đồ trong state, để lối sửa nào của luật cũng áp đủ, kể cả món không có nút chọn
  const [look, setLook] = useState<LookState>({
    thuongY: g('G06'),
    haY: g('G10'),
    thuPhuc: null,
    hai: null,
    phuKien: [],
    hoaVan: null,
    mauChinh: hexMau('Điều'),
  });
  const [dipId, setDipId] = useState('E07');
  const dip = EVENTS.find((e) => e.id === dipId) || EVENTS[0];

  const aoId = look.thuongY?.id || '';
  const khanId = look.thuPhuc?.id || '';
  const mau = tenMauTheoHex(look.mauChinh) || '';

  const setAoId = (id: string) => setLook((l) => ({ ...l, thuongY: g(id), haY: g(HA_Y_THEO_AO[id] || 'G10') }));
  const setKhanId = (id: string) => setLook((l) => ({ ...l, thuPhuc: id ? g(id) : null }));
  const setMau = (ten: string) => setLook((l) => ({ ...l, mauChinh: hexMau(ten) }));

  const ketQua = useMemo(() => kiemTraVanHoa(look, dip), [look, dip]);
  const mucDo = MUC_DO[ketQua.mucDoChung];
  const luatDau = ketQua.luatViPham[0]?.rule;
  const soLuatKhac = Math.max(0, ketQua.luatViPham.length - 1);

  // Áp một cách sửa của luật lên cả bộ đồ, Culture Guard chấm lại ngay
  const apDungCachSua = (apDung: (l: LookState) => LookState) => setLook((l) => apDung(l));

  return (
    <div className="w-full flex flex-col">
      {/* Bàn chọn */}
      <div className="border-t border-[#2C2A26]/12">
        <Hang nhan="Mặc áo">
          {CHON_AO.map((id) => (
            <Chip key={id} chon={aoId === id} onClick={() => setAoId(id)}>
              {g(id)?.ten}
            </Chip>
          ))}
        </Hang>
        <Hang nhan="Màu chính">
          {CHON_MAU.map((ten) => (
            <Chip key={ten} chon={mau === ten} onClick={() => setMau(ten)}>
              <span aria-hidden="true" className="w-3 h-3 border border-current/30" style={{ backgroundColor: hexMau(ten) }} />
              {ten}
            </Chip>
          ))}
        </Hang>
        <Hang nhan="Khăn, nón">
          {CHON_KHAN.map((id) => (
            <Chip key={id || 'khong'} chon={khanId === id} onClick={() => setKhanId(id)}>
              {id ? g(id)?.ten : 'Để đầu trần'}
            </Chip>
          ))}
        </Hang>
        <Hang nhan="Đi đâu">
          {CHON_DIP.map((id) => (
            <Chip key={id} chon={dipId === id} onClick={() => setDipId(id)}>
              {EVENTS.find((e) => e.id === id)?.ten}
            </Chip>
          ))}
        </Hang>
      </div>

      {/* Lời Culture Guard, trình bày như tấm biển chú thích */}
      <div
        aria-live="polite"
        className="mt-6 bg-[#FBF8F2] border border-[#2C2A26]/12 border-l-4 px-5 sm:px-6 py-5 flex flex-col gap-3 transition-colors"
        style={{ borderLeftColor: mucDo.mau }}
      >
        <div className="flex items-baseline justify-between gap-4 flex-wrap">
          <p className="font-display text-2xl sm:text-[28px] leading-tight m-0" style={{ color: mucDo.mau }}>
            {mucDo.chu}
          </p>
          {luatDau && (
            <span className="font-sans text-xs text-[#2C2A26]/70">
              {DO_CHAC_CHAN[luatDau.doChacChan]}
              {soLuatKhac > 0 ? ` · thêm ${soLuatKhac} lưu ý khác` : ''}
            </span>
          )}
        </div>

        {luatDau ? (
          <>
            <p className="font-sans text-sm font-semibold text-[#2C2A26] m-0">{luatDau.ten}</p>
            <p className="font-sans text-[15px] leading-relaxed text-[#2C2A26] m-0 max-w-[62ch]">{luatDau.thongDiep}</p>
            <SourceTag sourceIds={luatDau.sourceIds} className="self-start" />
            {Array.isArray(luatDau.cachSua) && luatDau.cachSua.some((c) => c.apDung) && (
              <div className="flex flex-col gap-2 pt-3 mt-1 border-t border-[#2C2A26]/12">
                <span className="font-sans text-xs text-[#2C2A26]/70">Lối sửa, bấm để thử ngay</span>
                <div className="flex flex-wrap gap-2">
                  {luatDau.cachSua
                    .filter((c) => c.apDung)
                    .map((c) => (
                      <button
                        key={c.moTa}
                        type="button"
                        onClick={() => c.apDung && apDungCachSua(c.apDung)}
                        className="min-h-[40px] px-3.5 py-1.5 border border-[#A8322A] text-[#A8322A] hover:bg-[#A8322A] hover:text-[#FBF8F2] text-sm font-sans transition-colors cursor-pointer active:scale-[0.98] text-left"
                      >
                        {c.moTa}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="font-sans text-[15px] leading-relaxed text-[#2C2A26] m-0 max-w-[62ch]">{ketQua.thongDiep}</p>
        )}
      </div>

      {onExploreRules && (
        <button
          type="button"
          onClick={onExploreRules}
          className="self-start mt-4 font-sans text-sm text-[#2C2A26] underline underline-offset-4 decoration-[#2C2A26]/30 hover:text-[#A8322A] hover:decoration-[#A8322A] cursor-pointer"
        >
          Xem đủ {CULTURE_RULES.length} luật văn hoá và nguồn của từng luật
        </button>
      )}
    </div>
  );
}
