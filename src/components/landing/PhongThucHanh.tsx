import { store } from '../../lib/store';
import CultureGuardDemo from './CultureGuardDemo';

// Gian thứ năm: bàn thực hành. Lời cam kết bên trái, Culture Guard thật bên phải để khách tự phối.

const CACH_DOC = [
  { mau: '#A8322A', ten: 'Cần cân nhắc', moTa: 'Bộ đồ lệch rõ với dịp, hoặc với ý nghĩa của món đồ.' },
  { mau: '#9A7A1C', ten: 'Hơi lệch bối cảnh', moTa: 'Vẫn phối được, nhưng có chỗ nên xem lại.' },
  { mau: '#3F6B5A', ten: 'Chưa thấy điểm lệch', moTa: 'Không luật nào trong bộ luật phản hồi.' },
];

export default function PhongThucHanh() {
  return (
    <section
      id="phong-5"
      className="relative w-full min-h-[100svh] px-5 sm:px-10 lg:px-14 py-20 lg:py-16 bg-[#FBF8F2] text-[#2C2A26] border-b border-[#2C2A26]/12 flex items-center"
    >
      <div className="w-full max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-x-12 gap-y-10 items-start">
        {/* Lời cam kết */}
        <div className="room-text lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-16">
          <h2 className="font-display font-light text-[clamp(36px,9vw,48px)] sm:text-6xl lg:text-[clamp(52px,4.6vw,76px)] leading-[1.02] tracking-[-0.025em] m-0">
            Chúng tôi không phán ai <span className="italic text-[#A8322A] whitespace-nowrap">mặc sai.</span>
          </h2>
          <p className="font-display text-2xl lg:text-[28px] leading-snug text-[#2C2A26] m-0">
            Có nguồn. Có mức độ. Có lối sửa.
          </p>
          <p className="font-sans text-base leading-relaxed text-[#2C2A26]/75 m-0 max-w-[48ch]">
            Thử phối ngay ở bàn bên cạnh. Culture Guard đối chiếu bộ đồ với luật văn hoá, nói rõ vì sao, dẫn
            nguồn, và đưa lối sửa để bạn bấm thử. Đó chỉ là lời nhắc, quyết định vẫn là của bạn.
          </p>

          {/* Cách đọc lời nhắc: làm rõ "có mức độ" */}
          <dl className="m-0 mt-2 flex flex-col border-t border-[#2C2A26]/12">
            {CACH_DOC.map((m) => (
              <div key={m.ten} className="grid grid-cols-[4px_minmax(0,1fr)] gap-x-4 py-3 border-b border-[#2C2A26]/12">
                <span aria-hidden="true" className="row-span-2 w-1 h-full" style={{ backgroundColor: m.mau }} />
                <dt className="font-display text-lg leading-tight" style={{ color: m.mau }}>{m.ten}</dt>
                <dd className="m-0 font-sans text-sm text-[#2C2A26]/75 leading-snug">{m.moTa}</dd>
              </div>
            ))}
          </dl>
          <p className="font-sans text-sm leading-relaxed text-[#2C2A26]/75 m-0 max-w-[48ch]">
            Mỗi luật còn ghi mức chắc chắn: đã xác lập, thực hành hiện nay, hay đang tranh luận, để bạn biết
            lời nhắc ấy nặng tới đâu.
          </p>
        </div>

        {/* Bàn thực hành */}
        <div className="room-visual lg:col-span-7">
          <CultureGuardDemo onExploreRules={() => store.setScreen('culture_rules')} />
        </div>
      </div>
    </section>
  );
}
