import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { gsap } from '../../lib/gsap';
import { TRADITIONAL_COLORS } from '../../data/palettes';

// Màn chờ: một khung cửi trên tường phòng trưng bày.
// Sợi dọc căng sẵn, con thoi chạy qua lại, mỗi lượt để lại một sợi ngang màu truyền thống.
// Tấm vải được dệt đúng ở chỗ khung hiện vật của tiền sảnh. Dệt xong, tường lui đi,
// tấm vải được kéo lên và chiếc áo thật lộ ra bên dưới.

interface PreloaderProps {
  onComplete: () => void;
}

const SO_COT = 24; // sợi dọc
const SO_HANG = 32; // sợi ngang, tỉ lệ 3:4 khớp khung hiện vật
const O = 10; // cỡ một ô dệt trong hệ toạ độ svg
const ANH_TIEN_SANH = '/anh/tl-tu-than-bt.jpg';
const SU_KIEN_MO_MAN = 'macviet:mo-man';

const MAU_SOI_DOC = '#E4D6BA';

// Khổ vải sọc: nền chàm, điểm nâu non, yếm đào, hoàng, điều. Tên màu lấy từ dữ liệu.
const KHO_VAI: [string, number][] = [
  ['Chàm', 3], ['Nâu non', 2], ['Chàm', 2], ['Yếm đào', 1], ['Chàm', 3], ['Hoàng', 1],
  ['Chàm', 2], ['Nâu non', 3], ['Điều', 1], ['Chàm', 3], ['Yếm đào', 1], ['Chàm', 2],
  ['Hoàng', 1], ['Nâu non', 2], ['Chàm', 3], ['Điều', 2],
];

const mauTheoTen = (ten: string) =>
  TRADITIONAL_COLORS.find((c) => c.ten === ten) ?? { ten, hex: '#16243A' };

interface KhungDet {
  left: number;
  top: number;
  width: number;
  height: number;
}

// Đo khung hiện vật của tiền sảnh để dệt đúng chỗ. Không thấy thì đặt giữa màn.
const doKhung = (): KhungDet => {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const el = document.querySelector('.hs-khung');
  if (el) {
    const r = el.getBoundingClientRect();
    if (r.width > 40 && r.top < vh && r.bottom > 0) {
      return { left: r.left, top: r.top, width: r.width, height: r.height };
    }
  }
  const width = Math.min(vw * 0.6, vh * 0.5, 420);
  const height = (width * 4) / 3;
  return { left: (vw - width) / 2, top: (vh - height) / 2, width, height };
};

