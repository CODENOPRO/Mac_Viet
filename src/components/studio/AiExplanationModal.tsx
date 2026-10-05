import React, { useEffect } from 'react';

interface AiExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AiExplanationModal({ isOpen, onClose }: AiExplanationModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D1826]/80 backdrop-blur-xs animate-in fade-in duration-150 select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#FBF8F2] border border-[#2C2A26] p-6 shadow-2xl corner-mark relative animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#2C2A26]/15 mb-4">
          <div>
            <span className="micro-label text-[#A8322A] block mb-1">
              RANH GIỚI VĂN HOÁ & ĐỐI SOÁT
            </span>
            <h3 className="font-display text-xl text-[#2C2A26] font-medium">
              Vì sao chi tiết trong ảnh AI có thể chưa đúng?
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center border border-[#2C2A26]/20 hover:border-[#A8322A] hover:text-[#A8322A] font-mono text-sm transition-colors cursor-pointer"
            aria-label="Đóng modal"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-3.5 text-xs font-sans text-[#2C2A26] leading-relaxed max-h-[65vh] overflow-y-auto pr-1">
          <p className="text-[#6E5439]">
            Mặc Việt dùng mô hình AI tạo sinh để giúp bạn dễ dàng hình dung tổng thể phom dáng khi mặc trang phục truyền thống lên người. Tuy nhiên, AI tạo ảnh bằng xác suất điểm ảnh, không có tri thức vật lý về kỹ thuật may mặc cổ truyền.
          </p>

          <div className="p-3 bg-[#F2EDE3] border border-[#2C2A26]/12 flex flex-col gap-2">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-[10px] text-[#A8322A] font-bold">01</span>
              <span className="font-display font-medium text-xs text-[#2C2A26]">
                Cổ áo & vạt may
              </span>
            </div>
            <p className="text-[11px] text-[#6E5439]">
              Cổ đứng ngũ thân, cổ chéo giao lĩnh hay cổ vuông nhật bình đòi hỏi đường may ôm sát và góc cắt chuẩn mực. AI thường dễ vẽ lệch độ cao cổ hoặc lai tạp dáng áo của các quốc gia khác.
            </p>
          </div>

          <div className="p-3 bg-[#F2EDE3] border border-[#2C2A26]/12 flex flex-col gap-2">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-[10px] text-[#A8322A] font-bold">02</span>
              <span className="font-display font-medium text-xs text-[#2C2A26]">
                Số lượng khuy cúc
              </span>
            </div>
            <p className="text-[11px] text-[#6E5439]">
              Áo ngũ thân truyền thống bắt buộc phải có đúng năm hạt cúc (tượng trưng cho Ngũ thường: Nhân, Lễ, Nghĩa, Trí, Tín). AI thường vẽ thiếu hoặc thừa cúc ngẫu nhiên.
            </p>
          </div>

          <div className="p-3 bg-[#F2EDE3] border border-[#2C2A26]/12 flex flex-col gap-2">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-[10px] text-[#A8322A] font-bold">03</span>
              <span className="font-display font-medium text-xs text-[#2C2A26]">
                Hoa văn cổ truyền
              </span>
            </div>
            <p className="text-[11px] text-[#6E5439]">
              Các đồ án mây tản, hoa sen hay bát bửu thời Lê, thời Nguyễn có quy thức tạo hình nghiêm cẩn. AI thường tạo các họa tiết phỏng theo nhưng thiếu tính xác thực lịch sử.
            </p>
          </div>

          <div className="p-3 bg-[#16243A] text-[#F2EDE3] border border-[#C39A27]/50 flex flex-col gap-1.5">
            <span className="font-mono text-[10px] uppercase text-[#C39A27] tracking-wider font-bold">
              NGUYÊN TẮC ĐỐI SOÁT
            </span>
            <p className="text-[11px] leading-relaxed opacity-90">
              Khối <strong className="text-[#F2EDE3]">BẠN ĐÃ CHỌN</strong> bên cạnh chính là bản ghi thực thể đã được hệ thống luật văn hoá thẩm định. Khi may mặc hoặc phục dựng di sản, hãy luôn dùng bản ghi này làm căn cứ chính xác.
            </p>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-[#2C2A26]/15 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-[#A8322A] hover:bg-[#A8322A]/90 text-[#F2EDE3] font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            ĐÃ HIỂU, ĐỐI CHIẾU VỚI BẢN GHI
          </button>
        </div>
      </div>
    </div>
  );
}
