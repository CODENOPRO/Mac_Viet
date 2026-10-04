import { useState, useRef, useEffect } from 'react';
import { useStore, store } from '../../lib/store';
import CompareLooksModal, { LookToCompare } from './CompareLooksModal';
import { EVENTS } from '../../data/events';
import { SAMPLE_LOOKS } from '../../data/sampleLooks';
import { layTenMau } from '../../data/palettes';
import { LookCardData } from '../../types';

export default function LookbookScreen() {
  const { lookbook, selectedEvent } = useStore();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const deleteTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (deleteTimeoutRef.current) {
        clearTimeout(deleteTimeoutRef.current);
      }
    };
  }, []);

  const toggleSelectLook = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 3) {
        // Tối đa chọn 3 bộ
        return [...prev.slice(1), id];
      }
      return [...prev, id];
    });
  };

  const handleDeleteLook = (id: string) => {
    if (confirmDeleteId === id) {
      if (deleteTimeoutRef.current) {
        clearTimeout(deleteTimeoutRef.current);
        deleteTimeoutRef.current = null;
      }
      setConfirmDeleteId(null);
      store.deleteFromLookbook(id);
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    } else {
      if (deleteTimeoutRef.current) {
        clearTimeout(deleteTimeoutRef.current);
      }
      setConfirmDeleteId(id);
      deleteTimeoutRef.current = setTimeout(() => {
        setConfirmDeleteId(null);
        deleteTimeoutRef.current = null;
      }, 3000);
    }
  };

  const handleCopySample = (sample: LookCardData) => {
    store.copySampleToLookbook(sample);
  };

  const allAvailableLooks = [...lookbook, ...SAMPLE_LOOKS];

  const selectedLooksToCompare: LookToCompare[] = allAvailableLooks
    .filter((item) => selectedIds.includes(item.id))
    .map((item) => ({
      id: item.id,
      ten: item.ten,
      lookState: item.look,
      ghiChu: item.ghiChu,
    }));

  return (
    <div className="w-full max-w-5xl mx-auto p-6 md:p-10 select-none flex flex-col gap-12">
      {/* HEADER LOOKBOOK */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 hairline-b gap-4">
        <div>
          <span className="micro-label text-[#A8322A]">LOOKBOOK VIỆT PHỤC</span>
          <h2 className="font-display text-3xl text-[#2C2A26] font-normal mt-1">
            Bộ Sưu Tập Trang Phục
          </h2>
          <p className="text-xs font-sans text-[#6E5439] mt-0.5">
            Lưu giữ phương án phối cá nhân và đối chiếu với các bản mẫu chuẩn mực lịch sử.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {selectedIds.length >= 2 && (
            <button
              type="button"
              onClick={() => setCompareModalOpen(true)}
              className="px-4 py-2 bg-[#A8322A] text-[#F2EDE3] text-xs font-mono uppercase tracking-wider hover:bg-[#A8322A]/90 transition-colors cursor-pointer rounded-[1px] flex items-center gap-2 animate-in fade-in"
            >
              <span>SO SÁNH ({selectedIds.length}) BỘ</span>
              <span className="text-[10px] opacity-80">→</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => store.setScreen('studio')}
            className="px-4 py-2 border border-[#2C2A26]/30 text-[#2C2A26] text-xs font-mono uppercase tracking-wider hover:bg-[#2C2A26] hover:text-[#F2EDE3] transition-colors cursor-pointer"
          >
            + PHỐI BỘ MỚI
          </button>
        </div>
      </div>

      {/* =======================================================================
          KHỐI 1: BỘ SƯU TẬP CỦA BẠN (CHỈ CHỨA LOOK DO NGƯỜI DÙNG TỰ LƯU)
          ======================================================================= */}
      <section className="flex flex-col gap-6">
        <div className="flex items-baseline justify-between pb-2 border-b border-[#2C2A26]/15">
          <div className="flex items-center gap-3">
            <span className="micro-label text-[#A8322A]">MỤC 01</span>
            <h3 className="font-display text-xl text-[#2C2A26] font-normal">
              BỘ SƯU TẬP CỦA BẠN
            </h3>
            <span className="px-2 py-0.5 bg-[#A8322A]/10 text-[#A8322A] font-mono text-xs font-bold border border-[#A8322A]/20">
              {lookbook.length} BỘ ĐÃ LƯU
            </span>
          </div>
          <span className="text-xs font-sans text-[#6E5439] hidden sm:inline">
            Các bộ trang phục do bạn tự tay phối và lưu lại trong phiên làm việc.
          </span>
        </div>

        {lookbook.length === 0 ? (
          <div className="p-8 border border-dashed border-[#2C2A26]/20 bg-[#FBF8F2] flex flex-col items-center justify-center text-center gap-3">
            <p className="font-display text-lg text-[#2C2A26]">
              Bạn chưa lưu bộ nào.
            </p>
            <p className="text-xs font-sans text-[#6E5439] max-w-md">
              Hãy phối trang phục trong Xưởng phối hoặc chọn sao chép một bộ mẫu bên dưới để bắt đầu bộ sưu tập.
            </p>
            <button
              type="button"
              onClick={() => store.setScreen('studio')}
              className="mt-2 px-6 py-2.5 bg-[#A8322A] text-[#F2EDE3] font-mono text-xs uppercase tracking-wider hover:bg-[#A8322A]/90 transition-colors cursor-pointer"
            >
              VÀO XƯỞNG PHỐI
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {lookbook.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              const isConfirming = confirmDeleteId === item.id;
              return (
                <div
                  key={item.id}
                  className={`border p-6 flex flex-col justify-between transition-colors relative ${
                    isSelected
                      ? 'border-[#A8322A] bg-[#F2EDE3]'
                      : 'border-[#2C2A26]/18 bg-[#FBF8F2]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between pb-3 hairline-b">
                      {/* Checkbox chọn so sánh ở trên */}
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectLook(item.id)}
                          className="w-4 h-4 accent-[#A8322A] cursor-pointer"
                        />
                        <span className="font-mono text-xs text-[#2C2A26] font-medium">
                          {isSelected ? 'ĐÃ CHỌN ĐỂ SO SÁNH' : 'CHỌN SO SÁNH'}
                        </span>
                      </label>

                      {/* Ngày thật lúc lưu & Nút xoá có xác nhận 3 giây */}
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs text-[#6E5439]">
                          {item.ngayTao}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteLook(item.id)}
                          className={`font-mono text-[11px] px-2 py-0.5 rounded-[1px] transition-all cursor-pointer ${
                            isConfirming
                              ? 'bg-[#A8322A] text-[#F2EDE3] font-bold shadow-xs'
                              : 'text-[#A8322A] hover:underline'
                          }`}
                        >
                          {isConfirming ? 'XÁC NHẬN XÓA' : 'XÓA'}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-start justify-between gap-3 mt-3">
                      <h4 className="font-display text-2xl text-[#2C2A26] font-normal">
                        {item.ten}
                      </h4>
                      {item.look.thuongY && (
                        <span
                          className={`shrink-0 px-2 py-0.5 text-[10px] font-mono border rounded-[1px] uppercase tracking-wider ${
                            item.look.thuongY.doChacChan === 'da_xac_lap'
                              ? 'border-[#2D6A4F]/40 text-[#2D6A4F] bg-[#2D6A4F]/5'
                              : item.look.thuongY.doChacChan === 'dang_tranh_luan'
                              ? 'border-dashed border-[#A8322A]/60 text-[#A8322A] bg-[#A8322A]/5'
                              : 'border-[#C39A27]/50 text-[#6E5439] bg-[#C39A27]/5'
                          }`}
                        >
                          {item.look.thuongY.doChacChan === 'da_xac_lap'
                            ? 'ĐÃ XÁC LẬP'
                            : item.look.thuongY.doChacChan === 'dang_tranh_luan'
                            ? 'ĐANG TRANH LUẬN'
                            : 'THỰC HÀNH'}
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-sans text-[#6E5439] mt-1 italic">
                      {item.ghiChu}
                    </p>

                    {/* Các món đã chọn trong look */}
                    <div className="flex flex-col gap-1.5 pt-4 text-xs font-sans text-[#2C2A26]">
                      <div>
                        <strong className="font-mono text-[11px] text-[#6E5439]">
                          Thượng y:{' '}
                        </strong>
                        {item.look.thuongY?.ten || 'Chưa chọn'}
                      </div>
                      <div>
                        <strong className="font-mono text-[11px] text-[#6E5439]">
                          Hạ y:{' '}
                        </strong>
                        {item.look.haY?.ten || 'Chưa chọn'}
                      </div>
                      <div>
                        <strong className="font-mono text-[11px] text-[#6E5439]">
                          Thủ phục:{' '}
                        </strong>
                        {item.look.thuPhuc?.ten || 'Để trần'}
                      </div>
                      <div>
                        <strong className="font-mono text-[11px] text-[#6E5439]">
                          Màu chính:{' '}
                        </strong>
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-full mr-1.5 align-middle border border-[#2C2A26]/30"
                          style={{ backgroundColor: item.look.mauChinh || '#16243A' }}
                        />
                        {layTenMau(item.look.mauChinh)}
                      </div>
                    </div>
                  </div>

                  {/* Hàng dưới chỉ còn duy nhất nút Xem lại trong xưởng */}
                  <div className="pt-4 mt-4 border-t border-[#2C2A26]/10 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        store.setThuongY(item.look.thuongY || null);
                        store.setHaY(item.look.haY || null);
                        store.setThuPhuc(item.look.thuPhuc || null);
                        store.setStudioStep(3);
                        store.setScreen('studio');
                      }}
                      className="font-mono text-xs uppercase text-[#A8322A] hover:underline cursor-pointer"
                    >
                      XEM LẠI TRONG XƯỞNG →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* =======================================================================
          KHỐI 2: BA BỘ MẪU (DỮ LIỆU TĨNH CHỈ ĐỌC, KHÔNG LƯU LOCALSTORAGE, LUÔN HIỆN)
          ======================================================================= */}
      <section className="flex flex-col gap-6 pt-6 border-t border-[#2C2A26]/15">
        <div className="flex items-baseline justify-between pb-2 border-b border-[#2C2A26]/15">
          <div className="flex items-center gap-3">
            <span className="micro-label text-[#6E5439]">MỤC 02</span>
            <h3 className="font-display text-xl text-[#2C2A26] font-normal">
              BA BỘ MẪU
            </h3>
            <span className="px-2 py-0.5 bg-[#2C2A26]/10 text-[#2C2A26] font-mono text-xs font-semibold border border-[#2C2A26]/15">
              3 PHỐI BẢN CHUẨN MỰC
            </span>
          </div>
          <span className="text-xs font-sans text-[#6E5439] hidden sm:inline">
            Tư liệu tham chiếu cố định. Bấm "Sao chép" để đưa vào bộ sưu tập của bạn.
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SAMPLE_LOOKS.map((sample) => {
            const isSelected = selectedIds.includes(sample.id);
            return (
              <div
                key={sample.id}
                className={`border p-6 flex flex-col justify-between transition-colors relative ${
                  isSelected
                    ? 'border-[#A8322A] bg-[#F2EDE3]'
                    : 'border-[#2C2A26]/18 bg-[#FBF8F2]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between pb-3 hairline-b">
                    {/* Checkbox chọn so sánh ở trên */}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectLook(sample.id)}
                        className="w-4 h-4 accent-[#A8322A] cursor-pointer"
                      />
                      <span className="font-mono text-xs text-[#2C2A26] font-medium">
                        {isSelected ? 'ĐÃ CHỌN' : 'SO SÁNH'}
                      </span>
                    </label>

                    {/* Nhãn mono nhỏ MAU góc trên */}
                    <span className="font-mono text-[10px] tracking-wider px-1.5 py-0.5 border border-[#C39A27]/60 text-[#C39A27] bg-[#C39A27]/10 uppercase font-semibold">
                      MAU
                    </span>
                  </div>

                  {/* Bỏ hẳn dòng ngày ở thẻ mẫu */}
                  <div className="flex items-start justify-between gap-3 mt-3">
                    <h4 className="font-display text-xl text-[#2C2A26] font-normal leading-snug">
                      {sample.ten}
                    </h4>
                    {sample.look.thuongY && (
                      <span className="shrink-0 px-2 py-0.5 text-[10px] font-mono border border-[#2D6A4F]/40 text-[#2D6A4F] bg-[#2D6A4F]/5 rounded-[1px] uppercase tracking-wider">
                        ĐÃ XÁC LẬP
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-sans text-[#6E5439] mt-1.5 italic leading-relaxed">
                    {sample.ghiChu}
                  </p>

                  {/* Các món trong bộ mẫu */}
                  <div className="flex flex-col gap-1.5 pt-4 text-xs font-sans text-[#2C2A26]">
                    <div>
                      <strong className="font-mono text-[11px] text-[#6E5439]">
                        Thượng y:{' '}
                      </strong>
                      {sample.look.thuongY?.ten || 'Chưa chọn'}
                    </div>
                    <div>
                      <strong className="font-mono text-[11px] text-[#6E5439]">
                        Hạ y:{' '}
                      </strong>
                      {sample.look.haY?.ten || 'Chưa chọn'}
                    </div>
                    <div>
                      <strong className="font-mono text-[11px] text-[#6E5439]">
                        Thủ phục:{' '}
                      </strong>
                      {sample.look.thuPhuc?.ten || 'Để trần'}
                    </div>
                    <div>
                      <strong className="font-mono text-[11px] text-[#6E5439]">
                        Màu chính:{' '}
                      </strong>
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full mr-1.5 align-middle border border-[#2C2A26]/30"
                        style={{ backgroundColor: sample.look.mauChinh || '#16243A' }}
                      />
                      {layTenMau(sample.look.mauChinh)}
                    </div>
                  </div>
                </div>

                {/* Hàng dưới: Nút Sao chép vào bộ sưu tập và Xem lại trong xưởng */}
                <div className="pt-4 mt-5 border-t border-[#2C2A26]/10 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopySample(sample)}
                    className="w-full py-1.5 px-3 border border-[#A8322A]/40 text-[#A8322A] hover:bg-[#A8322A] hover:text-[#F2EDE3] font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer text-center"
                  >
                    SAO CHÉP VÀO BỘ SƯU TẬP
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      store.setThuongY(sample.look.thuongY || null);
                      store.setHaY(sample.look.haY || null);
                      store.setThuPhuc(sample.look.thuPhuc || null);
                      store.setStudioStep(3);
                      store.setScreen('studio');
                    }}
                    className="font-mono text-xs uppercase text-[#6E5439] hover:text-[#A8322A] text-right cursor-pointer pt-1"
                  >
                    XEM LẠI TRONG XƯỞNG →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* MODAL SO SÁNH KHI CHỌN 2 HOẶC 3 LOOK */}
      <CompareLooksModal
        isOpen={compareModalOpen}
        onClose={() => setCompareModalOpen(false)}
        initialLooks={selectedLooksToCompare}
        eventContext={
          EVENTS.find((e) => e.id === lookbook[0]?.eventContextId) || selectedEvent
        }
      />
    </div>
  );
}
