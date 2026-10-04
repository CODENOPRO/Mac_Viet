import { useStore, store } from '../../lib/store';
import Step1BoiCanh from './Step1BoiCanh';
import Step2ChonAnh from './Step2ChonAnh';
import Step3PhoiDo from './Step3PhoiDo';
import Step3LookCard from './Step3LookCard';
import { StudioStep, formatStudioStepLabel } from '../../types';

export default function StudioWorkflow() {
  const { studioStep } = useStore();

  const steps: { id: StudioStep; label: string; sub: string }[] = [
    { id: 1, label: 'BOI CANH', sub: 'Chọn nghi lễ, không gian' },
    { id: 2, label: 'ANH CUA BAN', sub: 'Tải ảnh chân dung' },
    { id: 3, label: 'XUONG PHOI', sub: 'Chọn 6 lớp & mặc thử' },
    { id: 4, label: 'LOOK CARD', sub: 'Kiểm tra luật & lưu look' },
  ];

  const handleStepClick = (stepId: StudioStep) => {
    // Chỉ cho phép bấm quay lại bước đã qua hoặc bước hiện tại
    if (stepId <= studioStep) {
      store.setStudioStep(stepId);
    }
  };

  return (
    <div className="w-full flex flex-col">
      {/* Thanh tiến trình mảnh ở trên cao */}
      <div className="w-full bg-[#F2EDE3] border-b border-[#2C2A26]/15 px-6 py-3 select-none">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          {steps.map((s, idx) => {
            const isCurrent = studioStep === s.id;
            const isPassed = studioStep > s.id;
            const isFuture = studioStep < s.id;

            return (
              <div key={s.id} className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleStepClick(s.id)}
                  disabled={isFuture}
                  className={`flex items-center gap-2.5 text-left transition-all max-md:min-h-11 ${
                    isFuture
                      ? 'opacity-35 cursor-not-allowed'
                      : 'cursor-pointer hover:opacity-100'
                  }`}
                >
                  <span
                    className={`w-6 h-6 flex items-center justify-center font-mono text-xs border ${
                      isCurrent
                        ? 'border-[#A8322A] bg-[#A8322A] text-[#F2EDE3] font-bold'
                        : isPassed
                        ? 'border-[#2C2A26] bg-[#2C2A26] text-[#F2EDE3]'
                        : 'border-[#2C2A26]/30 text-[#2C2A26]/40'
                    }`}
                  >
                    0{s.id}
                  </span>
                  <div>
                    <span
                      className={`micro-label block ${
                        isCurrent ? 'text-[#A8322A] font-bold' : 'text-[#2C2A26]'
                      }`}
                    >
                      {s.label}
                    </span>
                    <span className="text-[11px] font-sans text-[#6E5439] hidden sm:block">
                      {s.sub}
                    </span>
                  </div>
                </button>

                {/* Dấu phân cách giữa các bước */}
                {idx < steps.length - 1 && (
                  <div className="w-8 md:w-16 h-[1px] bg-[#2C2A26]/18 mx-1 md:mx-2" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Nội dung các bước */}
      <div className="w-full max-w-6xl mx-auto p-4 md:p-8 lg:p-10 select-none">
        {studioStep === 1 && <Step1BoiCanh />}
        {studioStep === 2 && <Step2ChonAnh />}
        {studioStep === 3 && <Step3PhoiDo />}

        {/* BƯỚC 4: MÀN KẾT QUẢ LOOK CARD */}
        {studioStep === 4 && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#2C2A26]/12">
              <div>
                <span className="micro-label text-[#A8322A]">
                  {formatStudioStepLabel(4, 'LOOK CARD')}
                </span>
                <span className="font-mono text-xs text-[#6E5439] ml-3">
                  THẺ TỔNG HỢP LOOK CARD
                </span>
              </div>
              <button
                type="button"
                onClick={() => store.setStudioStep(3)}
                className="px-4 py-1.5 border border-[#2C2A26]/20 font-mono text-xs text-[#2C2A26] hover:bg-[#2C2A26] hover:text-[#F2EDE3] transition-colors cursor-pointer"
              >
                ← ĐỔI PHỐI ĐỒ (BƯỚC 3)
              </button>
            </div>

            <Step3LookCard />
          </div>
        )}
      </div>
    </div>
  );
}
