import { useState, useRef, useLayoutEffect } from 'react';
import { gsap, ScrollTrigger } from '../../lib/gsap';
import { store } from '../../lib/store';
import { GARMENTS } from '../../data/garments';
import { REGIONS, ISLAND_TERRITORIES } from '../../data/regions';
import { SOURCES } from '../../data/sources';
import { SO_HIEN_VAT, SO_LUAT, SO_NGUON } from '../../data/constants';
import { RegionId, Garment } from '../../types';
import BanDoVietNam from '../shared/BanDoVietNam';
import CultureGuardDemo from './CultureGuardDemo';

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
    answer: 'Mọi thông tin trong Mặc Việt được tổng hợp và đối chiếu từ 12 nguồn tư liệu xác thực. Nòng cốt dựa trên sách khảo cứu Ngàn năm áo mũ (Trần Quang Đức), các bộ sử liệu chính thống như Đại Nam thực lục, Khâm định Đại Nam hội điển sự lệ, và hiện vật lưu trữ tại Bảo tàng Lịch sử Quốc gia, Bảo tàng Cổ vật Cung đình Huế.',
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

export default function Landing() {
  const containerRef = useRef<HTMLDivElement>(null);

  // State cho Phòng 4: Địa dư
  const [selectedRegionId, setSelectedRegionId] = useState<string>('R01');
  const [selectedIsland, setSelectedIsland] = useState<'HOANG_SA' | 'TRUONG_SA' | null>(null);

  // State xem chi tiết hiện vật
  const [selectedGarment, setSelectedGarment] = useState<Garment | null>(null);

  // State mở accordion Hỏi đáp ở Phòng 6
  const [openFaqId, setOpenFaqId] = useState<number | null>(null);

  const regionCodeMap: Record<string, RegionId> = {
    R01: 'bac',
    R02: 'trung',
    R03: 'nam',
    R04: 'tay_bac',
  };

  const targetRegion = regionCodeMap[selectedRegionId] || 'bac';
  const currentRegionData = REGIONS.find((r) => r.id === selectedRegionId) || REGIONS[0];
  const currentIslandData = selectedIsland ? ISLAND_TERRITORIES[selectedIsland] : null;

  // Lọc hiện vật theo vùng đang chọn
  const regionGarments = GARMENTS.filter(
    (g) => g.vung.includes(targetRegion) || g.vung.includes('toan_quoc')
  );

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
      className="w-full bg-[#FBF8F2] text-[#2C2A26] selection:bg-[#A8322A] selection:text-[#F2EDE3] relative"
    >
      {/* ========================================================================= */}
      {/* PHÒNG 1: TIỀN SẢNH BẢO TÀNG (Lời mở + Hiện vật áo tứ thân tráng lệ)         */}
      {/* ========================================================================= */}
      <section
        id="phong-1"
        className="museum-room relative w-full min-h-[100svh] flex flex-col md:flex-row items-stretch justify-between bg-[#FBF8F2] border-b border-[#2C2A26]/12 overflow-hidden"
      >
        {/* Nửa trái: Lời mở đầu sảnh trưng bày */}
        <div className="room-text w-full md:w-[46%] p-8 sm:p-12 md:p-16 lg:p-20 flex flex-col justify-between z-10">
          <div>
            <div className="flex items-center gap-2 mb-8">
              <span className="font-mono text-xs font-semibold tracking-widest text-[#A8322A] uppercase">
                MẶC VIỆT
              </span>
              <span className="text-[#2C2A26]/30">·</span>
              <span className="font-mono text-[11px] tracking-wider text-[#2C2A26]/60 uppercase">
                PHÒNG TRƯNG BÀY
              </span>
            </div>

            <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-light text-[#2C2A26] leading-[1.04] tracking-tight mb-6">
              Người Việt mặc lại áo của mình.
            </h1>

            <p className="font-sans text-base sm:text-lg text-[#2C2A26]/75 leading-relaxed max-w-lg mb-10">
              Ứng dụng khảo cứu và phối trang phục truyền thống Việt Nam theo điển chế, không gian và cá tính.
            </p>

            <div>
              <button
                type="button"
                onClick={() => store.setScreen('studio')}
                className="px-8 py-4 bg-[#A8322A] text-[#F2EDE3] hover:bg-[#8F2821] text-xs font-mono uppercase tracking-widest transition-all duration-200 corner-mark cursor-pointer shadow-sm active:scale-[0.98] inline-flex items-center gap-3"
              >
                <span>BƯỚC VÀO XƯỞNG PHỐI</span>
                <span>→</span>
              </button>
            </div>
          </div>

          {/* Dấu chỉ hướng chân sảnh */}
          <div className="pt-12 text-[#2C2A26]/40 font-mono text-[11px] tracking-wider flex items-center gap-2">
            <span>↓</span>
            <span>BƯỚC TIẾP QUA CÁC PHÒNG</span>
          </div>
        </div>

        {/* Nửa phải: Tấm ảnh đứng hiện vật thật rực rỡ cao trọn chiều cao */}
        <div className="room-visual relative w-full md:w-[54%] min-h-[50vh] md:min-h-full bg-[#F2EDE3] overflow-hidden flex items-center justify-center anh-hien-vat">
          <img
            src="/anh/tl-tu-than-bt.jpg"
            alt="Hiện vật áo tứ thân, yếm đào, khăn mỏ quạ trên ma-nơ-canh tại Bảo tàng Dân tộc học Việt Nam"
            className="w-full h-full object-cover"
            style={{ objectPosition: '50% 35%' }}
          />

          {/* Biển chú thích bảo tàng đặt trang trọng ở góc */}
          <div className="absolute bottom-6 right-6 md:bottom-8 md:right-8 bg-[#FBF8F2]/95 backdrop-blur-xs border border-[#2C2A26]/20 p-4 max-w-xs shadow-md corner-mark text-[#2C2A26]">
            <span className="font-mono text-[10px] text-[#A8322A] block uppercase tracking-wider mb-1">
              HIỆN VẬT G01 · TIÊU BIỂU
            </span>
            <span className="font-display text-base font-normal block leading-tight">
              Áo tứ thân &amp; Yếm đào
            </span>
            <span className="font-mono text-[10px] text-[#2C2A26]/70 block mt-2 border-t border-[#2C2A26]/15 pt-2">
              Daderot, Bảo tàng Dân tộc học Việt Nam, CC0
            </span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* PHÒNG 2: GIAN TRẦM TƯ (Vấn đề & Tờ tư liệu ghim tường Hải Phòng 1904)       */}
      {/* ========================================================================= */}
      <section
        id="phong-2"
        className="museum-room relative w-full min-h-[90svh] py-16 md:py-24 px-8 sm:px-12 md:px-16 lg:px-20 bg-[#F2EDE3] border-b border-[#2C2A26]/12 flex flex-col md:flex-row items-center justify-between gap-12"
      >
        <div className="room-text max-w-2xl flex flex-col gap-6">
          <span className="font-mono text-xs uppercase tracking-widest text-[#A8322A]">
            GIAN THỨ HAI · TRẦM TƯ
          </span>

          <h2 className="font-display text-3xl sm:text-5xl lg:text-6xl font-light text-[#2C2A26] tracking-tight leading-[1.12]">
            Ta không thiếu áo đẹp.
            <br />
            Ta thiếu người biết mặc nó.
          </h2>

          <p className="font-sans text-base sm:text-lg md:text-xl text-[#2C2A26]/75 leading-relaxed max-w-xl">
            Nhiều người trẻ khao khát khoác lên mình tà áo cha ông, nhưng ngập ngừng vì sợ sai điển chế và lúng túng khi gọi tên từng nếp áo.
          </p>

          <p className="font-sans text-sm sm:text-base text-[#2C2A26]/60 leading-relaxed max-w-lg">
            Một nếp áo không chỉ là tấm vải cắt may, mà chứa đựng tư thế đứng, cách đi, hoàn cảnh gặp gỡ và câu chuyện của từng thời đại.
          </p>
        </div>

        {/* Tờ tư liệu lịch sử ghim tường: đúng kích thước gốc 360 x 450, xoay nhẹ */}
        <div className="room-visual shrink-0 self-center md:self-end">
          <div
            className="to-tu-lieu anh-tu-lieu cursor-default shadow-md"
            style={{
              width: '380px',
              maxWidth: '100%',
              transform: 'rotate(-2deg)',
            }}
          >
            <div className="w-full overflow-hidden bg-[#E7DFC9]">
              <img
                src="/anh/tl-hai-phong-1904.jpg"
                alt="Bưu thiếp hai phụ nữ mặc áo ngũ thân, Hải Phòng 1904"
                width={360}
                height={450}
                className="w-[360px] max-w-full h-auto block"
                style={{
                  aspectRatio: '360 / 450',
                  objectFit: 'contain',
                }}
              />
            </div>
            <p className="font-mono text-[10px] text-[#2C2A26] pt-2.5 pb-0.5 leading-snug tracking-normal">
              Hải Phòng, 1904 · Pierre Dieulefils, 1904, Phạm vi công cộng
            </p>
          </div>
        </div>
      </section>

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
                  className="w-full h-full object-cover object-top hover:scale-[1.02] transition-transform duration-500"
                />
              </div>

              <div className="flex items-center justify-between gap-2 border-b border-[#2C2A26]/15 pb-2 mb-3">
                <span className="font-mono text-xs font-semibold text-[#A8322A] uppercase">
                  HIỆN VẬT G01
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
                  TƯ LIỆU G04
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
                  className="w-full h-full object-cover object-top hover:scale-[1.02] transition-transform duration-500"
                />
              </div>

              <div className="flex items-center justify-between gap-2 border-b border-[#2C2A26]/15 pb-2 mb-3">
                <span className="font-mono text-xs font-semibold text-[#A8322A] uppercase">
                  HIỆN VẬT G09
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
                  HIỆN VẬT G06
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

      {/* ========================================================================= */}
      {/* PHÒNG 4: GIAN ĐỊA DƯ (Phòng tối chàm duy nhất cho bản đồ và các miền)       */}
      {/* ========================================================================= */}
      <section
        id="phong-4"
        className="museum-room relative w-full py-16 md:py-24 px-8 sm:px-12 md:px-16 lg:px-20 bg-[#16243A] text-[#F2EDE3] border-b border-[#F2EDE3]/15 select-none"
      >
        <div className="room-text max-w-3xl mb-12">
          <span className="font-mono text-xs uppercase tracking-widest text-[#C39A27]">
            GIAN THỨ TƯ · ĐỊA DƯ &amp; VÙNG MIỀN
          </span>
          <h2 className="font-display text-3xl sm:text-5xl lg:text-6xl font-light text-[#F2EDE3] tracking-tight mt-2 leading-[1.08]">
            Đất non sông, nếp áo từng miền.
          </h2>
          <p className="font-sans text-base sm:text-lg text-[#F2EDE3]/75 mt-4 leading-relaxed">
            Từ xứ Bắc hào hoa, đất Thần Kinh mẫu mực đến phương Nam phóng khoáng. Bấm vào bản đồ để ngắm nhìn từng hiện vật trang phục gắn liền với địa dư xứ sở.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          {/* Cột trái: Bản đồ chuẩn xác từ Natural Earth */}
          <div className="room-visual w-full lg:w-[48%] flex items-center justify-center p-2 text-[#F2EDE3]">
            <BanDoVietNam
              vungDangChon={selectedIsland || selectedRegionId}
              onChonVung={(vung) => {
                if (vung === 'HOANG_SA' || vung === 'TRUONG_SA') {
                  setSelectedIsland(vung as 'HOANG_SA' | 'TRUONG_SA');
                } else {
                  setSelectedRegionId(vung);
                  setSelectedIsland(null);
                }
              }}
              kichThuoc="lon"
              hienNhanDao={true}
            />
          </div>

          {/* Cột phải: Thông tin vùng và danh sách nếp áo */}
          <div className="w-full lg:w-[48%] flex flex-col gap-6">
            {/* Bộ nút chọn nhanh */}
            <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-[#F2EDE3]/15">
              {REGIONS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    setSelectedRegionId(r.id);
                    setSelectedIsland(null);
                  }}
                  className={`px-3 py-1.5 font-mono text-xs uppercase tracking-wider border transition-colors cursor-pointer ${
                    !selectedIsland && selectedRegionId === r.id
                      ? 'border-[#C39A27] bg-[#C39A27]/20 text-[#C39A27] font-bold'
                      : 'border-[#F2EDE3]/20 bg-transparent text-[#F2EDE3]/70 hover:text-[#F2EDE3]'
                  }`}
                >
                  {r.ten.split(' ')[0]}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setSelectedIsland(selectedIsland === 'HOANG_SA' ? null : 'HOANG_SA')}
                className={`px-3 py-1.5 font-mono text-xs uppercase tracking-wider border transition-colors cursor-pointer ${
                  selectedIsland === 'HOANG_SA'
                    ? 'border-[#A8322A] bg-[#A8322A]/25 text-[#F2EDE3] font-bold'
                    : 'border-[#F2EDE3]/20 bg-transparent text-[#C39A27] hover:border-[#C39A27]'
                }`}
              >
                HOÀNG SA
              </button>

              <button
                type="button"
                onClick={() => setSelectedIsland(selectedIsland === 'TRUONG_SA' ? null : 'TRUONG_SA')}
                className={`px-3 py-1.5 font-mono text-xs uppercase tracking-wider border transition-colors cursor-pointer ${
                  selectedIsland === 'TRUONG_SA'
                    ? 'border-[#A8322A] bg-[#A8322A]/25 text-[#F2EDE3] font-bold'
                    : 'border-[#F2EDE3]/20 bg-transparent text-[#C39A27] hover:border-[#C39A27]'
                }`}
              >
                TRƯỜNG SA
              </button>
            </div>

            {/* Chi tiết vùng hoặc đảo */}
            {currentIslandData ? (
              <div className="border border-[#A8322A] bg-[#0D1826]/90 p-6 corner-mark flex flex-col gap-4 animate-in fade-in duration-200">
                <span className="font-mono text-xs text-[#A8322A] font-bold uppercase tracking-wider">
                  BIỂN ĐẢO QUÊ HƯƠNG · CHỦ QUYỀN TOÀN VẸN
                </span>
                <h3 className="font-display text-2xl md:text-3xl font-light text-[#F2EDE3]">
                  {currentIslandData.ten}
                </h3>
                <p className="font-mono text-xs text-[#C39A27]">
                  {currentIslandData.donViHanhChinh} · {currentIslandData.phanVungVanHoa}
                </p>
                <p className="font-sans text-sm text-[#F2EDE3]/85 leading-relaxed">
                  {currentIslandData.moTa}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="font-display text-2xl md:text-3xl font-light text-[#F2EDE3]">
                    {currentRegionData.ten}
                  </h3>
                  <p className="font-mono text-xs text-[#C39A27] mt-1">
                    {currentRegionData.khongGianVanHoa}
                  </p>
                  <p className="font-sans text-sm text-[#F2EDE3]/75 mt-2 leading-relaxed">
                    {currentRegionData.dacTrung}
                  </p>
                </div>

                {/* Danh sách hiện vật tiêu biểu của vùng */}
                <div className="border border-[#F2EDE3]/15 bg-[#0D1826]/60 p-4 corner-mark">
                  <span className="font-mono text-[11px] text-[#C39A27] uppercase tracking-wider block mb-3">
                    CÁC HIỆN VẬT TIÊU BIỂU ({regionGarments.length} MÓN)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {regionGarments.map((g) => (
                      <div
                        key={g.id}
                        onClick={() => setSelectedGarment(g)}
                        className="p-3 border border-[#F2EDE3]/10 bg-[#16243A]/80 hover:border-[#C39A27] transition-colors cursor-pointer corner-mark flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-[10px] text-[#C39A27]">{g.id}</span>
                          <span className="font-mono text-[9px] text-[#F2EDE3]/50">
                            Mức {g.mucTrangTrong}/5
                          </span>
                        </div>
                        <span className="font-display text-sm text-[#F2EDE3] font-medium">
                          {g.ten}
                        </span>
                        <span className="font-mono text-[10px] text-[#F2EDE3]/60 mt-1 line-clamp-1">
                          {g.nienDai}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* PHÒNG 5: PHÒNG THỰC HÀNH TƯƠNG TÁC (Culture Guard & Cam kết văn hóa)        */}
      {/* ========================================================================= */}
      <section
        id="phong-5"
        className="museum-room relative w-full py-16 md:py-24 px-8 sm:px-12 md:px-16 lg:px-20 bg-[#FBF8F2] border-b border-[#2C2A26]/12"
      >
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          {/* Lời cam kết văn hóa */}
          <div className="room-text w-full lg:w-[44%] flex flex-col gap-6">
            <span className="font-mono text-xs uppercase tracking-widest text-[#A8322A]">
              GIAN THỨ NĂM · BÀN THỰC HÀNH &amp; CAM KẾT
            </span>

            <h2 className="font-display text-3xl sm:text-5xl font-light text-[#2C2A26] tracking-tight leading-[1.08]">
              Chúng tôi không phán ai mặc sai.
            </h2>

            <p className="font-display text-xl sm:text-2xl text-[#2C2A26]/80 font-normal leading-relaxed">
              Có nguồn · Có mức độ · Có lối sửa.
            </p>

            <p className="font-sans text-sm sm:text-base text-[#2C2A26]/75 leading-relaxed">
              Khi bạn muốn thử nghiệm một bộ đồ mới, Culture Guard đối chiếu sự hài hòa văn hóa theo ba mức (Đỏ · Vàng · Xanh) và cung cấp nút sửa tức thì để trang phục vừa giữ trọn vẻ đẹp cổ điển, vừa văn minh và phù hợp đời sống.
            </p>

            {/* Dải thông số cam kết */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-6 border-t border-[#2C2A26]/15 font-mono text-xs text-[#A8322A] font-semibold tracking-wider uppercase">
              <span>{SO_HIEN_VAT} HIỆN VẬT TIÊU BIỂU</span>
              <span className="opacity-40 font-normal text-[#2C2A26]">·</span>
              <span>{SO_LUAT} QUY CHUẨN ĐIỂN CHẾ</span>
              <span className="opacity-40 font-normal text-[#2C2A26]">·</span>
              <span>{SO_NGUON} NGUỒN TƯ LIỆU ĐỐI CHIẾU</span>
            </div>
          </div>

          {/* Bàn thực hành tương tác Culture Guard */}
          <div className="room-visual w-full lg:w-[52%] flex justify-center">
            <CultureGuardDemo onExploreRules={() => store.setScreen('culture_rules')} />
          </div>
        </div>
      </section>

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
                    <span className="font-mono text-xs text-[#A8322A] font-semibold">
                      {selectedGarment.id}
                    </span>
                    <span className="font-mono text-xs text-[#2C2A26]/60">
                      {selectedGarment.vung.join(', ').toUpperCase()}
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
