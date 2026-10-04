import { useLayoutEffect, useRef } from 'react';
import { gsap } from '../../lib/gsap';
import { store } from '../../lib/store';
import { GARMENTS } from '../../data/garments';
import { SOURCES } from '../../data/sources';
import { SO_HIEN_VAT, SO_LUAT, SO_NGUON } from '../../data/constants';

// Tiền sảnh: hai chữ MẶC VIỆT rất lớn đứng hai bên một hiện vật thật được chiếu đèn.
// Hiện vật nằm đè lên chữ, như người xem đứng trước tủ kính và tên phòng trưng bày sơn trên tường phía sau.

const TEN_VUNG: Record<string, string> = {
  bac: 'Bắc Bộ',
  trung: 'Trung Bộ',
  nam: 'Nam Bộ',
  tay_bac: 'Tây Bắc',
  toan_quoc: 'Toàn quốc',
};

const LOI_DI = [
  { href: '#phong-2', ten: 'Vấn đề' },
  { href: '#phong-3', ten: 'Hiện vật' },
  { href: '#phong-4', ten: 'Vùng miền' },
  { href: '#phong-5', ten: 'Culture Guard' },
  { href: '#phong-6', ten: 'Hỏi đáp' },
];

const SU_KIEN_MO_MAN = 'macviet:mo-man';

