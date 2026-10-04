import { useState, useRef, useLayoutEffect } from 'react';
import { gsap, ScrollTrigger } from '../../lib/gsap';
import { store } from '../../lib/store';
import { GARMENTS } from '../../data/garments';
import { SOURCES } from '../../data/sources';
import { Garment } from '../../types';
import HeroTienSanh from './HeroTienSanh';
import GianDiaDu from './GianDiaDu';
import PhongVanDe from './PhongVanDe';
import PhongThucHanh from './PhongThucHanh';

interface FAQItem {
  id: number;
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    id: 1,
    question: 'Mặc Việt phục hằng ngày có bị coi là lố không?',
    answer: 'Không hề, miễn là bạn chọn kiểu áo và chất liệu phù hợp với thời tiết và sinh hoạt. Áo ngũ thân tay chẽn hoặc áo bà ba chất liệu đũi, lụa nhẹ vốn sinh ra cho đời sống thường nhật của cha ông. Sự lúng túng thường chỉ đến khi người mặc chọn nhầm lễ phục cung đình cồng kềnh vào không gian phố xá bình thường.',
  },
  {
    id: 2,
    question: 'Áo dài và áo ngũ thân khác nhau thế nào?',
    answer: 'Áo ngũ thân là tiền thân trực tiếp của áo dài tân thời. Áo ngũ thân có kết cấu năm thân vải ghép lại với đường may thẳng thớm, cài khuy lệch và thân áo buông rộng rủ tự nhiên. Trong khi đó, áo dài tân thời từ thập niên 1930 trở đi đã được chiết eo ôm sát cơ thể, chỉ còn hai tà trước sau và chịu ảnh hưởng của phom dáng thời trang phương Tây.',
  },
  {
    id: 3,
    question: 'Tôi remix với giày thể thao có bị coi là thiếu tôn trọng không?',
    answer: 'Điều đó phụ thuộc hoàn toàn vào không gian bạn hiện diện. Khi đi dạo phố, chụp ảnh cá nhân hay tham gia sự kiện sáng tạo trẻ, việc phối cùng sneaker là một thử nghiệm đương đại thú vị và đáng khích lệ. Tuy nhiên trong không gian thờ tự, lễ gia tiên hay đám cưới truyền thống, đôi hài thêu hoặc guốc mộc cổ điển vẫn là lựa chọn đúng mực hơn cả.',
  },
  {
    id: 4,
    question: 'Dữ liệu của app lấy từ đâu?',
    answer: `Mặc Việt dựa trên ${SOURCES.length} nguồn. ${SOURCES.filter((s) => s.kiemChung.cach !== 'chua_cong_bo').length} nguồn là sách, sử liệu và hiện vật bảo tàng, mỗi nguồn kèm liên kết để bạn tự kiểm, nòng cốt là sách Ngàn năm áo mũ (Trần Quang Đức), Đại Nam thực lục, Khâm định Đại Nam hội điển sự lệ cùng hiện vật tại các bảo tàng. ${SOURCES.filter((s) => s.kiemChung.cach === 'chua_cong_bo').length} nguồn còn lại là quan sát thực hành hiện nay, chưa có bản công bố, và luật nào dựa vào chúng đều ghi rõ là chỉ mang tính gợi ý. Bấm vào dòng Nguồn ở bất kỳ đâu trong app để xem cách kiểm chứng.`,
  },
  {
    id: 5,
    question: 'App có lưu ảnh của tôi không?',
    answer: 'Ứng dụng hoàn toàn không lưu trữ hình ảnh hay thông tin riêng tư của bạn trên bất kỳ máy chủ nào. Mọi thao tác phối đồ, kiểm tra độ hài hòa văn hóa và lưu lookbook đều được xử lý trực tiếp ngay trên trình duyệt thiết bị của bạn. Dữ liệu của bạn thuộc về chính bạn.',
  },
  {
    id: 6,
    question: 'Tôi muốn góp ý sửa một thông tin thì làm thế nào?',
    answer: 'Chúng tôi luôn trân trọng mọi phản hồi mang tính xây dựng từ cộng đồng nghiên cứu và người thực hành cổ phục. Bạn có thể gửi tư liệu đối chiếu kèm mã nguồn tham khảo qua hòm thư đóng góp của dự án Mặc Việt. Ban biên tập sẽ kiểm tra chéo cùng các chuyên gia trước mỗi đợt cập nhật dữ liệu.',
  },
];


