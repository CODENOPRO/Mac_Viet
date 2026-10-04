import { Source } from '../../types';
import { NGAY_KIEM_TRA_LIEN_KET } from '../../data/sources';

// Khối "Cách kiểm chứng" dùng chung cho mọi nơi hiện chi tiết nguồn.
// Nguồn nào cũng nói rõ người xem tự kiểm bằng cách nào; nguồn chưa công bố thì nói thẳng.

const NHAN_CACH: Record<Source['kiemChung']['cach'], string> = {
  mo_truc_tuyen: 'Mở trực tuyến',
  tra_cuu_sach: 'Tra cứu sách in',
  xem_hien_vat: 'Xem hiện vật',
  chua_cong_bo: 'Chưa công bố',
};

export function nhanCachKiemChung(source: Source) {
  return NHAN_CACH[source.kiemChung.cach];
}

export default function KhoiKiemChung({ source }: { source: Source }) {
  const { cach, lienKet, huongDan } = source.kiemChung;
  const chuaCongBo = cach === 'chua_cong_bo';

  return (
    <div
      className={`flex flex-col gap-2.5 p-3 border ${
        chuaCongBo ? 'border-[#C39A27] bg-[#C39A27]/10' : 'border-[#2C2A26]/12 bg-[#FBF8F2]'
      }`}
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <span className="font-mono text-[10px] text-[#6E5439] uppercase tracking-wider">Cách kiểm chứng</span>
        <span
          className={`font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 ${
            chuaCongBo ? 'bg-[#C39A27] text-[#2C2A26]' : 'bg-[#2C2A26] text-[#F2EDE3]'
          }`}
        >
          {NHAN_CACH[cach]}
        </span>
      </div>

      <p className="text-xs leading-relaxed text-[#2C2A26] m-0">{huongDan}</p>

      {lienKet.length > 0 && (
        <ul className="list-none m-0 p-0 flex flex-col gap-1.5">
          {lienKet.map((lk) => (
            <li key={lk.url} className="min-w-0">
              <a
                href={lk.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start justify-between gap-3 px-2.5 py-2 border border-[#2C2A26]/15 hover:border-[#A8322A] bg-[#F2EDE3]/60 text-[#2C2A26] no-underline transition-colors"
              >
                <span className="min-w-0">
                  <span className="block text-xs leading-snug group-hover:text-[#A8322A] transition-colors">{lk.nhan}</span>
                  <span className="block font-mono text-[10px] text-[#2C2A26]/70 mt-0.5 truncate">
                    {new URL(lk.url).hostname.replace(/^www\./, '')}
                  </span>
                </span>
                <span aria-hidden="true" className="font-mono text-xs text-[#A8322A] shrink-0">↗</span>
              </a>
            </li>
          ))}
        </ul>
      )}

      {lienKet.length > 0 && (
        <p className="font-mono text-[10px] text-[#2C2A26]/70 m-0">Liên kết đã mở thử ngày {NGAY_KIEM_TRA_LIEN_KET}.</p>
      )}
    </div>
  );
}
