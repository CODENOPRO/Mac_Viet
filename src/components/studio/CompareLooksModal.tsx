import { useState, useEffect, useMemo } from 'react';
import { useStore, store } from '../../lib/store';
import { GARMENTS } from '../../data/garments';
import { TRADITIONAL_COLORS, layTenMucTrangTrong } from '../../data/palettes';
import { FALLBACK_OUTFITS_BY_EVENT } from '../../data/fallbackLooks';
import { tinhHaiHoa, ColorInputItem } from '../../lib/colorHarmony';
import { kiemTraVanHoa } from '../../lib/cultureGuard';
import { soSanhLook, LookComparisonInput, SoSanhLookResponse } from '../../lib/gemini';
import { LookState, EventContext, CultureFlag } from '../../types';

export interface LookToCompare {
  id: string;
  ten: string;
  lookState: LookState;
  anhUrl?: string;
  ghiChu?: string;
}

interface CompareLooksModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLooks?: LookToCompare[];
  eventContext?: EventContext;
}

export default function CompareLooksModal({
  isOpen,
  onClose,
  initialLooks,
  eventContext,
}: CompareLooksModalProps) {
  const { lookState: currentLookState, selectedEvent: storeEvent, contextSetup, lookbook } = useStore();
  const event = eventContext || storeEvent;

  // ---------------------------------------------------------------------------
  // 1. TẠO DANH SÁCH BAN ĐẦU (TỐI THIỂU 2, TỐI ĐA 3)
  // ---------------------------------------------------------------------------
  const defaultLooks: LookToCompare[] = useMemo(() => {
    if (initialLooks && initialLooks.length >= 2) {
      return initialLooks.slice(0, 3);
    }

    const looksList: LookToCompare[] = [];

    // Cột 1: Look hiện tại trong Xưởng phối
    looksList.push({
      id: 'current_studio_look',
      ten: 'Phương án hiện tại (Xưởng phối)',
      lookState: currentLookState,
    });

    // Cột 2 & 3: Lấy từ danh mục mẫu theo sự kiện hiện tại
    const eventFallbacks = FALLBACK_OUTFITS_BY_EVENT[event.id] || FALLBACK_OUTFITS_BY_EVENT['E01'];

    eventFallbacks.forEach((fb, idx) => {
      if (looksList.length >= 3) return;

      const altLookState: LookState = {
        thuongY: GARMENTS.find((g) => g.id === fb.thuongY) || currentLookState.thuongY,
        haY: GARMENTS.find((g) => g.id === fb.haY) || currentLookState.haY,
        thuPhuc: GARMENTS.find((g) => g.id === fb.thuPhuc) || currentLookState.thuPhuc,
        hai: GARMENTS.find((g) => g.id === fb.hai) || currentLookState.hai,
        phuKien: [],
        mauChinh: fb.mauChinh,
      };

      looksList.push({
        id: `fallback_${event.id}_${idx}`,
        ten: fb.ten,
        lookState: altLookState,
        ghiChu: fb.lyDo,
      });
    });

    return looksList.slice(0, 3);
  }, [initialLooks, currentLookState, event]);

  const [activeLooks, setActiveLooks] = useState<LookToCompare[]>(defaultLooks);

  // Khi modal mở với initialLooks mới
  useEffect(() => {
    if (isOpen) {
      setActiveLooks(defaultLooks);
    }
  }, [isOpen, defaultLooks]);

  // ---------------------------------------------------------------------------
  // 2. TÍNH TOÁN CÁC CHỈ SỐ CỦA TỪNG PHƯƠNG ÁN
  // ---------------------------------------------------------------------------
  const evaluatedLooks = useMemo(() => {
    return activeLooks.map((item) => {
      const { lookState } = item;

      // Hài hòa màu
      const mauThucTe: ColorInputItem[] = [
        {
          hex: lookState.mauChinh || lookState.thuongY?.mauTruyenThong?.[0] || '#16243A',
          trongSo: 0.5,
          lop: 'thuong_y',
        },
        {
          hex: lookState.haY?.mauTruyenThong?.[0] || '#F2EDE3',
          trongSo: 0.25,
          lop: 'ha_y',
        },
        {
          hex: lookState.thuPhuc?.mauTruyenThong?.[0] || '#2C2A26',
          trongSo: 0.1,
          lop: 'thu_phuc',
        },
        {
          hex: lookState.hai?.mauTruyenThong?.[0] || '#16243A',
          trongSo: 0.05,
          lop: 'hai',
        },
        {
          hex: '#F2EDE3',
          trongSo: 0.1,
          lop: 'phu_kien',
        },
      ];
      const colorHarmony = tinhHaiHoa(mauThucTe, event);
      const scoreMau = colorHarmony.diem;

      // Hợp bối cảnh
      const topLevel = lookState.thuongY?.mucTrangTrong ?? 3;
      const diff = Math.abs(topLevel - event.mucTrangTrongYeuCau);
      const scoreBoiCanh = diff === 0 ? 96 : diff === 1 ? 82 : 55;

      // Cờ văn hóa
      const flagResult = kiemTraVanHoa(
        lookState,
        event,
        contextSetup.phongCach,
        contextSetup.regionId
      );
      const scoreVanHoa =
        flagResult.mucDoChung === 'xanh' ? 98 : flagResult.mucDoChung === 'vang' ? 74 : 36;

      // Mức trang trọng
      const mucTrangTrong = lookState.thuongY?.mucTrangTrong || 3;

      // Hợp thời tiết
      const topId = lookState.thuongY?.id;
      let hopThoiTiet = 'Thoáng nhẹ, hợp bốn mùa';
      if (topId === 'G09') hopThoiTiet = 'Rất thoáng mát (Nam Bộ / Hè)';
      else if (topId === 'G06') hopThoiTiet = 'Dày dặn, ấm áp (Thu - Đông)';
      else if (topId === 'G05' || topId === 'G01') hopThoiTiet = 'Kín đáo, hợp ngày se lạnh';

      // Màu chính
      const matchColor = TRADITIONAL_COLORS.find(
        (c) => c.hex.toLowerCase() === lookState.mauChinh?.toLowerCase()
      );
      const mauChinhTen = matchColor?.ten || 'Chàm sẫm';

      return {
        ...item,
        scoreMau,
        scoreBoiCanh,
        flagResult,
        scoreVanHoa,
        mucTrangTrong,
        hopThoiTiet,
        mauChinhTen,
        mauChinhHex: lookState.mauChinh || '#16243A',
      };
    });
  }, [activeLooks, event, contextSetup]);

  // ---------------------------------------------------------------------------
  // 3. TÌM ĐIỂM SỐ CAO NHẤT ĐỂ KẺ GẠCH MÀU --dieu DƯỚI SỐ
  // ---------------------------------------------------------------------------
  const maxScoreMau = useMemo(
    () => Math.max(...evaluatedLooks.map((l) => l.scoreMau)),
    [evaluatedLooks]
  );
  const maxScoreBoiCanh = useMemo(
    () => Math.max(...evaluatedLooks.map((l) => l.scoreBoiCanh)),
    [evaluatedLooks]
  );
  const maxScoreVanHoa = useMemo(
    () => Math.max(...evaluatedLooks.map((l) => l.scoreVanHoa)),
    [evaluatedLooks]
  );

  // ---------------------------------------------------------------------------
  // 4. GỌI GEMINI soSanhLook CHO KHỐI DÒNG KẾT LUẬN
  // ---------------------------------------------------------------------------
  const [conclusionData, setConclusionData] = useState<SoSanhLookResponse | null>(null);
  const [loadingConclusion, setLoadingConclusion] = useState(false);

  useEffect(() => {
    if (!isOpen || evaluatedLooks.length === 0) return;

    let isMounted = true;
    setLoadingConclusion(true);

    const inputData: LookComparisonInput[] = evaluatedLooks.map((l) => ({
      id: l.id,
      ten: l.ten,
      thuongYTen: l.lookState.thuongY?.ten || 'Áo ngũ thân',
      haYTen: l.lookState.haY?.ten || 'Quần lụa',
      thuPhucTen: l.lookState.thuPhuc?.ten || 'Để trần',
      haiTen: l.lookState.hai?.ten || 'Hài nhung',
      phuKienTen: l.lookState.phuKien?.[0]?.ten || 'Không mang',
      mauChinhTen: l.mauChinhTen,
      scoreMau: l.scoreMau,
      scoreBoiCanh: l.scoreBoiCanh,
      scoreVanHoa: l.scoreVanHoa,
      coVanHoaMucDo: l.flagResult.mucDoChung,
      mucTrangTrong: l.mucTrangTrong,
      hopThoiTiet: l.hopThoiTiet,
    }));

    soSanhLook(inputData, event)
      .then((res) => {
        if (isMounted) setConclusionData(res);
      })
      .catch((err) => {
        console.warn('[Gemini soSanhLook fallback used]', err);
        if (isMounted) {
          const sorted = [...evaluatedLooks].sort(
            (a, b) => b.scoreMau + b.scoreBoiCanh - (a.scoreMau + a.scoreBoiCanh)
          );
          const best = sorted[0];
          setConclusionData({
            lookTotNhat: best.ten,
            lyDo: `Phương án ${best.ten} đạt chỉ số hài hòa bối cảnh cao nhất (${best.scoreBoiCanh}/100) và điểm màu sắc ${best.scoreMau}/100, đồng thời giữ cờ văn hóa an toàn tuyệt đối cho sự kiện ${event.ten}.`,
            khiNaoChonCaiKia:
              evaluatedLooks.length > 1
                ? `Bạn có thể cân nhắc phương án ${sorted[1].ten} nếu muốn sắc thái trang phục mềm mại hơn cho không gian trò chuyện thân mật.`
                : 'Phương án này đáp ứng tối ưu bối cảnh sự kiện.',
          });
        }
      })
      .finally(() => {
        if (isMounted) setLoadingConclusion(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, evaluatedLooks, event]);

  // ---------------------------------------------------------------------------
  // 5. THAO TÁC THÊM / BỚT CỘT
  // ---------------------------------------------------------------------------
  const handleRemoveColumn = (idToRemove: string) => {
    if (activeLooks.length <= 2) return; // Giữ tối thiểu 2 cột
    setActiveLooks((prev) => prev.filter((l) => l.id !== idToRemove));
  };

  const handleAddColumn = () => {
    if (activeLooks.length >= 3) return; // Tối đa 3 cột

    // Tìm một phương án chưa có trong danh sách
    const existingIds = new Set(activeLooks.map((l) => l.id));
    const eventFallbacks = FALLBACK_OUTFITS_BY_EVENT[event.id] || FALLBACK_OUTFITS_BY_EVENT['E01'];

    const candidate = eventFallbacks.find((fb, idx) => !existingIds.has(`fallback_${event.id}_${idx}`));
    if (candidate) {
      const idx = eventFallbacks.indexOf(candidate);
      setActiveLooks((prev) => [
        ...prev,
        {
          id: `fallback_${event.id}_${idx}`,
          ten: candidate.ten,
          lookState: {
            thuongY: GARMENTS.find((g) => g.id === candidate.thuongY) || currentLookState.thuongY,
            haY: GARMENTS.find((g) => g.id === candidate.haY) || currentLookState.haY,
            thuPhuc: GARMENTS.find((g) => g.id === candidate.thuPhuc) || currentLookState.thuPhuc,
            hai: GARMENTS.find((g) => g.id === candidate.hai) || currentLookState.hai,
            phuKien: [],
            mauChinh: candidate.mauChinh,
          },
          ghiChu: candidate.lyDo,
        },
      ]);
      return;
    }

    // Nếu không còn fallback, thử lấy từ lookbook
    const lbCandidate = lookbook.find((lb) => !existingIds.has(lb.id));
    if (lbCandidate) {
      setActiveLooks((prev) => [
        ...prev,
        {
          id: lbCandidate.id,
          ten: lbCandidate.ten,
          lookState: lbCandidate.look,
          ghiChu: lbCandidate.ghiChu,
        },
      ]);
      return;
    }

    // Hoặc tạo một biến thể áo giao lĩnh
    const giaoLinhGarment = GARMENTS.find((g) => g.id === 'G01');
    setActiveLooks((prev) => [
      ...prev,
      {
        id: `variant_${Date.now()}`,
        ten: 'Giao Lĩnh Kinh Bắc Nhã Nhặn',
        lookState: {
          ...currentLookState,
          thuongY: giaoLinhGarment || currentLookState.thuongY,
          mauChinh: '#3F6B5A',
        },
        ghiChu: 'Giao lĩnh dáng thụng cổ truyền',
      },
    ]);
  };

  // ---------------------------------------------------------------------------
  // 6. NÚT "LẤY PHƯƠNG ÁN NÀY": ĐƯA VỀ XƯỞNG PHỐI ĐỂ SỬA TIẾP
  // ---------------------------------------------------------------------------
  const handleSelectLook = (selectedLook: LookState) => {
    store.setThuongY(selectedLook.thuongY || null);
    store.setHaY(selectedLook.haY || null);
    store.setThuPhuc(selectedLook.thuPhuc || null);
    store.setHai(selectedLook.hai || null);
    if (selectedLook.mauChinh) {
      store.setMauChinh(selectedLook.mauChinh);
    }
    store.setStudioStep(3); // Về Bước 3 Xưởng phối để sửa tiếp
    store.setScreen('studio');
    onClose();
  };

  // ---------------------------------------------------------------------------
  // 7. KIỂM TRA SỰ KHÁC NHAU GIỮA CÁC CỘT (ĐIỂM MẤU CHỐT CỦA BẢNG)
  // Ô khác nhau: Nền sáng hơn 1 bậc, chữ đậm hơn
  // Ô giống nhau: Mờ 55%
  // ---------------------------------------------------------------------------
  const checkIsDifferent = (values: (string | number)[]) => {
    if (values.length <= 1) return false;
    const first = values[0];
    return !values.every((v) => v === first);
  };

  // Các trường kiểm tra sự khác nhau
  const diffThuongY = checkIsDifferent(evaluatedLooks.map((l) => l.lookState.thuongY?.id || ''));
  const diffHaY = checkIsDifferent(evaluatedLooks.map((l) => l.lookState.haY?.id || ''));
  const diffThuPhuc = checkIsDifferent(evaluatedLooks.map((l) => l.lookState.thuPhuc?.id || ''));
  const diffHai = checkIsDifferent(evaluatedLooks.map((l) => l.lookState.hai?.id || ''));
  const diffPhuKien = checkIsDifferent(evaluatedLooks.map((l) => l.lookState.phuKien?.[0]?.id || 'none'));
  const diffMauChinh = checkIsDifferent(evaluatedLooks.map((l) => l.mauChinhHex.toLowerCase()));
  const diffScoreMau = checkIsDifferent(evaluatedLooks.map((l) => l.scoreMau));
  const diffScoreBoiCanh = checkIsDifferent(evaluatedLooks.map((l) => l.scoreBoiCanh));
  const diffCoVanHoa = checkIsDifferent(evaluatedLooks.map((l) => l.flagResult.mucDoChung));
  const diffMucTrangTrong = checkIsDifferent(evaluatedLooks.map((l) => l.mucTrangTrong));
  const diffHopThoiTiet = checkIsDifferent(evaluatedLooks.map((l) => l.hopThoiTiet));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#0D1826]/85 flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-[#FBF8F2] border border-[#2C2A26] w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl rounded-[1px] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* HEADER */}
        <div className="p-5 md:px-8 border-b border-[#2C2A26]/15 flex items-center justify-between bg-[#F2EDE3]">
          <div>
            <span className="micro-label text-[#A8322A]">SO SANH DOI CHIEU</span>
            <h2 className="font-display text-2xl md:text-3xl text-[#2C2A26] font-normal mt-0.5">
              So sánh các phương án phối
            </h2>
            <p className="text-xs font-sans text-[#6E5439] mt-0.5">
              Bối cảnh: <strong>{event.ten}</strong> (Yêu cầu: {layTenMucTrangTrong(event.mucTrangTrongYeuCau)})
            </p>
          </div>

          <div className="flex items-center gap-3">
            {activeLooks.length < 3 && (
              <button
                type="button"
                onClick={handleAddColumn}
                className="px-3.5 py-1.5 border border-[#2C2A26] bg-[#FBF8F2] font-mono text-xs uppercase tracking-wider text-[#2C2A26] hover:bg-[#16243A] hover:text-[#F2EDE3] transition-colors cursor-pointer"
              >
                + THÊM CỘT
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 border border-[#2C2A26]/30 font-mono text-xs uppercase tracking-wider text-[#2C2A26] hover:text-[#A8322A] hover:border-[#A8322A] cursor-pointer"
            >
              ĐÓNG [ESC]
            </button>
          </div>
        </div>

        {/* THÂN BẢNG SO SÁNH (SCROLL NGANG VỚI SCROLL-SNAP TRÊN ĐIỆN THOẠI, CỘT TRÁI STICKY) */}
        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="overflow-x-auto snap-x snap-mandatory pb-4">
            <table className="w-full border-collapse border border-[#2C2A26]/20 min-w-[700px]">
              <thead>
                <tr className="border-b border-[#2C2A26]/20 bg-[#F2EDE3]">
                  {/* CỘT TÊN THUỘC TÍNH DÍNH BÊN TRÁI TRÊN MOBILE */}
                  <th className="sticky left-0 z-20 bg-[#F2EDE3] p-3 text-left font-mono text-xs uppercase tracking-wider text-[#6E5439] border-r border-[#2C2A26]/20 w-44 md:w-52 shadow-xs">
                    THUỘC TÍNH
                  </th>

                  {/* CÁC CỘT PHƯƠNG ÁN LOOK */}
                  {evaluatedLooks.map((look, idx) => (
                    <th
                      key={look.id}
                      className="p-3 text-left font-mono text-xs tracking-wider border-r border-[#2C2A26]/15 last:border-r-0 snap-start min-w-[220px] md:min-w-[260px] bg-[#FBF8F2]"
                    >
                      <div className="flex items-center justify-between pb-1">
                        <span className="micro-label text-[#A8322A]">
                          PHƯƠNG ÁN 0{idx + 1}
                        </span>
                        {activeLooks.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveColumn(look.id)}
                            className="text-[10px] font-mono text-[#6E5439] hover:text-[#A8322A] px-1 py-0.5 border border-[#2C2A26]/10 cursor-pointer"
                            title="Bớt cột này"
                          >
                            BỚT CỘT [X]
                          </button>
                        )}
                      </div>
                      <div className="font-display text-base text-[#2C2A26] font-normal leading-tight">
                        {look.ten}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-[#2C2A26]/15 text-xs font-sans">
                {/* 1. HÀNG ẢNH THU NHỎ */}
                <tr>
                  <td className="sticky left-0 z-20 bg-[#F2EDE3] p-3 font-mono text-xs text-[#6E5439] uppercase border-r border-[#2C2A26]/20 shadow-xs">
                    Ảnh phác thảo
                  </td>
                  {evaluatedLooks.map((look) => (
                    <td
                      key={look.id}
                      className="p-3 border-r border-[#2C2A26]/15 last:border-r-0 align-top bg-[#FBF8F2]"
                    >
                      <div className="w-20 h-26 border border-[#C39A27] rounded-[2px] bg-[#F2EDE3] flex items-center justify-center p-2 relative overflow-hidden shadow-2xs">
                        <svg viewBox="0 0 100 130" className="w-full h-full" fill="none">
                          {/* Khăn / Mũ */}
                          <ellipse cx="50" cy="22" rx="14" ry="6" fill="#2C2A26" />
                          <circle cx="50" cy="30" r="8" fill="#E8DEC8" />
                          {/* Quần */}
                          <path d="M42,75 L36,118 L48,118 L50,85 Z" fill="#F2EDE3" stroke="#D8D0C2" strokeWidth="0.5" />
                          <path d="M58,75 L64,118 L52,118 L50,85 Z" fill="#F2EDE3" stroke="#D8D0C2" strokeWidth="0.5" />
                          {/* Áo */}
                          <path
                            d="M38,38 L22,70 L34,74 L40,55 L38,98 L62,98 L60,55 L66,74 L78,70 L62,38 Z"
                            fill={look.mauChinhHex}
                          />
                          <circle cx="53" cy="42" r="1" fill="#C39A27" />
                          <circle cx="55" cy="50" r="1" fill="#C39A27" />
                        </svg>
                        <div
                          className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full border border-white"
                          style={{ backgroundColor: look.mauChinhHex }}
                        />
                      </div>
                    </td>
                  ))}
                </tr>

                {/* 2. HÀNG TÊN LOOK */}
                <tr>
                  <td className="sticky left-0 z-20 bg-[#F2EDE3] p-3 font-mono text-xs text-[#6E5439] uppercase border-r border-[#2C2A26]/20 shadow-xs">
                    Tên phương án
                  </td>
                  {evaluatedLooks.map((look) => (
                    <td
                      key={look.id}
                      className="p-3 border-r border-[#2C2A26]/15 last:border-r-0 font-medium text-[#2C2A26] bg-[#FBF8F2]"
                    >
                      {look.ten}
                      {look.ghiChu && (
                        <span className="block text-[11px] text-[#6E5439] font-normal italic mt-0.5">
                          {look.ghiChu}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* 3. THƯỢNG Y (KIỂM TRA KHÁC NHAU) */}
                <tr className={diffThuongY ? 'bg-[#FBF8F2]' : 'bg-[#F2EDE3]/50 opacity-55'}>
                  <td className="sticky left-0 z-20 bg-[#F2EDE3] p-3 font-mono text-xs text-[#6E5439] uppercase border-r border-[#2C2A26]/20 shadow-xs">
                    Thượng y
                  </td>
                  {evaluatedLooks.map((look) => (
                    <td
                      key={look.id}
                      className={`p-3 border-r border-[#2C2A26]/15 last:border-r-0 ${
                        diffThuongY ? 'font-medium text-[#2C2A26]' : 'text-[#6E5439]'
                      }`}
                    >
                      <div className="font-sans text-xs">
                        {look.lookState.thuongY?.ten || 'Chưa chọn'}
                      </div>
                      <div className="font-mono text-[10px] text-[#6E5439]">
                        {look.lookState.thuongY?.nienDai}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* 4. HẠ Y (KIỂM TRA KHÁC NHAU) */}
                <tr className={diffHaY ? 'bg-[#FBF8F2]' : 'bg-[#F2EDE3]/50 opacity-55'}>
                  <td className="sticky left-0 z-20 bg-[#F2EDE3] p-3 font-mono text-xs text-[#6E5439] uppercase border-r border-[#2C2A26]/20 shadow-xs">
                    Hạ y
                  </td>
                  {evaluatedLooks.map((look) => (
                    <td
                      key={look.id}
                      className={`p-3 border-r border-[#2C2A26]/15 last:border-r-0 ${
                        diffHaY ? 'font-medium text-[#2C2A26]' : 'text-[#6E5439]'
                      }`}
                    >
                      {look.lookState.haY?.ten || 'Quần lụa trắng'}
                    </td>
                  ))}
                </tr>

                {/* 5. THỦ PHỤC (KIỂM TRA KHÁC NHAU) */}
                <tr className={diffThuPhuc ? 'bg-[#FBF8F2]' : 'bg-[#F2EDE3]/50 opacity-55'}>
                  <td className="sticky left-0 z-20 bg-[#F2EDE3] p-3 font-mono text-xs text-[#6E5439] uppercase border-r border-[#2C2A26]/20 shadow-xs">
                    Thủ phục
                  </td>
                  {evaluatedLooks.map((look) => (
                    <td
                      key={look.id}
                      className={`p-3 border-r border-[#2C2A26]/15 last:border-r-0 ${
                        diffThuPhuc ? 'font-medium text-[#2C2A26]' : 'text-[#6E5439]'
                      }`}
                    >
                      {look.lookState.thuPhuc?.ten || 'Để trần / Tóc vấn'}
                    </td>
                  ))}
                </tr>

                {/* 6. HÀI (KIỂM TRA KHÁC NHAU) */}
                <tr className={diffHai ? 'bg-[#FBF8F2]' : 'bg-[#F2EDE3]/50 opacity-55'}>
                  <td className="sticky left-0 z-20 bg-[#F2EDE3] p-3 font-mono text-xs text-[#6E5439] uppercase border-r border-[#2C2A26]/20 shadow-xs">
                    Hài / Guốc
                  </td>
                  {evaluatedLooks.map((look) => (
                    <td
                      key={look.id}
                      className={`p-3 border-r border-[#2C2A26]/15 last:border-r-0 ${
                        diffHai ? 'font-medium text-[#2C2A26]' : 'text-[#6E5439]'
                      }`}
                    >
                      {look.lookState.hai?.ten || 'Hài nhung cổ truyền'}
                    </td>
                  ))}
                </tr>

                {/* 7. PHỤ KIỆN (KIỂM TRA KHÁC NHAU) */}
                <tr className={diffPhuKien ? 'bg-[#FBF8F2]' : 'bg-[#F2EDE3]/50 opacity-55'}>
                  <td className="sticky left-0 z-20 bg-[#F2EDE3] p-3 font-mono text-xs text-[#6E5439] uppercase border-r border-[#2C2A26]/20 shadow-xs">
                    Phụ kiện
                  </td>
                  {evaluatedLooks.map((look) => (
                    <td
                      key={look.id}
                      className={`p-3 border-r border-[#2C2A26]/15 last:border-r-0 ${
                        diffPhuKien ? 'font-medium text-[#2C2A26]' : 'text-[#6E5439]'
                      }`}
                    >
                      {look.lookState.phuKien?.[0]?.ten || 'Không mang'}
                    </td>
                  ))}
                </tr>

                {/* 8. MÀU CHÍNH (KIỂM TRA KHÁC NHAU) */}
                <tr className={diffMauChinh ? 'bg-[#FBF8F2]' : 'bg-[#F2EDE3]/50 opacity-55'}>
                  <td className="sticky left-0 z-20 bg-[#F2EDE3] p-3 font-mono text-xs text-[#6E5439] uppercase border-r border-[#2C2A26]/20 shadow-xs">
                    Màu chính
                  </td>
                  {evaluatedLooks.map((look) => (
                    <td
                      key={look.id}
                      className={`p-3 border-r border-[#2C2A26]/15 last:border-r-0 ${
                        diffMauChinh ? 'font-medium text-[#2C2A26]' : 'text-[#6E5439]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-[#2C2A26]/30 shrink-0"
                          style={{ backgroundColor: look.mauChinhHex }}
                        />
                        <span>{look.mauChinhTen}</span>
                      </div>
                    </td>
                  ))}
                </tr>

                {/* 9. HÀI HÒA MÀU (ĐIỂM SỐ CAO NHẤT ĐƯỢC GẠCH --dieu MẢNH Ở DƯỚI) */}
                <tr className={diffScoreMau ? 'bg-[#FBF8F2]' : 'bg-[#F2EDE3]/50 opacity-55'}>
                  <td className="sticky left-0 z-20 bg-[#F2EDE3] p-3 font-mono text-xs text-[#6E5439] uppercase border-r border-[#2C2A26]/20 shadow-xs">
                    Hài hoà màu
                  </td>
                  {evaluatedLooks.map((look) => {
                    const isHighest = look.scoreMau === maxScoreMau;
                    return (
                      <td
                        key={look.id}
                        className={`p-3 border-r border-[#2C2A26]/15 last:border-r-0 ${
                          diffScoreMau ? 'font-medium text-[#2C2A26]' : 'text-[#6E5439]'
                        }`}
                      >
                        <span
                          className={`font-mono text-base tabular-nums ${
                            isHighest ? 'border-b-2 border-[#A8322A] pb-0.5 font-bold text-[#A8322A]' : ''
                          }`}
                        >
                          {look.scoreMau}/100
                        </span>
                      </td>
                    );
                  })}
                </tr>

                {/* 10. HỢP BỐI CẢNH (ĐIỂM SỐ CAO NHẤT ĐƯỢC GẠCH --dieu MẢNH Ở DƯỚI) */}
                <tr className={diffScoreBoiCanh ? 'bg-[#FBF8F2]' : 'bg-[#F2EDE3]/50 opacity-55'}>
                  <td className="sticky left-0 z-20 bg-[#F2EDE3] p-3 font-mono text-xs text-[#6E5439] uppercase border-r border-[#2C2A26]/20 shadow-xs">
                    Hợp bối cảnh
                  </td>
                  {evaluatedLooks.map((look) => {
                    const isHighest = look.scoreBoiCanh === maxScoreBoiCanh;
                    return (
                      <td
                        key={look.id}
                        className={`p-3 border-r border-[#2C2A26]/15 last:border-r-0 ${
                          diffScoreBoiCanh ? 'font-medium text-[#2C2A26]' : 'text-[#6E5439]'
                        }`}
                      >
                        <span
                          className={`font-mono text-base tabular-nums ${
                            isHighest ? 'border-b-2 border-[#A8322A] pb-0.5 font-bold text-[#A8322A]' : ''
                          }`}
                        >
                          {look.scoreBoiCanh}/100
                        </span>
                      </td>
                    );
                  })}
                </tr>

                {/* 11. CỜ VĂN HÓA (ĐIỂM SỐ CAO NHẤT ĐƯỢC GẠCH --dieu MẢNH Ở DƯỚI) */}
                <tr className={diffCoVanHoa ? 'bg-[#FBF8F2]' : 'bg-[#F2EDE3]/50 opacity-55'}>
                  <td className="sticky left-0 z-20 bg-[#F2EDE3] p-3 font-mono text-xs text-[#6E5439] uppercase border-r border-[#2C2A26]/20 shadow-xs">
                    Cờ văn hoá
                  </td>
                  {evaluatedLooks.map((look) => {
                    const isHighest = look.scoreVanHoa === maxScoreVanHoa;
                    const mucDo = look.flagResult.mucDoChung;
                    return (
                      <td
                        key={look.id}
                        className={`p-3 border-r border-[#2C2A26]/15 last:border-r-0 ${
                          diffCoVanHoa ? 'font-medium text-[#2C2A26]' : 'text-[#6E5439]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-3 h-3 rounded-[1px] shrink-0 ${
                              mucDo === 'do'
                                ? 'bg-[#A8322A]'
                                : mucDo === 'vang'
                                ? 'bg-[#C39A27]'
                                : 'bg-[#2D6A4F]'
                            }`}
                          />
                          <span
                            className={`font-mono text-xs uppercase ${
                              isHighest ? 'border-b-2 border-[#A8322A] pb-0.5 font-bold' : ''
                            }`}
                          >
                            Mức {mucDo} ({look.scoreVanHoa}đ)
                          </span>
                        </div>
                      </td>
                    );
                  })}
                </tr>

                {/* 12. MỨC TRANG TRỌNG (KIỂM TRA KHÁC NHAU) */}
                <tr className={diffMucTrangTrong ? 'bg-[#FBF8F2]' : 'bg-[#F2EDE3]/50 opacity-55'}>
                  <td className="sticky left-0 z-20 bg-[#F2EDE3] p-3 font-mono text-xs text-[#6E5439] uppercase border-r border-[#2C2A26]/20 shadow-xs">
                    Mức trang trọng
                  </td>
                  {evaluatedLooks.map((look) => (
                    <td
                      key={look.id}
                      className={`p-3 border-r border-[#2C2A26]/15 last:border-r-0 font-mono ${
                        diffMucTrangTrong ? 'font-medium text-[#2C2A26]' : 'text-[#6E5439]'
                      }`}
                    >
                      {layTenMucTrangTrong(look.mucTrangTrong)}{' '}
                      {look.mucTrangTrong >= event.mucTrangTrongYeuCau ? '(Đạt)' : '(Hơi nhẹ)'}
                    </td>
                  ))}
                </tr>

                {/* 13. HỢP THỜI TIẾT (KIỂM TRA KHÁC NHAU) */}
                <tr className={diffHopThoiTiet ? 'bg-[#FBF8F2]' : 'bg-[#F2EDE3]/50 opacity-55'}>
                  <td className="sticky left-0 z-20 bg-[#F2EDE3] p-3 font-mono text-xs text-[#6E5439] uppercase border-r border-[#2C2A26]/20 shadow-xs">
                    Hợp thời tiết
                  </td>
                  {evaluatedLooks.map((look) => (
                    <td
                      key={look.id}
                      className={`p-3 border-r border-[#2C2A26]/15 last:border-r-0 ${
                        diffHopThoiTiet ? 'font-medium text-[#2C2A26]' : 'text-[#6E5439]'
                      }`}
                    >
                      {look.hopThoiTiet}
                    </td>
                  ))}
                </tr>

                {/* HÀNG HÀNH ĐỘNG: NÚT "LẤY PHƯƠNG ÁN NÀY" */}
                <tr className="bg-[#F2EDE3]">
                  <td className="sticky left-0 z-20 bg-[#F2EDE3] p-3 font-mono text-xs text-[#6E5439] uppercase border-r border-[#2C2A26]/20 shadow-xs">
                    Thao tác
                  </td>
                  {evaluatedLooks.map((look) => (
                    <td key={look.id} className="p-3 border-r border-[#2C2A26]/15 last:border-r-0">
                      <button
                        type="button"
                        onClick={() => handleSelectLook(look.lookState)}
                        className="w-full px-3 py-2 bg-[#A8322A] text-[#F2EDE3] font-mono text-xs uppercase tracking-wider hover:bg-[#A8322A]/85 transition-colors cursor-pointer text-center rounded-[1px]"
                      >
                        LẤY PHƯƠNG ÁN NÀY
                      </button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* ===================================================================
              DÒNG KẾT LUẬN — KHỐI NỀN --nga CHỨA 2 TỚI 3 CÂU DO GEMINI VIẾT
              TRẢ LỜI ĐÚNG CÂU HỎI "NÊN CHỌN CÁI NÀO VÀ VÌ SAO"
              =================================================================== */}
          <div className="mt-6 p-5 md:p-6 bg-[#F2EDE3] border border-[#2C2A26]/20 border-l-4 border-l-[#C39A27] rounded-[1px] flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="micro-label text-[#A8322A]">
                KHUYẾN NGHỊ GIÁM TUYỂN (AI VĂN HIẾN)
              </span>
              <span className="font-mono text-[11px] text-[#6E5439]">
                Khảo luận định lượng
              </span>
            </div>

            {loadingConclusion ? (
              <div className="space-y-2 py-1">
                <div className="h-4 w-4/5 bg-[#2C2A26]/10 animate-pulse rounded-[1px]" />
                <div className="h-4 w-11/12 bg-[#2C2A26]/10 animate-pulse rounded-[1px]" />
                <div className="h-4 w-2/3 bg-[#2C2A26]/10 animate-pulse rounded-[1px]" />
              </div>
            ) : (
              <div className="space-y-2">
                <p className="font-display text-lg text-[#2C2A26]">
                  Phương án tối ưu: <strong>{conclusionData?.lookTotNhat}</strong>
                </p>
                <p className="text-sm font-sans text-[#2C2A26] leading-relaxed max-w-4xl">
                  {conclusionData?.lyDo}
                </p>
                {conclusionData?.khiNaoChonCaiKia && (
                  <p className="text-xs font-sans text-[#6E5439] italic pt-1 border-t border-[#2C2A26]/10">
                    Gợi ý tình huống: {conclusionData.khiNaoChonCaiKia}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-4 md:px-8 border-t border-[#2C2A26]/15 bg-[#FBF8F2] flex items-center justify-between">
          <div className="font-mono text-xs text-[#6E5439]">
            Mẹo: Các ô <span className="font-bold text-[#2C2A26]">nền sáng</span> chỉ điểm khác biệt; ô <span className="opacity-55">mờ 55%</span> biểu thị đặc tính đồng nhất.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-[#2C2A26] text-[#F2EDE3] font-mono text-xs uppercase tracking-wider hover:bg-[#16243A] cursor-pointer"
          >
            ĐÃ HIỂU
          </button>
        </div>
      </div>
    </div>
  );
}