export default function HeroTienSanh() {
  const rootRef = useRef<HTMLElement>(null);

  const tuThan = GARMENTS.find((g) => g.ten === 'Áo tứ thân');
  const nguonTuThan = tuThan
    ? tuThan.sourceIds
        .map((id) => SOURCES.find((s) => s.id === id)?.tenNgan)
        .filter(Boolean)
        .join(' · ')
    : '';

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(root);

      // Trạng thái trước khi mở màn: hiện vật còn trong bóng tối, chữ còn nấp sau tủ kính
      gsap.set(q('.hs-khung'), { clipPath: 'inset(100% 0% 0% 0%)' });
      gsap.set(q('.hs-anh'), { scale: 1.18 });
      gsap.set(q('.hs-chu-trai'), { xPercent: 18, opacity: 0 });
      gsap.set(q('.hs-chu-phai'), { xPercent: -18, opacity: 0 });
      gsap.set(q('.hs-hien'), { y: 24, opacity: 0 });
      gsap.set(q('.hs-den'), { opacity: 0 });

      // Kể theo trình tự: đèn bật, hiện vật hiện ra, tên phòng bước ra từ sau hiện vật, rồi tới lời mời
      const tl = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } });
      tl.to(q('.hs-den'), { opacity: 1, duration: 1.2, ease: 'power1.inOut' })
        .to(q('.hs-khung'), { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'power4.inOut' }, 0.15)
        .to(q('.hs-anh'), { scale: 1, duration: 1.8, ease: 'power3.out' }, 0.15)
        .to(q('.hs-chu-trai, .hs-chu-phai'), { xPercent: 0, opacity: 1, duration: 1.4, ease: 'expo.out' }, 0.75)
        .to(q('.hs-hien'), { y: 0, opacity: 1, duration: 0.8, stagger: 0.08 }, 1.15)
        .add(() => gsap.set(q('.hs-khung'), { clearProps: 'clipPath' }));

      let daMo = false;
      const moMan = () => {
        if (daMo) return;
        daMo = true;
        tl.play();
      };
      window.addEventListener(SU_KIEN_MO_MAN, moMan);
      // Phòng khi preloader đã đóng từ trước hoặc không phát sự kiện
      const duPhong = window.setTimeout(moMan, 6000);

      const mm = gsap.matchMedia();

      // Cuộn rời tiền sảnh: hai chữ tách ra như hai cánh cửa, hiện vật tiến lại gần người xem
      mm.add('(min-width: 1024px)', () => {
        const st = {
          trigger: root,
          start: 'top top',
          end: 'bottom top',
          scrub: 0.6,
        };
        gsap.to(q('.hs-cuon-trai'), { xPercent: -28, ease: 'none', scrollTrigger: st });
        gsap.to(q('.hs-cuon-phai'), { xPercent: 28, ease: 'none', scrollTrigger: st });
        gsap.to(q('.hs-cuon-khung'), { scale: 1.12, yPercent: 6, ease: 'none', scrollTrigger: st });
        gsap.to(q('.hs-cuon-chan'), { opacity: 0, y: -40, ease: 'none', scrollTrigger: { ...st, end: '45% top' } });
      });

      // Chiều sâu theo con trỏ: chữ trên tường lệch ít, hiện vật lệch ngược chiều
      mm.add('(min-width: 1024px) and (pointer: fine)', () => {
        const xChu = gsap.quickTo(q('.hs-tuong'), 'x', { duration: 1.2, ease: 'power3.out' });
        const yChu = gsap.quickTo(q('.hs-tuong'), 'y', { duration: 1.2, ease: 'power3.out' });
        const xKhung = gsap.quickTo(q('.hs-tu-kinh'), 'x', { duration: 1.2, ease: 'power3.out' });
        const yKhung = gsap.quickTo(q('.hs-tu-kinh'), 'y', { duration: 1.2, ease: 'power3.out' });
        const onMove = (e: PointerEvent) => {
          const nx = e.clientX / window.innerWidth - 0.5;
          const ny = e.clientY / window.innerHeight - 0.5;
          xChu(nx * -14);
          yChu(ny * -8);
          xKhung(nx * 10);
          yKhung(ny * 6);
        };
        root.addEventListener('pointermove', onMove);
        return () => root.removeEventListener('pointermove', onMove);
      });

      return () => {
        window.removeEventListener(SU_KIEN_MO_MAN, moMan);
        window.clearTimeout(duPhong);
      };
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      id="phong-1"
      className="relative w-full min-h-[100svh] lg:h-[100svh] lg:min-h-[680px] overflow-hidden bg-[#F2EDE3] text-[#2C2A26] border-b border-[#2C2A26]/12"
      style={{ ['--hs-khung' as string]: 'min(27vw, calc(66svh * 0.75), 500px)' }}
    >
      {/* Ánh đèn rọi từ trần xuống tường, sau hiện vật */}
      <div
        aria-hidden="true"
        className="hs-den pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 38% 62% at 50% 8%, rgba(255,253,247,0.95) 0%, rgba(255,253,247,0.55) 45%, rgba(255,253,247,0) 75%), linear-gradient(180deg, rgba(233,226,212,0) 0%, rgba(233,226,212,0) 78%, rgba(226,217,199,0.85) 100%)',
        }}
      />

      {/* Thanh trên: thương hiệu và lối đi giữa các phòng */}
      <header className="hs-hien absolute top-0 inset-x-0 z-30 flex items-center justify-between gap-6 px-5 sm:px-10 lg:px-14 h-[72px]">
        <a href="#phong-1" className="flex items-baseline gap-3 no-underline text-[#2C2A26]">
          <span className="font-mono text-xs font-semibold tracking-[0.22em] text-[#A8322A]">MẶC VIỆT</span>
          <span className="hidden sm:inline font-sans text-[13px] text-[#2C2A26]/70">
            Phòng trưng bày trang phục Việt
          </span>
        </a>
        <nav aria-label="Các phòng trưng bày" className="hidden lg:flex items-center gap-7">
          {LOI_DI.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="font-sans text-[13px] text-[#2C2A26]/75 hover:text-[#A8322A] transition-colors no-underline"
            >
              {l.ten}
            </a>
          ))}
        </nav>
      </header>

      {/* Sân khấu chính */}
      <div className="relative z-10 h-full flex flex-col lg:block pt-[96px] lg:pt-0 pb-12 lg:pb-0">
        {/* Tên phòng trưng bày sơn trên tường, hai chữ nấp một phần sau hiện vật */}
        <div className="hs-tuong lg:absolute lg:inset-x-0 lg:top-[45%] lg:-translate-y-1/2 z-0 pointer-events-none select-none">
          <h1
            className="font-display font-light text-[#2C2A26] leading-[0.82] tracking-[-0.045em] m-0 flex justify-center gap-x-[4vw] lg:grid lg:grid-cols-[1fr_var(--hs-khung)_1fr] lg:gap-0 text-[24vw] lg:text-[clamp(150px,19vw,380px)]"
            style={{ fontVariationSettings: '"opsz" 144, "SOFT" 30' }}
          >
            <span className="hs-cuon-trai inline-block lg:justify-self-end lg:-mr-[0.025em]">
              <span className="hs-chu-trai inline-block">Mặc</span>
            </span>
            <span aria-hidden="true" className="hidden lg:block" />
            <span className="hs-cuon-phai inline-block lg:justify-self-start lg:-ml-[0.07em]">
              <span className="hs-chu-phai inline-block italic text-[#A8322A]">Việt</span>
            </span>
          </h1>
        </div>

        {/* Hiện vật trong tủ kính, đè lên chữ */}
        <div className="hs-tu-kinh relative lg:absolute lg:left-1/2 lg:top-[50%] lg:-translate-x-1/2 lg:-translate-y-[52%] z-20 mx-auto mt-12 lg:mt-0 w-[min(66vw,340px)] lg:w-[var(--hs-khung)]">
          <div className="hs-cuon-khung origin-center">
            <figure className="relative m-0">
              <div className="hs-khung relative aspect-[3/4] overflow-hidden bg-[#C9A33A] outline outline-1 outline-[#C39A27]/70 outline-offset-[10px] shadow-[0_60px_90px_-45px_rgba(44,42,38,0.6)]">
                {/* Cắt từ vai xuống để thấy rõ thân áo, yếm đào và nút thắt vạt */}
                <div className="absolute inset-0" style={{ transform: 'scale(1.5)', transformOrigin: '50% 100%' }}>
                  <img
                    src="/anh/tl-tu-than-bt.jpg"
                    alt="Áo tứ thân nâu, yếm đào trên ma-nơ-canh tại Bảo tàng Dân tộc học Việt Nam"
                    className="hs-anh absolute inset-0 w-full h-full object-cover"
                    style={{ objectPosition: '50% 100%', transformOrigin: '50% 60%' }}
                    fetchPriority="high"
                  />
                </div>
              </div>
              {/* Số hiệu hiện vật như ở bảo tàng */}
              <span className="hs-hien absolute -top-[34px] left-0 font-mono text-[10px] tracking-[0.18em] text-[#2C2A26]/70">
                HIỆN VẬT 01 / {String(SO_HIEN_VAT).padStart(2, '0')}
              </span>
            </figure>
          </div>
        </div>

        {/* Chân tường: lời mời bên trái, biển chú thích bên phải */}
        <div className="hs-cuon-chan relative lg:absolute lg:inset-x-0 lg:bottom-0 z-20 mt-14 lg:mt-0 px-5 sm:px-10 lg:px-14 pb-0 lg:pb-12 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-12">
          <div className="max-w-[min(30vw,420px)] min-w-0 w-full lg:w-auto max-lg:max-w-[520px]">
            <p className="hs-hien font-display text-[26px] lg:text-[clamp(22px,1.9vw,32px)] leading-[1.15] font-normal text-[#2C2A26] mb-3">
              Người Việt mặc lại áo của mình.
            </p>
            <p className="hs-hien font-sans text-[15px] leading-relaxed text-[#2C2A26]/75 mb-7">
              Phối trang phục truyền thống theo dịp, theo vùng, có nguồn cho từng lựa chọn.
            </p>
            <button
              type="button"
              onClick={() => store.setScreen('studio')}
              className="hs-hien group inline-flex items-center gap-4 min-h-[52px] px-7 bg-[#A8322A] text-[#F2EDE3] hover:bg-[#8F2821] font-mono text-xs uppercase tracking-[0.2em] rounded-[2px] active:scale-[0.98] transition-colors cursor-pointer"
            >
              <span>Bước vào xưởng phối</span>
              <span aria-hidden="true" className="inline-block transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </button>
          </div>

          {tuThan && (
            <aside
              aria-label="Biển chú thích hiện vật"
              className="hs-hien w-full max-w-[380px] lg:max-w-[min(28vw,380px)] bg-[#FBF8F2] border border-[#2C2A26]/12 px-5 py-4 shadow-[0_1px_2px_rgba(44,42,38,0.08)]"
            >
              <p className="font-display text-xl leading-tight m-0">{tuThan.ten} &amp; yếm đào</p>
              <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 font-mono text-[10.5px] leading-snug text-[#2C2A26]/80 m-0">
                <dt className="text-[#2C2A26]/70">Vùng</dt>
                <dd className="m-0">{tuThan.vung.map((v) => TEN_VUNG[v] ?? v).join(', ')}</dd>
                <dt className="text-[#2C2A26]/70">Niên đại</dt>
                <dd className="m-0">{tuThan.nienDai}</dd>
                <dt className="text-[#2C2A26]/70">Chất liệu</dt>
                <dd className="m-0">{tuThan.chatLieuPhoBien.join(', ')}</dd>
                <dt className="text-[#2C2A26]/70">Nguồn</dt>
                <dd className="m-0">{nguonTuThan}</dd>
              </dl>
              <p className="mt-3 pt-3 border-t border-[#2C2A26]/12 font-mono text-[10px] text-[#2C2A26]/70 m-0">
                Ảnh: Daderot, Bảo tàng Dân tộc học Việt Nam, CC0
              </p>
            </aside>
          )}
        </div>

        {/* Số liệu bộ sưu tập, đọc từ dữ liệu */}
        <p className="hs-hien hidden xl:block absolute left-1/2 -translate-x-1/2 bottom-6 z-20 font-mono text-[10px] tracking-[0.18em] text-[#2C2A26]/70 m-0 whitespace-nowrap">
          {SO_HIEN_VAT} HIỆN VẬT · {SO_LUAT} LUẬT VĂN HOÁ · {SO_NGUON} NGUỒN
        </p>
      </div>
    </section>
  );
}
