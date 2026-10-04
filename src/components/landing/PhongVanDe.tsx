import { useLayoutEffect, useRef } from 'react';
import { gsap } from '../../lib/gsap';

// Gian thứ hai: vấn đề. Một chân dung thật thế kỷ 19 nhìn thẳng ra,
// đối diện là những câu hỏi người trẻ hay tự hỏi trước khi dám mặc.
// Các câu hỏi chỉ là câu hỏi, không khẳng định dữ kiện văn hoá nào.
// Mỗi câu đều có chỗ trả lời trong app: hỏi đáp, gian Danh xưng, hoặc một luật văn hoá.

const CAU_HOI: { hoi: string; chuDe: string }[] = [
  { hoi: 'Áo này là ngũ thân hay áo dài?', chuDe: 'Tên gọi' },
  { hoi: 'Mặc áo Nhật Bình đi chơi phố có ổn không?', chuDe: 'Dịp mặc' },
  { hoi: 'Đi lễ chùa thì mặc thế nào cho kín đáo?', chuDe: 'Nơi chốn' },
  { hoi: 'Đội khăn Huế với áo bà ba Nam Bộ có hợp không?', chuDe: 'Vùng miền' },
  { hoi: 'Đi giày thể thao với áo tấc có được không?', chuDe: 'Phối đồ' },
  { hoi: 'Cổ phục, Việt phục hay áo dài, gọi sao cho đúng?', chuDe: 'Tên gọi' },
];

export default function PhongVanDe() {
  const rootRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      const st = { trigger: root, start: 'top 65%', once: true };
      // Kể theo trình tự: lời nhận định, chân dung, rồi từng câu hỏi dồn lên
      gsap.from('.vd-chu', { y: 24, opacity: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out', scrollTrigger: st });
      gsap.from('.vd-anh', { y: 32, opacity: 0, duration: 1, delay: 0.2, ease: 'power3.out', scrollTrigger: st });
      gsap.from('.vd-hoi', {
        y: 18,
        opacity: 0,
        duration: 0.6,
        stagger: 0.09,
        delay: 0.45,
        ease: 'power3.out',
        scrollTrigger: st,
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      id="phong-2"
      className="relative w-full min-h-[100svh] bg-[#F2EDE3] text-[#2C2A26] border-b border-[#2C2A26]/12 px-5 sm:px-10 lg:px-14 py-20 lg:py-16 flex items-center"
    >
      <div className="w-full max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-x-10 gap-y-14 items-center">
        {/* Lời nhận định và những câu hỏi */}
        <div className="lg:col-span-7 xl:col-span-7 flex flex-col">
          <h2 className="vd-chu font-display font-light text-[clamp(32px,9.4vw,44px)] sm:text-6xl lg:text-[clamp(52px,5vw,84px)] leading-[1.02] tracking-[-0.025em] m-0">
            Ta không thiếu áo đẹp.
            <br />
            Ta thiếu người <span className="italic text-[#A8322A] whitespace-nowrap">biết mặc</span> nó.
          </h2>
          <p className="vd-chu font-sans text-base lg:text-lg leading-relaxed text-[#2C2A26]/75 mt-6 mb-0 max-w-[52ch]">
            Nhiều người trẻ muốn mặc lại áo của cha ông, nhưng ngại mặc lệch dịp, lệch vùng, và lúng túng khi
            gọi tên từng kiểu áo. Những câu hỏi rất thật, trước cả khi chọn áo:
          </p>

          <ol className="list-none m-0 p-0 mt-8 border-t border-[#2C2A26]/15">
            {CAU_HOI.map((c, i) => (
              <li
                key={c.hoi}
                className="vd-hoi grid grid-cols-[2.25rem_minmax(0,1fr)] sm:grid-cols-[2.5rem_minmax(0,1fr)_auto] items-baseline gap-x-3 py-3 border-b border-[#2C2A26]/15"
              >
                <span className="font-mono text-[11px] tabular-nums text-[#2C2A26]/70">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="font-display italic text-xl lg:text-[26px] leading-snug">“{c.hoi}”</span>
                <span className="col-start-2 sm:col-start-auto font-sans text-xs text-[#2C2A26]/70 mt-1 sm:mt-0 whitespace-nowrap">
                  {c.chuDe}
                </span>
              </li>
            ))}
          </ol>

          <p className="vd-hoi font-sans text-[15px] leading-relaxed mt-6 mb-0 max-w-[60ch] [text-wrap:pretty]">
            Mặc Việt trả lời những câu như thế bằng luật văn hoá, mỗi luật ghi rõ nguồn và mức chắc chắn.
          </p>
        </div>

        {/* Chân dung tư liệu, hiển thị không lớn hơn kích thước gốc 420 x 600 */}
        <figure className="vd-anh lg:col-span-5 xl:col-span-4 xl:col-start-9 m-0 justify-self-center lg:justify-self-end w-full max-w-[340px] lg:max-w-[min(100%,380px)]">
          <div className="to-tu-lieu anh-tu-lieu" style={{ transform: 'rotate(-1.5deg)' }}>
            <img
              src="/anh/tl-van-toc.jpg"
              alt="Thiếu nữ Bắc Kỳ mặc áo ngũ thân sẫm màu, đội nón rộng vành có quai, đứng cạnh chiếc bàn nhỏ, ảnh thế kỷ 19"
              width={420}
              height={600}
              className="block w-full h-auto"
              style={{ aspectRatio: '420 / 600' }}
            />
            <figcaption className="pt-3 pb-1 flex flex-col gap-0.5">
              <span className="font-display text-[15px] leading-snug text-[#2C2A26]">Thiếu nữ Bắc Kỳ, thế kỷ 19</span>
              <span className="font-mono text-[10px] leading-snug text-[#2C2A26]/75">
                Tư liệu lịch sử, Wikimedia Commons · Phạm vi công cộng
              </span>
            </figcaption>
          </div>
        </figure>
      </div>
    </section>
  );
}
