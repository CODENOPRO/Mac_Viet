import { useLayoutEffect, useRef, useState } from 'react';
import { gsap } from '../../lib/gsap';
import { GARMENTS } from '../../data/garments';
import { REGIONS, ISLAND_TERRITORIES } from '../../data/regions';
import { TRADITIONAL_COLORS } from '../../data/palettes';
import { RegionId, Garment } from '../../types';
import BanDoVietNam from '../shared/BanDoVietNam';

// Gian Địa dư: phòng tối duy nhất của buổi đi dạo.
// Bên trái là mục lục các vùng xếp từ bắc vào nam, ở giữa là bản đồ, bên phải là tấm biển của vùng đang chọn.

type MaDao = 'HOANG_SA' | 'TRUONG_SA';

const MA_VUNG: Record<string, RegionId> = {
  R01: 'bac',
  R02: 'trung',
  R03: 'nam',
  R04: 'tay_bac',
};

// Thứ tự trên mục lục: từ bắc vào nam, khớp với vị trí trên bản đồ
const THU_TU_VUNG = ['R04', 'R01', 'R02', 'R03'];
const THU_TU_DAO: MaDao[] = ['HOANG_SA', 'TRUONG_SA'];

const tenMau = (hex: string) =>
  TRADITIONAL_COLORS.find((c) => c.hex.toLowerCase() === hex.toLowerCase())?.ten ?? null;

// "Trung Bộ, trọng tâm Huế" thành tên chính và phần phụ
const tachTen = (ten: string) => {
  const [chinh, ...phu] = ten.split(',');
  return { chinh: chinh.trim(), phu: phu.join(',').trim() };
};

interface GianDiaDuProps {
  onChonHienVat: (g: Garment) => void;
}

