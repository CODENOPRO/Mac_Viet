import { store } from '../../lib/store';
import { GARMENTS } from '../../data/garments';
import SourceTag from '../shared/SourceTag';

// Gian thứ ba: danh xưng. Bốn chiếc áo hay bị gọi gộp là "cổ phục".
// Mọi chữ về áo (tên, niên đại, vùng, mô tả, nên và tránh, nguồn) đọc từ garments.ts.
// Chỉ ảnh và dòng ghi công là cấu hình ở đây, lấy đúng theo bảng ảnh trong DESIGN.md.

const TEN_VUNG: Record<string, string> = {
  bac: 'Bắc Bộ',
  trung: 'Trung Bộ',
  nam: 'Nam Bộ',
  tay_bac: 'Tây Bắc',
  toan_quoc: 'Toàn quốc',
};

type AnhTrungBay =
  | { loai: 'hien_vat'; src: string; alt: string; viTri: string; ghiCong: string }
  | { loai: 'tu_lieu'; src: string; alt: string; rongGoc: number; caoGoc: number; chuThich: string; ghiCong: string };

const BON_AO: { id: string; anh: AnhTrungBay }[] = [
  {
    id: 'G03',
    anh: {
      loai: 'hien_vat',
      src: '/anh/tl-tu-than-bt.jpg',
      alt: 'Hiện vật áo tứ thân, yếm đào trên ma-nơ-canh tại Bảo tàng Dân tộc học Việt Nam',
      viTri: '50% 72%',
      ghiCong: 'Daderot, Bảo tàng Dân tộc học Việt Nam, CC0',
    },
  },
  {
    id: 'G04',
    anh: {
      loai: 'tu_lieu',
      src: '/anh/tl-hai-phong-1904.jpg',
      alt: 'Bưu thiếp hai phụ nữ mặc áo ngũ thân, Hải Phòng 1904',
      rongGoc: 360,
      caoGoc: 450,
      chuThich: 'Hai phụ nữ mặc áo ngũ thân',
      ghiCong: 'Pierre Dieulefils, Hải Phòng, 1904 · Phạm vi công cộng',
    },
  },
  {
    id: 'G09',
    anh: {
      loai: 'hien_vat',
      src: '/anh/tl-ba-ba-bt.jpg',
      alt: 'Hiện vật áo bà ba đen, khăn rằn trên ma-nơ-canh tại Bảo tàng Phụ nữ Việt Nam',
      viTri: '50% 30%',
      ghiCong: 'Daderot, Bảo tàng Phụ nữ Việt Nam, CC0',
    },
  },
  {
    id: 'G06',
    anh: {
      loai: 'tu_lieu',
      src: '/anh/tl-nhat-binh-nam-phuong.jpg',
      alt: 'Hoàng hậu Nam Phương mặc áo Nhật Bình, đội khăn vành dây, ảnh chụp trước năm 1945',
      rongGoc: 1000,
      caoGoc: 1500,
      chuThich: 'Hoàng hậu Nam Phương mặc áo Nhật Bình, khăn vành dây',
      ghiCong: 'Không rõ tác giả, trước 1945, qua Wikimedia Commons',
    },
  },
];

function KhungAnh({ anh }: { anh: AnhTrungBay }) {
  if (anh.loai === 'hien_vat') {
    return (
      <div className="anh-hien-vat w-full h-[360px] md:h-[420px] bg-[#E7DFC9]">
        <img src={anh.src} alt={anh.alt} className="w-full h-full object-cover" style={{ objectPosition: anh.viTri }} />
      </div>
    );
  }
  // Ảnh tư liệu: ghim như tờ tư liệu, không bao giờ lớn hơn kích thước gốc
  const caoHienThi = 330;
  const rongHienThi = Math.min(anh.rongGoc, Math.round((caoHienThi * anh.rongGoc) / anh.caoGoc));
  return (
    <div className="w-full h-[360px] md:h-[420px] bg-[#E7DFC9] flex items-center justify-center p-4">
      <figure className="to-tu-lieu anh-tu-lieu m-0" style={{ transform: 'rotate(-1.2deg)', width: rongHienThi + 20, maxWidth: '100%' }}>
        <img
          src={anh.src}
          alt={anh.alt}
          width={anh.rongGoc}
          height={anh.caoGoc}
          className="block w-full h-auto"
          style={{ aspectRatio: `${anh.rongGoc} / ${anh.caoGoc}` }}
        />
        <figcaption className="font-display text-[13px] leading-snug text-[#2C2A26] pt-2">{anh.chuThich}</figcaption>
      </figure>
    </div>
  );
}

export default function PhongDanhXung() {
  return (
    <section
      id="phong-3"
      className="museum-room relative w-full py-20 lg:py-24 px-5 sm:px-10 lg:px-14 bg-[#FBF8F2] text-[#2C2A26] border-b border-[#2C2A26]/12"
    >
      <div className="max-w-[1400px] mx-auto">
        <div className="room-text max-w-3xl mb-12 lg:mb-14">
          <h2 className="font-display font-light text-[clamp(34px,8.6vw,48px)] sm:text-5xl lg:text-6xl tracking-tight leading-[1.06] m-0">
            Đừng gọi chung là “cổ phục”.
          </h2>
          <p className="font-sans text-base sm:text-lg text-[#2C2A26]/75 mt-4 mb-0 leading-relaxed max-w-[60ch]">
            Mỗi chiếc áo có thời đại, vùng đất và dịp mặc riêng. Gọi đúng tên là bước đầu tiên để mặc đúng chỗ.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
          {BON_AO.map(({ id, anh }) => {
            const g = GARMENTS.find((x) => x.id === id);
            if (!g) return null;
            const vung = g.vung.map((v) => TEN_VUNG[v] ?? v).join(', ');
            return (
              <article key={id} className="room-visual bg-[#F2EDE3] border border-[#2C2A26]/15 flex flex-col">
                <KhungAnh anh={anh} />

                <div className="flex-1 flex flex-col p-6 md:p-8">
                  <p className="font-mono text-[11px] text-[#2C2A26]/75 m-0 leading-snug">
                    {vung} · {g.nienDai}
                  </p>
                  <h3 className="font-display text-3xl md:text-4xl font-normal leading-tight mt-2 mb-3">{g.ten}</h3>
                  <p className="font-sans text-[15px] text-[#2C2A26]/85 leading-relaxed m-0">{g.moTaNgan}</p>

                  <dl className="m-0 mt-5 grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-3 gap-y-1.5 font-sans text-sm leading-snug">
                    <dt className="text-[#3F6B5A] font-medium">Hợp với</dt>
                    <dd className="m-0 text-[#2C2A26]/85">{g.dungKhiNao.slice(0, 3).join(', ')}</dd>
                    <dt className="text-[#A8322A] font-medium">Tránh</dt>
                    <dd className="m-0 text-[#2C2A26]/85">{g.khongDungKhiNao.slice(0, 3).join(', ')}</dd>
                  </dl>

                  <div className="mt-auto pt-5">
                    <div className="border-t border-[#2C2A26]/12 pt-3 flex items-end justify-between gap-4">
                      <div className="flex flex-col gap-1 min-w-0">
                        <SourceTag sourceIds={g.sourceIds} className="self-start" />
                        <span className="font-mono text-[10px] text-[#2C2A26]/70 leading-snug">Ảnh: {anh.ghiCong}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => store.setScreen('studio')}
                        className="shrink-0 font-sans text-sm text-[#A8322A] hover:underline underline-offset-4 cursor-pointer"
                      >
                        Mở trong xưởng →
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
