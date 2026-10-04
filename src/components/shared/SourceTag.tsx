import { useState, useEffect } from 'react';
import { SOURCES } from '../../data/sources';
import { Source } from '../../types';
import KhoiKiemChung, { nhanCachKiemChung } from './KhoiKiemChung';

interface SourceTagProps {
  id?: string;
  ids?: string[];
  sourceIds?: string[];
  className?: string;
  showPrefix?: boolean;
}

export default function SourceTag({
  id,
  ids,
  sourceIds,
  className = '',
  showPrefix = true,
}: SourceTagProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Tập hợp danh sách ID nguồn
  const rawList = ids || sourceIds || (id ? [id] : []);
  const sourceList: Source[] = rawList
    .map((sId) => SOURCES.find((s) => s.id === sId.trim().toUpperCase()))
    .filter((s): s is Source => Boolean(s));

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (sourceList.length === 0) return null;

  // Xây dựng dòng chữ hiển thị theo quy tắc:
  // 1 nguồn: "Nguồn: Ngàn năm áo mũ"
  // 2 nguồn: "Nguồn: Ngàn năm áo mũ, Đại Nam thực lục"
  // 3 nguồn trở lên: "Nguồn: Ngàn năm áo mũ và 2 nguồn khác"
  let displayText = '';
  const prefix = showPrefix ? 'Nguồn: ' : '';

  if (sourceList.length === 1) {
    displayText = `${prefix}${sourceList[0].tenNgan || sourceList[0].ten}`;
  } else if (sourceList.length === 2) {
    displayText = `${prefix}${sourceList[0].tenNgan || sourceList[0].ten}, ${sourceList[1].tenNgan || sourceList[1].ten}`;
  } else {
    displayText = `${prefix}${sourceList[0].tenNgan || sourceList[0].ten} và ${sourceList.length - 1} nguồn khác`;
  }

  const getSourceTypeLabel = (loai?: Source['loai']) => {
    switch (loai) {
      case 'sach':
        return 'Sách nghiên cứu';
      case 'tu_lieu':
        return 'Tư liệu lịch sử / Điển lệ';
      case 'bao_tang':
        return 'Hiện vật bảo tàng';
      case 'cong_dong':
        return 'Tư liệu điền dã / Cộng đồng';
      default:
        return 'Tư liệu văn hoá';
    }
  };

  return (
    <>
      {/* Một dòng chữ nhỏ, liền mạch như câu văn, bấm được, KHÔNG dùng viên thuốc hay mã nội bộ */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`inline-block text-left font-sans text-xs text-[#6E5439] hover:text-[#A8322A] underline underline-offset-3 decoration-[#2C2A26]/25 hover:decoration-[#A8322A] transition-colors cursor-pointer select-none ${className}`}
        title="Bấm để xem danh mục nguồn và trích dẫn khảo chứng"
      >
        {displayText}
      </button>

      {/* MODAL TRÍCH DẪN ĐẦY ĐỦ NGUỒN TƯ LIỆU */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D1826]/80 backdrop-blur-xs select-none animate-in fade-in duration-150"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-xl max-h-[85vh] overflow-y-auto overflow-x-hidden bg-[#FBF8F2] border border-[#2C2A26] p-5 sm:p-6 shadow-2xl corner-mark relative animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header modal */}
            <div className="flex items-start justify-between pb-3.5 border-b border-[#2C2A26]/15 mb-4 sticky top-0 bg-[#FBF8F2] z-10">
              <div>
                <span className="micro-label text-[#A8322A] block mb-1">
                  NGUỒN KHẢO CHỨNG DI SẢN
                </span>
                <h3 className="font-display text-xl text-[#2C2A26] font-normal leading-snug">
                  {sourceList.length === 1
                    ? sourceList[0].ten
                    : `Danh mục ${sourceList.length} nguồn tham chiếu`}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center border border-[#2C2A26]/20 hover:border-[#A8322A] hover:text-[#A8322A] font-mono text-sm transition-colors cursor-pointer shrink-0 ml-3"
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>

            {/* Danh sách các nguồn */}
            <div className="flex flex-col gap-5">
              {sourceList.map((source, idx) => (
                <div
                  key={source.id || idx}
                  className="flex flex-col gap-3 p-4 bg-[#F2EDE3]/60 border border-[#2C2A26]/12 text-xs font-sans text-[#2C2A26]"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[10px] text-[#A8322A] uppercase tracking-wider font-semibold">
                      {getSourceTypeLabel(source.loai)}
                    </span>
                    <span className="text-[#2C2A26]/30">·</span>
                    <span className="font-mono text-[10px] text-[#6E5439] uppercase tracking-wider">
                      {nhanCachKiemChung(source)}
                    </span>
                  </div>

                  <h4 className="font-display text-base font-normal text-[#2C2A26]">
                    {source.ten}
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2.5 bg-[#FBF8F2] border border-[#2C2A26]/8">
                    <div>
                      <span className="font-mono text-[10px] text-[#6E5439] uppercase tracking-wider block mb-0.5">
                        TÁC GIẢ / CƠ QUAN
                      </span>
                      <span className="font-medium text-[#2C2A26]">
                        {source.tacGia}
                      </span>
                    </div>
                    <div>
                      <span className="font-mono text-[10px] text-[#6E5439] uppercase tracking-wider block mb-0.5">
                        NIÊN ĐẠI / NĂM
                      </span>
                      <span className="font-medium text-[#2C2A26]">
                        {source.nam}
                      </span>
                    </div>
                  </div>

                  {/* Ghi chú khảo chứng */}
                  <div className="flex flex-col gap-1">
                    <span className="font-mono text-[10px] text-[#6E5439] uppercase tracking-wider">
                      VAI TRÒ TRONG HỆ THỐNG DI SẢN
                    </span>
                    <p className="text-xs leading-relaxed text-[#2C2A26] bg-[#FBF8F2] p-2.5 border border-[#2C2A26]/8">
                      {source.ghiChu}
                    </p>
                  </div>

                  <KhoiKiemChung source={source} />
                </div>
              ))}
            </div>

            {/* Footer modal */}
            <div className="mt-5 pt-3.5 border-t border-[#2C2A26]/15 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-[#2C2A26] hover:bg-[#16243A] text-[#F2EDE3] font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                ĐÓNG
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export { SourceTag };