export default function GianDiaDu({ onChonHienVat }: GianDiaDuProps) {
  const rootRef = useRef<HTMLElement>(null);
  const bienRef = useRef<HTMLDivElement>(null);
  const [vungId, setVungId] = useState<string>('R01');
  const [dao, setDao] = useState<MaDao | null>(null);

  const vung = REGIONS.find((r) => r.id === vungId) ?? REGIONS[0];
  const duLieuDao = dao ? ISLAND_TERRITORIES[dao] : null;
  const maVung = MA_VUNG[vungId] ?? 'bac';
  const hienVatVung = GARMENTS.filter((g) => g.vung.includes(maVung));
  const soMonDungChung = GARMENTS.filter(
    (g) => g.vung.includes('toan_quoc') && !g.vung.includes(maVung)
  ).length;
  const mauVung = vung.bangMau
    .map((hex) => ({ hex, ten: tenMau(hex) }))
    .filter((m): m is { hex: string; ten: string } => m.ten !== null);

  const chonVung = (id: string) => {
    if (id === 'HOANG_SA' || id === 'TRUONG_SA') {
      setDao(id);
    } else {
      setVungId(id);
      setDao(null);
    }
  };

  // Vào phòng: mục lục, bản đồ, tấm biển hiện ra theo thứ tự đọc
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      gsap.from('.dd-vao', {
        y: 24,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: { trigger: root, start: 'top 70%', once: true },
      });
    }, root);
    return () => ctx.revert();
  }, []);

  // Đổi vùng: tấm biển thay nội dung từ trên xuống, cho thấy trạng thái đã đổi
  useLayoutEffect(() => {
    const bien = bienRef.current;
    if (!bien || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.dd-doi',
        { y: 18, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.55, stagger: 0.05, ease: 'power3.out' }
      );
    }, bien);
    return () => ctx.revert();
  }, [vungId, dao]);

  const nutMucLuc = (id: string, so: string, ten: string, dangChon: boolean) => (
    <button
      key={id}
      type="button"
      onClick={() => chonVung(id)}
      aria-pressed={dangChon}
      className={`group relative flex items-baseline gap-3 lg:gap-4 shrink-0 text-left py-2 lg:py-2.5 pl-4 pr-3 lg:pr-0 cursor-pointer transition-colors ${
        dangChon ? 'text-[#F2EDE3]' : 'text-[#F2EDE3]/60 hover:text-[#F2EDE3]'
      }`}
    >
      <span
        aria-hidden="true"
        className={`absolute left-0 top-1/2 -translate-y-1/2 w-[2px] transition-all duration-300 ${
          dangChon ? 'h-[70%] bg-[#A8322A]' : 'h-0 bg-[#C39A27]'
        }`}
      />
      {so ? (
        <span className="font-mono text-[11px] tabular-nums w-[2ch]">{so}</span>
      ) : (
        <span aria-hidden="true" className="w-[2ch] flex justify-center">
          <span className="block w-1.5 h-1.5 rotate-45 bg-[#C39A27]" />
        </span>
      )}
      <span className="font-display text-xl lg:text-2xl font-light whitespace-nowrap">{ten}</span>
    </button>
  );

  return (
    <section
      ref={rootRef}
      id="phong-4"
      className="relative w-full min-h-[100svh] bg-[#16243A] text-[#F2EDE3] border-b border-[#F2EDE3]/15 px-5 sm:px-10 lg:px-14 py-20 lg:py-16 overflow-hidden"
    >
      <div className="grid grid-cols-1 md:max-xl:grid-cols-[minmax(0,1fr)_auto] xl:max-[1399px]:grid-cols-[240px_auto_minmax(0,1fr)] min-[1400px]:max-[1535px]:grid-cols-[300px_auto_minmax(0,1fr)] 2xl:grid-cols-[340px_auto_minmax(0,1fr)] gap-10 lg:gap-12 xl:gap-16 items-start">
        {/* Cột trái: tên phòng và mục lục vùng, từ bắc vào nam */}
        <div className="dd-vao @container flex flex-col">
          <h2 className="font-display font-light text-[clamp(24px,13cqw,58px)] leading-[1] tracking-[-0.02em] m-0">
            <span className="whitespace-nowrap">Đất non sông,</span>
            <br />
            <span className="whitespace-nowrap">
              <span className="italic text-[#C39A27]">nếp áo</span> từng miền.
            </span>
          </h2>
          <p className="font-sans text-[15px] leading-relaxed text-[#F2EDE3]/75 mt-5 mb-0 max-w-[44ch]">
            Mỗi vùng một cách mặc, một bảng màu, một loại vải. Chọn trên bản đồ hoặc trong mục lục.
          </p>

          <nav aria-label="Chọn vùng" className="mt-8 xl:mt-10 pt-6 border-t border-[#F2EDE3]/15">
            <div className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible -mx-5 px-5 md:mx-0 md:px-0 pb-2 md:pb-0">
              {THU_TU_VUNG.map((id, i) => {
                const r = REGIONS.find((x) => x.id === id);
                if (!r) return null;
                return nutMucLuc(id, String(i + 1).padStart(2, '0'), tachTen(r.ten).chinh, !dao && vungId === id);
              })}
              <span className="hidden md:block font-sans text-xs text-[#F2EDE3]/70 mt-5 mb-1 pl-4">Biển đảo</span>
              <span aria-hidden="true" className="md:hidden self-center w-px h-6 bg-[#F2EDE3]/20 mx-2 shrink-0" />
              {THU_TU_DAO.map((id) =>
                nutMucLuc(id, '', ISLAND_TERRITORIES[id].ten.replace('Quần đảo ', ''), dao === id)
              )}
            </div>
          </nav>
        </div>

        {/* Bản đồ */}
        <div className="dd-vao flex justify-center text-[#F2EDE3]">
          <BanDoVietNam
            vungDangChon={dao || vungId}
            onChonVung={chonVung}
            kichThuoc="lon"
            hienNhanDao={true}
            svgClassName="h-[62svh] md:h-[min(78svh,760px)] xl:h-[calc(100svh-200px)] max-h-[820px] min-h-[420px] w-auto max-w-full"
          />
        </div>

        {/* Tấm biển của vùng đang chọn */}
        <div ref={bienRef} className="dd-vao min-w-0 md:max-xl:col-span-2" aria-live="polite">
          {duLieuDao ? (
            <article className="flex flex-col gap-6">
              <p className="dd-doi font-mono text-[11px] tracking-[0.18em] text-[#C39A27] m-0">
                QUẦN ĐẢO · {duLieuDao.donViHanhChinh.toUpperCase()}
              </p>
              <h3 className="dd-doi font-display font-light text-[56px] lg:text-[clamp(60px,5.6vw,104px)] leading-[0.9] tracking-[-0.03em] m-0">
                {duLieuDao.ten.replace('Quần đảo ', '')}
              </h3>
              <p className="dd-doi font-display italic text-xl lg:text-2xl text-[#F2EDE3]/85 m-0">
                Không gian văn hoá: {duLieuDao.phanVungVanHoa}
              </p>
              <p className="dd-doi font-sans text-base leading-relaxed text-[#F2EDE3]/80 max-w-[60ch] m-0">
                {duLieuDao.moTa}
              </p>
              <p className="dd-doi font-sans text-sm leading-relaxed text-[#F2EDE3]/75 max-w-[60ch] border-l-2 border-[#C39A27] pl-4 m-0">
                {duLieuDao.ghiChuPhanVung}
              </p>
            </article>
          ) : (
            <article className="flex flex-col">
              <p className="dd-doi font-mono text-[11px] tracking-[0.18em] text-[#C39A27] m-0">
                VÙNG {String(THU_TU_VUNG.indexOf(vungId) + 1).padStart(2, '0')} / {String(THU_TU_VUNG.length).padStart(2, '0')}
              </p>
              <h3 className="dd-doi font-display font-light text-[56px] lg:text-[clamp(60px,5.6vw,104px)] leading-[0.9] tracking-[-0.03em] mt-4 mb-0">
                {tachTen(vung.ten).chinh}
                {tachTen(vung.ten).phu && (
                  <span className="block text-[0.32em] italic tracking-normal text-[#F2EDE3]/75 mt-3">
                    {tachTen(vung.ten).phu}
                  </span>
                )}
              </h3>
              <p className="dd-doi font-sans text-sm text-[#F2EDE3]/75 mt-5 mb-0">{vung.khongGianVanHoa}</p>
              <p className="dd-doi font-display italic text-xl lg:text-[26px] leading-snug text-[#F2EDE3] mt-3 mb-0 max-w-[34ch]">
                {vung.dacTrung}
              </p>

              <div className="grid grid-cols-1 sm:max-xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] min-[1400px]:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] gap-10 mt-10">
                {/* Trang phục tiêu biểu: bấm để xem chi tiết hiện vật */}
                <div className="dd-doi">
                  <p className="font-sans text-xs text-[#F2EDE3]/70 mb-2 mt-0">Trang phục của vùng</p>
                  <ul className="list-none m-0 p-0 border-t border-[#F2EDE3]/15">
                    {hienVatVung.map((g) => (
                      <li key={g.id} className="border-b border-[#F2EDE3]/15">
                        <button
                          type="button"
                          onClick={() => onChonHienVat(g)}
                          className="group w-full flex items-baseline justify-between gap-4 py-3 text-left cursor-pointer"
                        >
                          <span className="min-w-0">
                            <span className="block font-display text-lg lg:text-xl text-[#F2EDE3] group-hover:text-[#C39A27] transition-colors">
                              {g.ten}
                            </span>
                            <span className="block font-mono text-[10.5px] text-[#F2EDE3]/70 mt-0.5 leading-snug">
                              {g.nienDai}
                            </span>
                          </span>
                          <span
                            aria-hidden="true"
                            className="text-[#C39A27] opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all"
                          >
                            →
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                  {hienVatVung.length === 0 && (
                    <ul className="list-none m-0 p-0">
                      {vung.trangPhucTieuBieu.map((ten) => (
                        <li key={ten} className="border-b border-[#F2EDE3]/15 py-3">
                          <span className="block font-display text-lg lg:text-xl text-[#F2EDE3] first-letter:uppercase">
                            {ten}
                          </span>
                          <span className="block font-mono text-[10.5px] text-[#F2EDE3]/70 mt-0.5">
                            chưa có hồ sơ trong bộ sưu tập
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {soMonDungChung > 0 && (
                    <p className="font-sans text-xs text-[#F2EDE3]/70 mt-3 mb-0">
                      Cùng {soMonDungChung} món mặc được ở mọi vùng.
                    </p>
                  )}
                </div>

                {/* Bảng màu và chất liệu */}
                <div className="dd-doi flex flex-col gap-8">
                  {mauVung.length > 0 && (
                    <div>
                      <p className="font-sans text-xs text-[#F2EDE3]/70 mb-3 mt-0">Bảng màu</p>
                      <div className="flex gap-2">
                        {mauVung.map((m) => (
                          <div key={m.hex} className="flex-1 min-w-0">
                            <div
                              className="h-20 lg:h-24 border border-[#F2EDE3]/20"
                              style={{ backgroundColor: m.hex }}
                            />
                            <p className="font-mono text-[10px] leading-tight text-[#F2EDE3]/75 mt-2 mb-0">{m.ten}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <p className="font-sans text-xs text-[#F2EDE3]/70 mb-2 mt-0">Chất liệu</p>
                    <p className="font-display text-lg leading-snug text-[#F2EDE3] m-0">
                      {vung.chatLieu.join(' · ')}
                    </p>
                  </div>
                </div>
              </div>

              {vung.ghiChuTonTrong && (
                <p className="dd-doi font-sans text-sm leading-relaxed text-[#F2EDE3]/80 max-w-[62ch] border-l-2 border-[#A8322A] pl-4 mt-10 mb-0">
                  {vung.ghiChuTonTrong}
                </p>
              )}
            </article>
          )}
        </div>
      </div>
    </section>
  );
}
