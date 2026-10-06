import React, { useState, useMemo, useEffect } from 'react';
import { LUAT_CHO_DU_LIEU, CULTURE_RULES } from '../../data/cultureRules';
import { SOURCES } from '../../data/sources';
import { store } from '../../lib/store';
import { CultureRule, Source } from '../../types';
import SourceDetailModal from './SourceDetailModal';
import SourceTag from '../shared/SourceTag';

export default function CultureRulesScreen() {
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'do' | 'vang' | 'xanh'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);
  const [highlightedRuleId, setHighlightedRuleId] = useState<string | null>(null);

  // Xử lý cuộn đến luật cụ thể từ URL hash (ví dụ #luat-van-hoa-cr-01)
  useEffect(() => {
    const handleHashCheck = () => {
      const hash = window.location.hash.toLowerCase();
      const match = hash.match(/cr-\d+/);
      if (match) {
        const targetId = match[0].toUpperCase();
        setHighlightedRuleId(targetId);
        setTimeout(() => {
          const el = document.getElementById(`rule-${targetId}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 150);
      }
    };

    handleHashCheck();
    window.addEventListener('hashchange', handleHashCheck);
    return () => window.removeEventListener('hashchange', handleHashCheck);
  }, []);

  // Lọc cục bộ không gọi API
  const filteredRules = useMemo(() => {
    return CULTURE_RULES.filter((rule) => {
      // Lọc theo mức độ
      if (filterSeverity !== 'all' && rule.mucDo !== filterSeverity) {
        return false;
      }

      // Lọc theo từ khoá tìm kiếm
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchId = rule.id.toLowerCase().includes(query);
        const matchName = rule.ten.toLowerCase().includes(query);
        const matchCondition = rule.dieuKien.toLowerCase().includes(query);
        const matchMsg = rule.thongDiep.toLowerCase().includes(query);
        const matchFix = rule.cachSua.some((c) => c.moTa.toLowerCase().includes(query));
        return matchId || matchName || matchCondition || matchMsg || matchFix;
      }

      return true;
    });
  }, [filterSeverity, searchQuery]);

  // Thống kê số lượng
  const countTotal = CULTURE_RULES.length;
  const countRed = CULTURE_RULES.filter((r) => r.mucDo === 'do').length;
  const countYellow = CULTURE_RULES.filter((r) => r.mucDo === 'vang').length;
  const countGreen = CULTURE_RULES.filter((r) => r.mucDo === 'xanh').length;

  // Lấy chi tiết nguồn từ sourceId
  const getSourceById = (id: string): Source | undefined => {
    return SOURCES.find((s) => s.id === id);
  };

  // Nhãn độ chắc chắn dạng viên thuốc viền mảnh
  const renderCertaintyPill = (doChacChan: CultureRule['doChacChan']) => {
    switch (doChacChan) {
      case 'da_xac_lap':
        return (
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#6E5439] border border-[#2C2A26]/20 px-2.5 py-0.5 rounded-full bg-[#FBF8F2]">
            Đã xác lập trong sử liệu
          </span>
        );
      case 'thuc_hanh_hien_nay':
        return (
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#6E5439] border border-[#2C2A26]/20 px-2.5 py-0.5 rounded-full bg-[#FBF8F2]">
            Thực hành cộng đồng hiện nay
          </span>
        );
      case 'dang_tranh_luan':
      default:
        return (
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#6E5439] border border-[#2C2A26]/20 px-2.5 py-0.5 rounded-full bg-[#FBF8F2]">
            Đang đối thoại học thuật
          </span>
        );
    }
  };

  // Ô vuông 10px màu theo mức độ (CR-20 màu xanh)
  const renderSeverityBox = (mucDo: CultureRule['mucDo']) => {
    if (mucDo === 'do') {
      return (
        <span
          className="w-[10px] h-[10px] bg-[#A8322A] shrink-0 mt-2 rounded-[1px] shadow-2xs"
          title="Mức Đỏ: Cần cân nhắc nghiêm cẩn"
        />
      );
    }
    if (mucDo === 'xanh') {
      return (
        <span
          className="w-[10px] h-[10px] bg-[#2D6A4F] shrink-0 mt-2 rounded-[1px] shadow-2xs"
          title="Mức Xanh: Chuẩn mực phục dựng và hành lễ"
        />
      );
    }
    return (
      <span
        className="w-[10px] h-[10px] bg-[#C39A27] shrink-0 mt-2 rounded-[1px] shadow-2xs"
        title="Mức Vàng: Lưu ý bối cảnh và không gian"
      />
    );
  };

  return (
    <div className="w-full bg-[#FBF8F2] text-[#2C2A26] min-h-[calc(100vh-56px)] select-none">
      {/* KHUNG NỘI DUNG CHÍNH */}
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-10 md:py-14 flex flex-col gap-10">
        {/* =====================================================================
            1. PHẦN ĐẦU TRANG & 3 CÂU DẪN NGUYÊN TẮC VĂN HOÁ BẮT BUỘC
            ===================================================================== */}
        <header className="flex flex-col gap-4 border-b border-[#2C2A26]/18 pb-8">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-[#A8322A] tracking-[0.2em] uppercase font-bold">
              HỆ THỐNG CULTURE GUARD
            </span>
            <span className="font-mono text-xs text-[#6E5439] uppercase tracking-wider">
              {CULTURE_RULES.length} QUY THỨC DI SẢN
            </span>
          </div>

          <h1 className="font-display text-3xl md:text-4xl text-[#2C2A26] font-medium leading-tight">
            {CULTURE_RULES.length} luật văn hoá trang phục
          </h1>

          {/* 3 CÂU DẪN NGUYÊN TẮC (YÊU CẦU BẮT BUỘC SỐ 5) */}
          <div className="p-4 md:p-5 bg-[#F2EDE3] border border-[#2C2A26]/15 corner-mark flex flex-col gap-2 text-sm font-sans text-[#2C2A26] leading-relaxed">
            <p>
              Đây không phải bảng cấm đoán hay danh sách trừng phạt các biến tấu trang phục.
            </p>
            <p>
              Ba mức cờ Đỏ, Vàng và Xanh chỉ đại diện cho mức độ cần cân nhắc đối chiếu với quy chế điển chương và tập quán lịch sử.
            </p>
            <p>
              Người mặc luôn giữ quyền quyết định cuối cùng trong việc thể hiện phong cách và câu chuyện của riêng mình.
            </p>
          </div>
        </header>

        {/* =====================================================================
            2. THANH LỌC VÀ Ô TÌM KIẾM CỤC BỘ (YÊU CẦU BẮT BUỘC SỐ 3)
            ===================================================================== */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pb-4 border-b border-[#2C2A26]/12">
          {/* Bộ lọc 4 mức: Tất cả, Mức đỏ, Mức vàng, Mức xanh */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <button
              type="button"
              onClick={() => setFilterSeverity('all')}
              className={`px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer border flex items-center gap-1.5 ${
                filterSeverity === 'all'
                  ? 'bg-[#16243A] text-[#F2EDE3] border-[#16243A] font-bold'
                  : 'bg-[#F2EDE3] text-[#2C2A26] border-[#2C2A26]/20 hover:border-[#2C2A26]/50'
              }`}
            >
              <span>TẤT CẢ</span>
              <span className="font-mono text-[10px] opacity-80">({countTotal})</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterSeverity('do')}
              className={`px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer border flex items-center gap-1.5 ${
                filterSeverity === 'do'
                  ? 'bg-[#A8322A] text-[#F2EDE3] border-[#A8322A] font-bold'
                  : 'bg-[#F2EDE3] text-[#2C2A26] border-[#2C2A26]/20 hover:border-[#A8322A]'
              }`}
            >
              <span className="w-2 h-2 bg-[#A8322A] inline-block" />
              <span>MỨC ĐỎ</span>
              <span className="font-mono text-[10px] opacity-80">({countRed})</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterSeverity('vang')}
              className={`px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer border flex items-center gap-1.5 ${
                filterSeverity === 'vang'
                  ? 'bg-[#C39A27] text-[#0D1826] border-[#C39A27] font-bold'
                  : 'bg-[#F2EDE3] text-[#2C2A26] border-[#2C2A26]/20 hover:border-[#C39A27]'
              }`}
            >
              <span className="w-2 h-2 bg-[#C39A27] inline-block" />
              <span>MỨC VÀNG</span>
              <span className="font-mono text-[10px] opacity-80">({countYellow})</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterSeverity('xanh')}
              className={`px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer border flex items-center gap-1.5 ${
                filterSeverity === 'xanh'
                  ? 'bg-[#2D6A4F] text-[#F2EDE3] border-[#2D6A4F] font-bold'
                  : 'bg-[#F2EDE3] text-[#2C2A26] border-[#2C2A26]/20 hover:border-[#2D6A4F]'
              }`}
            >
              <span className="w-2 h-2 bg-[#2D6A4F] inline-block" />
              <span>MỨC XANH</span>
              <span className="font-mono text-[10px] opacity-80">({countGreen})</span>
            </button>
          </div>

          {/* Ô tìm kiếm lọc theo tên và nội dung (cục bộ) */}
          <div className="relative min-w-[260px] md:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên luật hoặc từ khoá..."
              className="w-full px-3 py-1.5 pr-8 bg-[#F2EDE3] border border-[#2C2A26]/20 text-xs font-sans text-[#2C2A26] placeholder-[#6E5439]/60 focus:outline-hidden focus:border-[#2C2A26]"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 font-mono text-xs text-[#6E5439] hover:text-[#A8322A] cursor-pointer"
                title="Xoá tìm kiếm"
              >
                ✕
              </button>
            ) : (
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-xs text-[#6E5439]/50">
                ⌕
              </span>
            )}
          </div>
        </div>

        {/* =====================================================================
            3. BỐ CỤC DANH SÁCH DỌC 20 LUẬT (KHÔNG DÙNG CARD, NGĂN BẰNG ĐƯỜNG KẺ TÓC)
            ===================================================================== */}
        <div className="flex flex-col divide-y divide-[#2C2A26]/15">
          {filteredRules.length === 0 ? (
            <div className="py-16 text-center text-[#6E5439] font-sans text-sm">
              Không tìm thấy quy tắc nào phù hợp với bộ lọc hiện tại.
            </div>
          ) : (
            filteredRules.map((rule) => {
              const isHighlighted = highlightedRuleId === rule.id;

              return (
                <div
                  key={rule.id}
                  id={`rule-${rule.id}`}
                  className={`py-8 transition-colors ${
                    isHighlighted ? 'bg-[#F2EDE3]/70 -mx-4 px-4' : ''
                  }`}
                >
                  <div className="flex flex-col md:flex-row items-start justify-between gap-6">
                    {/* CỘT TRÁI: MÃ LUẬT, Ô VUÔNG 10PX VÀ TÊN LUẬT FRAUNCES 22PX */}
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      {/* Ô vuông 10px màu theo mức độ */}
                      {renderSeverityBox(rule.mucDo)}

                      <div className="flex flex-col gap-2 min-w-0">
                        {/* Hàng thông tin: Nhãn độ chắc chắn */}
                        <div className="flex flex-wrap items-center gap-2.5">
                          {renderCertaintyPill(rule.doChacChan)}
                        </div>

                        {/* Tên luật Fraunces cỡ 22px */}
                        <h2 className="font-display text-[22px] leading-snug text-[#2C2A26] font-medium">
                          {rule.ten}
                        </h2>

                        {/* Điều kiện kích hoạt: câu tiếng Việt dễ hiểu từ dieuKien */}
                        <div className="flex items-baseline gap-2 pt-1 text-xs">
                          <span className="font-mono text-[10px] text-[#6E5439] uppercase tracking-wider shrink-0 font-medium">
                            ĐIỀU KIỆN:
                          </span>
                          <span className="font-sans text-[#2C2A26] leading-relaxed">
                            {rule.dieuKien}
                          </span>
                        </div>

                        {/* Thông điệp đầy đủ */}
                        <div className="text-xs font-sans text-[#6E5439] leading-relaxed pt-1">
                          {rule.thongDiep}
                        </div>

                        {/* Khối Cách sửa: liệt kê từng cách */}
                        <div className="mt-2 p-3 bg-[#F2EDE3] border border-[#2C2A26]/12 flex flex-col gap-1.5">
                          <span className="font-mono text-[10px] text-[#6E5439] uppercase tracking-wider font-bold">
                            CÁCH ĐIỀU CHỈNH:
                          </span>
                          <ul className="flex flex-col gap-1 text-xs font-sans text-[#2C2A26]">
                            {rule.cachSua.map((cs, idx) => (
                              <li key={idx} className="flex items-start gap-1.5 leading-snug">
                                <span className="text-[#A8322A] font-mono">▸</span>
                                <span>{cs.moTa}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Hàng nguồn sử dụng SourceTag đồng bộ */}
                        <div className="pt-2">
                          <SourceTag sourceIds={rule.sourceIds} />
                        </div>
                      </div>
                    </div>

                    {/* CỘT PHẢI: NÚT XEM VÍ DỤ NHẢY SANG XƯỞNG PHỐI */}
                    <div className="shrink-0 pt-1 md:self-start">
                      {LUAT_CHO_DU_LIEU.includes(rule.id) ? (
                        <span
                          className="block max-w-[14rem] px-3 py-2 border border-dashed border-[#2C2A26]/30 font-sans text-[11px] text-[#6E5439] leading-snug"
                          title="Luật đã viết sẵn, chờ dữ liệu"
                        >
                          Chờ dữ liệu: kho chưa có hiện vật dân tộc thiểu số nên luật này chưa chạy được.
                        </span>
                      ) : (
                      <button
                        type="button"
                        onClick={() => store.applyRuleExample(rule.id)}
                        className="px-4 py-2 bg-[#2C2A26] hover:bg-[#A8322A] text-[#F2EDE3] font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-2 shadow-2xs"
                        title="Xem thử tổ hợp mẫu để kiểm chứng quy tắc trong Xưởng phối"
                      >
                        <span>XEM VÍ DỤ</span>
                        <span className="font-mono text-xs">→</span>
                      </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MODAL CHI TIẾT NGUỒN KHI BẤM VIÊN THUỐC */}
      <SourceDetailModal
        source={selectedSource}
        onClose={() => setSelectedSource(null)}
      />
    </div>
  );
}