export default function Preloader({ onComplete }: PreloaderProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [khung, setKhung] = useState<KhungDet | null>(null);
  const [hang, setHang] = useState(0);

  // Trải khổ vải thành từng sợi ngang
  const soiNgang = useMemo(() => {
    const ds: { ten: string; hex: string }[] = [];
    let i = 0;
    while (ds.length < SO_HANG) {
      const [ten, so] = KHO_VAI[i % KHO_VAI.length];
      const mau = mauTheoTen(ten);
      for (let k = 0; k < so && ds.length < SO_HANG; k++) ds.push({ ten: mau.ten, hex: mau.hex });
      i++;
    }
    // Dệt từ dưới lên, như trên khung cửi thật
    return ds;
  }, []);

  useLayoutEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onComplete();
      return;
    }
    setKhung(doKhung());
    const onResize = () => setKhung(doKhung());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const daDoKhung = khung !== null;

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || !daDoKhung) return;

    let fontXong = false;
    let anhXong = false;
    const batDau = performance.now();
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => (fontXong = true), () => (fontXong = true));
    const img = new Image();
    img.onload = img.onerror = () => (anhXong = true);
    img.src = ANH_TIEN_SANH;

    const ctx = gsap.context(() => {
      const hangEls = gsap.utils.toArray<SVGGElement>('.pl-hang');
      const thoi = root.querySelector<SVGGElement>('.pl-thoi');

      gsap.set('.pl-chu', { y: 16, opacity: 0 });
      gsap.set('.pl-vien, .pl-thuoc', { opacity: 0 });
      gsap.set('.pl-soi-doc', { svgOrigin: '0 0', smoothOrigin: false, scaleY: 0 });

      const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' } });

      // Căng sợi dọc, chữ hiện lên
      tl.to('.pl-soi-doc', { scaleY: 1, duration: 0.5, stagger: { each: 0.012, from: 'center' }, ease: 'power3.out' })
        .to('.pl-chu', { y: 0, opacity: 1, duration: 0.6, stagger: 0.08, ease: 'power3.out' }, 0.1)
        .to('.pl-vien, .pl-thuoc', { opacity: 1, duration: 0.6 }, 0.1);

      // Con thoi chạy, mỗi lượt đổi chiều, để lại một sợi ngang
      const nhip = 0.055;
      hangEls.forEach((el, i) => {
        const sangPhai = i % 2 === 0;
        const y = (SO_HANG - 1 - i) * O + O / 2;
        const at = 0.35 + i * nhip;
        // svgOrigin tính bằng toạ độ svg; transformOrigin phần trăm bị lệch khi svg co giãn không giữ tỉ lệ
        gsap.set(el, { svgOrigin: `${sangPhai ? 0 : SO_COT * O} ${y}`, smoothOrigin: false, scaleX: 0 });
        tl.to(el, { scaleX: 1, duration: nhip * 1.6, ease: 'power1.out' }, at);
        if (thoi) {
          tl.fromTo(
            thoi,
            { x: sangPhai ? -O : SO_COT * O + O, y },
            { x: sangPhai ? SO_COT * O + O : -O, y, duration: nhip * 1.6, ease: 'power1.out' },
            at
          );
        }
        tl.call(() => setHang(i + 1), [], at);
      });
      if (thoi) tl.to(thoi, { opacity: 0, duration: 0.2 });

      // Chờ font và ảnh tiền sảnh, tối đa thêm 1.2 giây
      tl.add(() => {
        tl.pause();
        const cho = () => {
          if ((fontXong && anhXong) || performance.now() - batDau > 4200) {
            tl.play();
          } else {
            requestAnimationFrame(cho);
          }
        };
        cho();
      });

      // Tường lui đi, chỉ còn tấm vải trên khung
      tl.addLabel('thoat', '+=0.15');
      tl.to('.pl-chu', { y: -12, opacity: 0, duration: 0.4, stagger: 0.04, ease: 'power2.in' }, 'thoat');
      tl.to('.pl-tuong, .pl-thuoc', { opacity: 0, duration: 0.5, ease: 'power1.inOut' }, '<0.15');

      // Báo tiền sảnh mở màn. Hiện vật lộ dần từ dưới lên trong 1.3 giây sau 0.15 giây,
      // tấm vải được kéo lên cùng nhịp để mép vải trùng mép ảnh.
      tl.add(() => {
        root.style.pointerEvents = 'none';
        window.dispatchEvent(new Event(SU_KIEN_MO_MAN));
      });
      tl.to('.pl-vai', { clipPath: 'inset(0% -8% 100% -8%)', duration: 1.3, ease: 'power4.inOut' }, '>0.15');
      tl.set('.pl-vien', { opacity: 0 });
      tl.add(() => onComplete());

      // Bấm chuột hoặc Esc, Enter, phím cách: bỏ qua phần dệt, đi thẳng tới đoạn kéo vải
      const boQua = () => {
        if (tl.time() < tl.labels.thoat) {
          setHang(SO_HANG);
          tl.seek('thoat').play();
        }
      };
      const boQuaPhim = (e: KeyboardEvent) => {
        if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') boQua();
      };
      root.addEventListener('click', boQua);
      window.addEventListener('keydown', boQuaPhim);
      return () => {
        root.removeEventListener('click', boQua);
        window.removeEventListener('keydown', boQuaPhim);
      };
    }, root);

    return () => {
      img.onload = img.onerror = null;
      ctx.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [daDoKhung]);

  const soiDangDet = soiNgang[Math.max(0, hang - 1)];

  return (
    <div
      ref={rootRef}
      role="progressbar"
      aria-label="Đang tải Mặc Việt"
      aria-valuemin={0}
      aria-valuemax={SO_HANG}
      aria-valuenow={hang}
      className="fixed inset-0 z-[var(--z-preloader)] select-none text-[#2C2A26] cursor-pointer"
    >
      {/* Tường phòng trưng bày, cùng màu tường tiền sảnh để lúc lui đi không thấy mối nối */}
      <div className="pl-tuong absolute inset-0 bg-[#F2EDE3]">
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 38% 62% at 50% 8%, rgba(255,253,247,0.9) 0%, rgba(255,253,247,0) 75%)',
          }}
        />

        <div className="pl-chu absolute top-0 inset-x-0 h-[72px] flex items-center px-5 sm:px-10 lg:px-14">
          <span className="font-mono text-xs font-semibold tracking-[0.22em] text-[#A8322A]">MẶC VIỆT</span>
          <span className="hidden sm:inline font-sans text-[13px] text-[#2C2A26]/70 ml-3">
            Phòng trưng bày trang phục Việt
          </span>
        </div>

        <div className="absolute inset-x-0 bottom-0 px-5 sm:px-10 lg:px-14 pb-8 lg:pb-12 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <p className="pl-chu font-display italic font-light text-[26px] lg:text-[clamp(26px,2.3vw,40px)] leading-[1.12] m-0 max-w-[16ch] lg:max-w-[20ch]">
            Mỗi tấm áo là một lần người Việt tự giới thiệu mình.
          </p>

          <div className="pl-chu flex items-center gap-3 font-mono text-[11px] text-[#2C2A26]/75 tabular-nums">
            <span
              aria-hidden="true"
              className="block w-3 h-3 border border-[#2C2A26]/20 transition-colors duration-150"
              style={{ backgroundColor: soiDangDet?.hex ?? 'transparent' }}
            />
            <span>
              Đang dệt sợi {soiDangDet?.ten.toLowerCase() ?? ''}
            </span>
            <span className="text-[#2C2A26]/40">·</span>
            <span>
              {String(hang).padStart(2, '0')} / {SO_HANG}
            </span>
            <span className="text-[#2C2A26]/40">·</span>
            <span>Bấm để bỏ qua</span>
          </div>
        </div>
      </div>

      {/* Tấm vải trên khung cửi, đặt trùng khung hiện vật */}
      {khung && (
        <div
          className="absolute"
          style={{ left: khung.left, top: khung.top, width: khung.width, height: khung.height }}
        >
          {/* Thước đo hàng dệt dọc mép phải khung, vạch sáng dần theo tiến độ */}
          <div
            aria-hidden="true"
            className="pl-thuoc absolute top-0 bottom-0 hidden sm:flex flex-col-reverse justify-between"
            style={{ left: 'calc(100% + 26px)' }}
          >
            {Array.from({ length: SO_HANG / 4 + 1 }, (_, k) => {
              const moc = k * 4;
              const daQua = hang >= moc && moc > 0;
              return (
                <div key={moc} className="flex items-center gap-2 h-0">
                  <span
                    className={`block h-px transition-all duration-300 ${
                      moc % 8 === 0 ? 'w-3' : 'w-1.5'
                    } ${daQua ? 'bg-[#A8322A]' : 'bg-[#2C2A26]/30'}`}
                  />
                  {moc % 8 === 0 && moc > 0 && (
                    <span
                      className={`font-mono text-[10px] tabular-nums transition-colors duration-300 ${
                        daQua ? 'text-[#2C2A26]' : 'text-[#2C2A26]/40'
                      }`}
                    >
                      {String(moc).padStart(2, '0')}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="pl-vien absolute inset-0 outline outline-1 outline-[#C39A27]/70 outline-offset-[10px] pointer-events-none" />
          <svg
            className="pl-vai absolute inset-0 w-full h-full overflow-visible"
            viewBox={`0 0 ${SO_COT * O} ${SO_HANG * O}`}
            preserveAspectRatio="none"
            aria-hidden="true"
            style={{ clipPath: 'inset(0% -8% 0% -8%)' }}
          >
            {/* Sợi dọc căng sẵn */}
            {Array.from({ length: SO_COT }, (_, c) => (
              <rect
                key={`d${c}`}
                className="pl-soi-doc"
                x={c * O + 2}
                y={0}
                width={O - 4}
                height={SO_HANG * O}
                fill={MAU_SOI_DOC}
              />
            ))}

            {/* Sợi ngang: một dải màu, sợi dọc nổi lên ở các ô xen kẽ (kiểu dệt trơn) */}
            {soiNgang.map((s, i) => {
              const r = SO_HANG - 1 - i;
              return (
                <g key={`n${i}`} className="pl-hang">
                  <rect x={0} y={r * O + 0.6} width={SO_COT * O} height={O - 1.2} fill={s.hex} />
                  {Array.from({ length: SO_COT }, (_, c) =>
                    (r + c) % 2 === 1 ? (
                      <rect
                        key={c}
                        x={c * O + 2}
                        y={r * O}
                        width={O - 4}
                        height={O}
                        fill={MAU_SOI_DOC}
                        fillOpacity={0.92}
                      />
                    ) : null
                  )}
                </g>
              );
            })}

            {/* Con thoi */}
            <g className="pl-thoi">
              <path d="M -9 0 L -5 -3 L 5 -3 L 9 0 L 5 3 L -5 3 Z" fill="#6E5439" />
              <rect x={-3} y={-0.6} width={6} height={1.2} fill="#F2EDE3" />
            </g>
          </svg>
        </div>
      )}
    </div>
  );
}