const TEN_VUNG: Record<string, string> = {
  bac: 'Bắc Bộ',
  trung: 'Trung Bộ',
  nam: 'Nam Bộ',
  tay_bac: 'Tây Bắc',
  toan_quoc: 'Toàn quốc',
};
export default function Landing() {
  const containerRef = useRef<HTMLDivElement>(null);

  // State xem chi tiết hiện vật
  const [selectedGarment, setSelectedGarment] = useState<Garment | null>(null);

  // State mở accordion Hỏi đáp ở Phòng 6
  const [openFaqId, setOpenFaqId] = useState<number | null>(null);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ctx = gsap.context(() => {
      if (prefersReducedMotion) return;

      const mm = gsap.matchMedia();

      // Hiệu ứng vào màn cho từng phòng trưng bày
      mm.add('(min-width: 320px)', () => {
        const rooms = el.querySelectorAll<HTMLElement>('.museum-room');
        rooms.forEach((room) => {
          const visualEl = room.querySelector('.room-visual');
          const textEl = room.querySelector('.room-text');

          if (textEl) {
            gsap.fromTo(
              textEl,
              { opacity: 0, y: 30 },
              {
                opacity: 1,
                y: 0,
                duration: 0.8,
                ease: 'power2.out',
                scrollTrigger: {
                  trigger: room,
                  start: 'top 75%',
                  toggleActions: 'play none none reverse',
                },
              }
            );
          }

          if (visualEl) {
            gsap.fromTo(
              visualEl,
              { opacity: 0, y: 35 },
              {
                opacity: 1,
                y: 0,
                duration: 0.9,
                delay: 0.15,
                ease: 'power2.out',
                scrollTrigger: {
                  trigger: room,
                  start: 'top 75%',
                  toggleActions: 'play none none reverse',
                },
              }
            );
          }
        });
      });
    }, el);

    // Refresh ScrollTrigger sau khi toàn bộ phông chữ và hình ảnh đã nạp
    const handleLoad = () => ScrollTrigger.refresh();
    window.addEventListener('load', handleLoad);
    requestAnimationFrame(() => ScrollTrigger.refresh());

    return () => {
      window.removeEventListener('load', handleLoad);
      ctx.revert();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      data-landing
      className="w-full bg-[#FBF8F2] text-[#2C2A26] selection:bg-[#A8322A] selection:text-[#F2EDE3] relative"
    >
      {/* PHÒNG 1: TIỀN SẢNH */}
      <HeroTienSanh />

      {/* PHÒNG 2: VẤN ĐỀ */}
      <PhongVanDe />

      {/* ========================================================================= */}
      {/* PHÒNG 3: BỐN GIAN DANH XƯNG (Tứ thân · Ngũ thân · Bà ba · Nhật Bình)        */}
      {/* ========================================================================= */}
      <section
        id="phong-3"
        className="museum-room relative w-full py-16 md:py-24 px-8 sm:px-12 md:px-16 lg:px-20 bg-[#FBF8F2] border-b border-[#2C2A26]/12"
      >
        <div className="room-text max-w-3xl mb-14">
          <span className="font-mono text-xs uppercase tracking-widest text-[#A8322A]">
            GIAN THỨ BA · DANH XƯNG VÀ HIỆN VẬT
          </span>
          <h2 className="font-display text-3xl sm:text-5xl lg:text-6xl font-light text-[#2C2A26] tracking-tight mt-2 leading-[1.08]">
            Đừng gọi chung là “cổ phục”.
          </h2>
          <p className="font-sans text-base sm:text-lg text-[#2C2A26]/75 mt-4 leading-relaxed">
            Mỗi chiếc áo mang một thời đại, một thân phận và một đời sống riêng biệt. Phân biệt đúng tên gọi là bước đầu tiên để tôn trọng trang phục của tổ tiên.
          </p>
        </div>

        {/* 4 gian trưng bày tác phẩm */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
          {/* Tác phẩm 1: Áo tứ thân (Ảnh lớn hiện vật thật) */}
          <div className="room-visual bg-[#F2EDE3] border border-[#2C2A26]/15 corner-mark p-6 md:p-8 flex flex-col justify-between shadow-xs">
            <div>
              <div className="w-full h-[360px] md:h-[420px] overflow-hidden bg-[#E7DFC9] mb-6 anh-hien-vat">
                <img
                  src="/anh/tl-tu-than-bt.jpg"
                  alt="Hiện vật áo tứ thân tại Bảo tàng Dân tộc học Việt Nam"
                  className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-500"
                  style={{ objectPosition: '50% 72%' }}
                />
              </div>

              <div className="flex items-center justify-between gap-2 border-b border-[#2C2A26]/15 pb-2 mb-3">
                <span className="font-mono text-xs font-semibold text-[#A8322A] uppercase">
                  HIỆN VẬT
                </span>
                <span className="font-mono text-xs text-[#2C2A26]/60">
                  THẾ KỶ 11 – 20 · BẮC BỘ
                </span>
              </div>

              <h3 className="font-display text-2xl md:text-3xl font-normal text-[#2C2A26] mb-3">
                Áo tứ thân
              </h3>

              <p className="font-sans text-sm text-[#2C2A26]/80 leading-relaxed mb-4">
                Bốn thân áo tượng trưng cho tứ thân phụ mẫu (cha mẹ mình và cha mẹ người phối ngẫu). Hai tà trước buông thả hoặc thắt nút duyên dáng, để lộ yếm đào e ấp bên trong.
              </p>
            </div>

            <div className="border-t border-[#2C2A26]/12 pt-3 flex items-center justify-between text-[#2C2A26]/70">
              <span className="font-mono text-[10px]">
                Daderot, Bảo tàng Dân tộc học Việt Nam, CC0
              </span>
              <button
                type="button"
                onClick={() => store.setScreen('studio')}
                className="font-mono text-xs text-[#A8322A] hover:underline cursor-pointer"
              >
                Mở trong xưởng →
              </button>
            </div>
          </div>

          {/* Tác phẩm 2: Áo ngũ thân (Tờ tư liệu ghim tường Hải Phòng 1904) */}
          <div className="room-visual bg-[#F2EDE3] border border-[#2C2A26]/15 corner-mark p-6 md:p-8 flex flex-col justify-between shadow-xs">
            <div>
              <div className="w-full h-[360px] md:h-[420px] overflow-hidden bg-[#E7DFC9] mb-6 flex items-center justify-center p-4">
                <div
                  className="to-tu-lieu anh-tu-lieu shadow-sm"
                  style={{ transform: 'rotate(1.5deg)' }}
                >
                  <img
                    src="/anh/tl-hai-phong-1904.jpg"
                    alt="Bưu thiếp hai phụ nữ mặc áo ngũ thân, Hải Phòng 1904"
                    width={280}
                    height={350}
                    className="w-[280px] max-w-full h-auto block"
                    style={{ aspectRatio: '360 / 450', objectFit: 'contain' }}
                  />
                  <p className="font-mono text-[9px] text-[#2C2A26] pt-1.5 pb-0.5">
                    Hải Phòng, 1904 · Pierre Dieulefils
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 border-b border-[#2C2A26]/15 pb-2 mb-3">
                <span className="font-mono text-xs font-semibold text-[#A8322A] uppercase">
                  TƯ LIỆU
                </span>
                <span className="font-mono text-xs text-[#2C2A26]/60">
                  TỪ 1744 · TOÀN QUỐC
                </span>
              </div>

              <h3 className="font-display text-2xl md:text-3xl font-normal text-[#2C2A26] mb-3">
                Áo ngũ thân
              </h3>

              <p className="font-sans text-sm text-[#2C2A26]/80 leading-relaxed mb-4">
                Được chúa Nguyễn Phúc Khoát định chế năm 1744 và vua Minh Mạng chuẩn hóa toàn quốc. Năm thân vải cài năm khuy lệch tượng trưng cho ngũ thường (Nhân, Lễ, Nghĩa, Trí, Tín) — cội nguồn trực tiếp của áo dài.
              </p>
            </div>

            <div className="border-t border-[#2C2A26]/12 pt-3 flex items-center justify-between text-[#2C2A26]/70">
              <span className="font-mono text-[10px]">
                Pierre Dieulefils, 1904, Phạm vi công cộng
              </span>
              <button
                type="button"
                onClick={() => store.setScreen('studio')}
                className="font-mono text-xs text-[#A8322A] hover:underline cursor-pointer"
              >
                Mở trong xưởng →
              </button>
            </div>
          </div>

          {/* Tác phẩm 3: Áo bà ba (Ảnh lớn hiện vật thật) */}
          <div className="room-visual bg-[#F2EDE3] border border-[#2C2A26]/15 corner-mark p-6 md:p-8 flex flex-col justify-between shadow-xs">
            <div>
              <div className="w-full h-[360px] md:h-[420px] overflow-hidden bg-[#E7DFC9] mb-6 anh-hien-vat">
                <img
                  src="/anh/tl-ba-ba-bt.jpg"
                  alt="Hiện vật áo bà ba đen, khăn rằn trên ma-nơ-canh tại Bảo tàng Phụ nữ Việt Nam"
                  className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-500"
                  style={{ objectPosition: '50% 42%' }}
                />
              </div>

              <div className="flex items-center justify-between gap-2 border-b border-[#2C2A26]/15 pb-2 mb-3">
                <span className="font-mono text-xs font-semibold text-[#A8322A] uppercase">
                  HIỆN VẬT
                </span>
                <span className="font-mono text-xs text-[#2C2A26]/60">
                  THẾ KỶ 19 – NAY · NAM BỘ
                </span>
              </div>

              <h3 className="font-display text-2xl md:text-3xl font-normal text-[#2C2A26] mb-3">
                Áo bà ba
              </h3>

              <p className="font-sans text-sm text-[#2C2A26]/80 leading-relaxed mb-4">
                Nếp áo cánh cổ tròn xẻ ngực, kết hợp cùng quần lụa đen và chiếc khăn rằn mộc mạc. Biểu tượng cho tính cách hào sảng, phóng khoáng và nhịp sống cần lao của đồng bào miền sông nước phương Nam.
              </p>
            </div>

            <div className="border-t border-[#2C2A26]/12 pt-3 flex items-center justify-between text-[#2C2A26]/70">
              <span className="font-mono text-[10px]">
                Daderot, Bảo tàng Phụ nữ Việt Nam, CC0
              </span>
              <button
                type="button"
                onClick={() => store.setScreen('studio')}
                className="font-mono text-xs text-[#A8322A] hover:underline cursor-pointer"
              >
                Mở trong xưởng →
              </button>
            </div>
          </div>

          {/* Tác phẩm 4: Áo Nhật Bình (Tấm biển trưng bày hiện vật hoàng gia sơn mài đỏ điều) */}
          <div className="room-visual bg-[#A8322A] text-[#F2EDE3] border border-[#A8322A] corner-mark p-6 md:p-8 flex flex-col justify-between shadow-md">
            <div>
              <div className="flex items-center justify-between gap-2 border-b border-[#F2EDE3]/25 pb-3 mb-6">
                <span className="font-mono text-xs tracking-widest text-[#F2EDE3]/90 uppercase font-semibold">
                  ĐIỂN CHẾ PHẨM PHỤC HOÀNG GIA
                </span>
                <span className="font-mono text-xs text-[#F2EDE3]/80">
                  HIỆN VẬT
                </span>
              </div>

              <div className="my-6">
                <h3
                  className="font-display font-light text-[#F2EDE3] tracking-tight leading-[0.98] mb-4"
                  style={{ fontSize: 'clamp(36px, 4.5vw, 64px)' }}
                >
                  Áo Nhật Bình
                </h3>

                <p className="font-mono text-xs sm:text-sm text-[#F2EDE3]/90 uppercase tracking-wider mb-6">
                  Triều Nguyễn (1802 – 1945) · Cung đình Huế
                </p>

                <p className="font-sans text-sm sm:text-base text-[#F2EDE3]/90 leading-relaxed font-light mb-4">
                  Phẩm phục cung đình cao quý cổ vuông xẻ giữa, viền cổ thêu dải ngũ sắc rực rỡ tượng trưng cho ngũ hành. Dành cho bậc hậu phi, công chúa và mệnh phụ triều Nguyễn, mang trọn tinh hoa điển chế chốn hoàng cung.
                </p>

                <div className="p-3.5 bg-[#8F2821] border border-[#F2EDE3]/20 text-xs font-sans text-[#F2EDE3]/90 leading-relaxed">
                  <strong>Khuyến nghị văn hoá:</strong> Không nên dùng trong đời thường (như dạo phố, uống cà phê). Thích hợp nhất cho dịp cưới hỏi trang trọng, lễ gia tiên hoặc nghi thức cung đình.
                </div>
              </div>
            </div>

            <div className="border-t border-[#F2EDE3]/20 pt-3 flex items-center justify-between text-[#F2EDE3]/80">
              <span className="font-mono text-[10px]">
                Nguồn: Ngàn năm áo mũ (Trần Quang Đức)
              </span>
              <button
                type="button"
                onClick={() => store.setScreen('studio')}
                className="font-mono text-xs text-[#F2EDE3] hover:underline cursor-pointer"
              >
                Mở trong xưởng →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* PHÒNG 4: GIAN ĐỊA DƯ */}
      <GianDiaDu onChonHienVat={setSelectedGarment} />

      {/* ========================================================================= */}
      {/* PHÒNG 5: PHÒNG THỰC HÀNH TƯƠNG TÁC (Culture Guard & Cam kết văn hóa)        */}
      {/* ========================================================================= */}
      <PhongThucHanh />

      {/* ========================================================================= */}
      {/* PHÒNG 6: LỐI RA BẢO TÀNG (Hỏi đáp & Lời mời bước vào Xưởng phối)             */}
      {/* ========================================================================= */}
      <section
        id="phong-6"
        className="museum-room relative w-full py-16 md:py-24 px-8 sm:px-12 md:px-16 lg:px-20 bg-[#F2EDE3] flex flex-col justify-between"
      >
        <div className="max-w-4xl mx-auto w-full">
          <div className="room-text text-center mb-14">
            <span className="font-mono text-xs uppercase tracking-widest text-[#A8322A]">
              LỐI RA · ĐỐI THOẠI &amp; THỰC HÀNH
            </span>
            <h2 className="font-display text-3xl sm:text-5xl font-light text-[#2C2A26] tracking-tight mt-2">
              Những điều bạn hay băn khoăn.
            </h2>
          </div>

          {/* Accordion hỏi đáp 6 câu */}
          <div className="divide-y divide-[#2C2A26]/15 border-t border-b border-[#2C2A26]/15 mb-16">
            {FAQS.map((faq) => {
              const isOpen = openFaqId === faq.id;
              return (
                <div key={faq.id} className="py-5">
                  <button
                    type="button"
                    onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                    className="w-full text-left flex items-start justify-between gap-4 cursor-pointer group"
                  >
                    <span className="font-display text-lg sm:text-xl font-normal text-[#2C2A26] group-hover:text-[#A8322A] transition-colors">
                      {faq.question}
                    </span>
                    <span className="font-mono text-base text-[#2C2A26]/60 group-hover:text-[#A8322A] shrink-0">
                      {isOpen ? '−' : '+'}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="mt-3 pr-8 font-sans text-sm sm:text-base text-[#2C2A26]/75 leading-relaxed animate-in fade-in duration-200">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Lối ra trang trọng: Nút duy nhất mở Xưởng phối */}
          <div className="text-center bg-[#FBF8F2] border border-[#2C2A26]/15 p-8 sm:p-12 corner-mark shadow-xs max-w-2xl mx-auto">
            <h3 className="font-display text-2xl sm:text-3xl font-light text-[#2C2A26] mb-3">
              Bạn đã sẵn sàng khoác lên tà áo của mình?
            </h3>
            <p className="font-sans text-sm sm:text-base text-[#2C2A26]/75 max-w-md mx-auto mb-8 leading-relaxed">
              Mời bạn bước sang Xưởng phối — không gian sáng tạo nơi bạn tự do phối đồ, kiểm tra hài hoà văn hoá và lưu giữ lookbook cá nhân.
            </p>

            <button
              type="button"
              onClick={() => store.setScreen('studio')}
              className="px-10 py-4 bg-[#A8322A] text-[#F2EDE3] hover:bg-[#8F2821] text-xs font-mono uppercase tracking-widest transition-all duration-200 corner-mark cursor-pointer shadow-md active:scale-[0.98] inline-flex items-center gap-3"
            >
              <span>BẮT ĐẦU PHỐI ĐỒ TẠI XƯỞNG</span>
              <span>→</span>
            </button>
          </div>
        </div>

        {/* Chân trang bảo tàng */}
        <footer className="mt-16 pt-8 border-t border-[#2C2A26]/15 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[#2C2A26]/60">
          <div>
            <span>MẶC VIỆT · PHÒNG TRƯNG BÀY VÀ THỰC HÀNH VIỆT PHỤC</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => store.setScreen('culture_rules')}
              className="hover:text-[#A8322A] cursor-pointer"
            >
              Quy tắc điển chế
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => store.setScreen('cu_nghe')}
              className="hover:text-[#A8322A] cursor-pointer"
            >
              Hỏi đáp Cụ Nghệ
            </button>
          </div>
        </footer>
      </section>

      {/* ========================================================================= */}
      {/* MODAL CHI TIẾT HIỆN VẬT KHI BẤM XEM TỪ GIAN ĐỊA DƯ                       */}
      {/* ========================================================================= */}
      {selectedGarment && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-[#0D1826]/80 backdrop-blur-xs flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-200"
        >
          <div className="bg-[#FBF8F2] border border-[#2C2A26] w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8 corner-mark flex flex-col justify-between gap-6 shadow-2xl text-[#2C2A26]">
            <div>
              <div className="flex items-start justify-between border-b border-[#2C2A26]/15 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-[#2C2A26]/60">
                      {selectedGarment.vung.map((v) => TEN_VUNG[v] ?? v).join(' · ')}
                    </span>
                  </div>
                  <h3 className="font-display text-2xl md:text-3xl text-[#2C2A26] mt-1 font-normal">
                    {selectedGarment.ten}
                  </h3>
                  {selectedGarment.tenKhac && selectedGarment.tenKhac.length > 0 && (
                    <span className="font-sans text-xs text-[#2C2A26]/70 block mt-0.5">
                      Tên gọi khác: {selectedGarment.tenKhac.join(', ')}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedGarment(null)}
                  className="font-mono text-xs text-[#2C2A26] hover:text-[#A8322A] px-2.5 py-1 border border-[#2C2A26]/20 cursor-pointer"
                >
                  ĐÓNG [ESC]
                </button>
              </div>

              <div className="py-4 space-y-4 font-sans text-sm text-[#2C2A26]/85 leading-relaxed">
                <div>
                  <strong className="font-mono text-[11px] text-[#A8322A] block uppercase mb-1">
                    Niên đại &amp; Bối cảnh
                  </strong>
                  <p>{selectedGarment.nienDai}</p>
                </div>

                <div>
                  <strong className="font-mono text-[11px] text-[#A8322A] block uppercase mb-1">
                    Mô tả cấu trúc
                  </strong>
                  <p>{selectedGarment.moTaNgan}</p>
                </div>

                <div>
                  <strong className="font-mono text-[11px] text-[#A8322A] block uppercase mb-1">
                    Độ trang trọng
                  </strong>
                  <p>Mức {selectedGarment.mucTrangTrong}/5 theo quy chuẩn điển chế.</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#2C2A26]/15 flex items-center justify-between">
              <span className="font-mono text-[10px] text-[#2C2A26]/60">
                Mặc Việt · Dữ liệu bảo tàng
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedGarment(null);
                  store.setScreen('studio');
                }}
                className="px-4 py-2 bg-[#A8322A] text-[#F2EDE3] text-xs font-mono uppercase tracking-wider corner-mark cursor-pointer"
              >
                Mặc thử trong xưởng →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
