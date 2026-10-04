import React, { useEffect } from 'react';
import { Source } from '../../types';

interface SourceDetailModalProps {
  source: Source | null;
  onClose: () => void;
}

export default function SourceDetailModal({ source, onClose }: SourceDetailModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (source) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [source, onClose]);

  if (!source) return null;

  const getSourceTypeName = (loai: Source['loai']) => {
    switch (loai) {
      case 'sach':
        return 'Sách nghiên cứu / Khảo luận';
      case 'tu_lieu':
        return 'Tư liệu lịch sử / Điển chế';
      case 'bao_tang':
        return 'Bảo tàng / Hiện vật phục dựng';
      case 'cong_dong':
        return 'Thực hành cộng đồng / Điền dã';
      default:
        return 'Tư liệu văn hoá';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D1826]/80 backdrop-blur-xs select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#FBF8F2] border border-[#2C2A26] p-6 shadow-2xl corner-mark relative animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between pb-3 border-b border-[#2C2A26]/15 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-[10px] text-[#A8322A] uppercase tracking-wider font-semibold">
                {getSourceTypeName(source.loai)}
              </span>
            </div>
            <h3 className="font-display text-xl text-[#2C2A26] font-medium leading-snug">
              {source.ten}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center border border-[#2C2A26]/20 hover:border-[#A8322A] hover:text-[#A8322A] font-mono text-sm transition-colors cursor-pointer shrink-0 ml-3"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-3.5 text-xs font-sans text-[#2C2A26]">
          <div className="grid grid-cols-2 gap-3 p-3 bg-[#F2EDE3] border border-[#2C2A26]/10">
            <div>
              <span className="font-mono text-[10px] text-[#6E5439] uppercase tracking-wider block mb-0.5">
                TÁC GIẢ / CƠ QUAN
              </span>
              <span className="font-medium text-[#2C2A26] text-xs">
                {source.tacGia}
              </span>
            </div>
            <div>
              <span className="font-mono text-[10px] text-[#6E5439] uppercase tracking-wider block mb-0.5">
                NIÊN ĐẠI / NĂM
              </span>
              <span className="font-medium text-[#2C2A26] text-xs">
                {source.nam}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 pt-1">
            <span className="font-mono text-[10px] text-[#6E5439] uppercase tracking-wider">
              NỘI DUNG VÀ VAI TRÒ KHẢO CHỨNG
            </span>
            <p className="text-xs leading-relaxed text-[#2C2A26] bg-[#FBF8F2] p-3 border border-[#2C2A26]/12">
              {source.ghiChu}
            </p>
          </div>

          <div className="p-3 bg-[#16243A] text-[#F2EDE3] border border-[#C39A27]/40 flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase text-[#C39A27] tracking-wider font-bold">
              NGUYÊN TẮC VĂN HÓA MẶC VIỆT
            </span>
            <p className="text-[11px] leading-relaxed opacity-90">
              Mọi quy tắc văn hoá trong hệ thống đều được bảo chứng từ các nguồn khảo chứng xác thực. Mặc Việt kiên định không tự suy diễn lịch sử.
            </p>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-[#2C2A26]/15 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-[#2C2A26] hover:bg-[#16243A] text-[#F2EDE3] font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            ĐÓNG TƯ LIỆU
          </button>
        </div>
      </div>
    </div>
  );
}
