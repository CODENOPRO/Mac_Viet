import React, { useState, useEffect, useRef } from 'react';
import { store } from '../../lib/store';
import { Source } from '../../types';
import { SOURCES } from '../../data/sources';
import {
  chayRagCucBo,
  kiemDinhTraLoi,
  CAU_HOI_GOI_Y,
  CAU_TRA_LOI_MAU,
} from '../../lib/cuNgheRag';
import { streamCuNgheTraLoi } from '../../lib/gemini';
import SourceTag from '../shared/SourceTag';

// Mã nguồn như [S01] chỉ dùng để kiểm định; người đọc thấy tên nguồn ở dòng Nguồn bên dưới.
const boMaNguon = (text: string) => text.replace(/\s*\[S\d{2}\]/g, '');

export interface CuNgheMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  sources?: Source[];
  canhBaoThieuNguon?: boolean;
  laNgoaiNguong?: boolean;
}

const STORAGE_KEY = 'mac_viet_cu_nghe_history';

export default function CuNgheScreen() {
  const [messages, setMessages] = useState<CuNgheMessage[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  const [inputVal, setInputVal] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);

  // Modal hiển thị chi tiết nguồn thư tịch khi bấm vào viên thuốc
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Lưu tối đa 20 lượt gần nhất vào localStorage mỗi khi messages thay đổi
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const recent20 = messages.slice(-20);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recent20));
    } catch {
      // ignore
    }
  }, [messages]);

  // Tự động dịch chuyển tới vị trí tin nhắn mới nhất hoặc khi đang nhận dữ liệu
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  // Xoá lịch sử hội thoại
  const handleClearHistory = () => {
    if (isStreaming && abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setMessages([]);
    setIsStreaming(false);
    setStreamingMessageId(null);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
    }
  };

  // Nút dừng để ngắt giữa chừng
  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setStreamingMessageId(null);
  };

  // Điều hướng sang Thư viện hiện vật
  const handleNavigateToMuseum = (_tab?: string) => {
    store.setScreen('landing');
    setTimeout(() => {
      const el = document.getElementById('thu-vien');
      el?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Xử lý gửi câu hỏi
  const handleSend = async (questionText: string) => {
    const q = questionText.trim();
    if (!q || isStreaming) return;

    // 1. Thêm tin nhắn của người dùng
    const userMsg: CuNgheMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: q,
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputVal('');

    // 2. Chạy RAG CỤC BỘ (BẮT BUỘC TRƯỚC KHI GỌI MODEL)
    const ragResult = chayRagCucBo(q);

    // 3. Nếu mục cao điểm nhất vẫn dưới ngưỡng: KHÔNG gọi model!
    if (!ragResult.duDungNguong) {
      const fallbackBelowThresholdMsg: CuNgheMessage = {
        id: `bot_${Date.now()}`,
        role: 'model',
        content: 'Cái này tôi chưa nắm chắc, để tôi chỉ bạn chỗ tra.',
        timestamp: Date.now(),
        laNgoaiNguong: true,
      };
      setMessages([...newMessages, fallbackBelowThresholdMsg]);
      return;
    }

    // 4. Nếu đủ ngưỡng: Chuẩn bị stream
    setIsStreaming(true);
    const botMsgId = `bot_${Date.now()}`;
    setStreamingMessageId(botMsgId);

    const initialBotMsg: CuNgheMessage = {
      id: botMsgId,
      role: 'model',
      content: '',
      timestamp: Date.now(),
    };

    setMessages([...newMessages, initialBotMsg]);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Lấy tối đa 6 lượt gần nhất làm ngữ cảnh để tiết kiệm token
    const last6Turns = newMessages.slice(-6).map((m) => ({
      role: m.role,
      text: m.content,
    }));

    // Chuẩn bị fallback nếu là câu hỏi trong danh sách mẫu
    const matchedSample = CAU_TRA_LOI_MAU[q];
    const fallbackText = matchedSample?.traLoi;

    try {
      let accumulatedText = '';

      const finalContent = await streamCuNgheTraLoi({
        cauHoi: q,
        contextText: ragResult.contextText,
        lichSu: last6Turns,
        abortSignal: abortController.signal,
        fallbackText,
        mucLienQuan: ragResult.topItems.map((it) => ({ ten: it.ten, moTa: it.moTa })),
        onChunk: (chunk) => {
          accumulatedText += chunk;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === botMsgId ? { ...msg, content: accumulatedText } : msg
            )
          );
        },
      });

      // 5. KIỂM ĐỊNH SAU KHI TRẢ LỜI
      const audit = kiemDinhTraLoi(finalContent);

      // Nếu không có nguồn nào trích trực tiếp trong bài, bổ sung các nguồn từ RAG đã xác thực
      const nguonMau = matchedSample
        ? SOURCES.filter((s) => matchedSample.sourceIds.includes(s.id))
        : [];
      const finalSources =
        audit.sources.length > 0 ? audit.sources : nguonMau.length > 0 ? nguonMau : ragResult.validSources;

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === botMsgId
            ? {
                ...msg,
                content: finalContent,
                sources: finalSources,
                canhBaoThieuNguon: audit.canhBaoThieuNguon && finalSources.length === 0,
              }
            : msg
        )
      );
    } catch (err) {
      console.error('[Cụ Nghệ lỗi stream]:', err);
      // Giữ lại nội dung đã stream được hoặc hiện lời nhắn nghệ nhân
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === botMsgId && !msg.content
            ? {
                ...msg,
                content:
                  'Kết nối đang trục trặc, câu này tôi xin để dịp khác. Bạn có thể tra trong mục Luật văn hoá hoặc phần hiện vật ở trang chính.',
                sources: ragResult.validSources,
              }
            : msg
        )
      );
    } finally {
      setIsStreaming(false);
      setStreamingMessageId(null);
      abortControllerRef.current = null;
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-8 select-none">
      {/* =====================================================================
          HEADER: KHỐI CHỮ KÝ FRAUNCES & ĐƯỜNG KẺ TÓC (GIỮ ĐÚNG NGÔN NGỮ THỊ GIÁC)
          ===================================================================== */}
      <div className="pb-6 border-b border-[#2C2A26]/18 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="micro-label text-[#A8322A]">
            TRỢ LÝ HỎI ĐÁP DI SẢN &amp; ĐIỂN CHẾ
          </span>

          {/* Khối chữ ký bằng Fraunces và đường kẻ tóc */}
          <div className="flex items-center gap-3.5 mt-1.5">
            <h1 className="font-display italic text-3xl md:text-4xl text-[#2C2A26] font-normal tracking-wide">
              Cụ Nghệ
            </h1>
            <span className="w-10 md:w-16 h-[1.5px] bg-[#C39A27]" />
            <span className="font-mono text-xs uppercase tracking-widest text-[#6E5439]">
              Nghệ nhân may đo cổ truyền
            </span>
          </div>

          <p className="text-xs md:text-sm font-sans text-[#6E5439] mt-2 max-w-xl leading-relaxed">
            Hỏi đáp chậm rãi, mộc mạc từ đường kim mũi chỉ. Cụ chỉ trả lời dựa trên kho dữ liệu của app và ghi nguồn dưới mỗi câu; câu nào kho chưa có, cụ nói thẳng là chưa nắm chắc.
          </p>
        </div>

        {/* Nút xoá lịch sử */}
        {messages.length > 0 && (
          <button
            type="button"
            onClick={handleClearHistory}
            className="self-start sm:self-auto px-3 py-1.5 border border-[#2C2A26]/20 bg-[#FBF8F2] hover:border-[#A8322A] hover:text-[#A8322A] font-mono text-xs uppercase tracking-wider text-[#6E5439] transition-colors cursor-pointer rounded-[1px]"
          >
            XOÁ LỊCH SỬ
          </button>
        )}
      </div>

      {/* =====================================================================
          KHUNG CHAT: RỘNG TỐI ĐA 720PX, CĂN TRÁI CHỨ KHÔNG CĂN GIỮA
          ===================================================================== */}
      <div className="w-full max-w-[720px] ml-0 mr-auto pt-6 flex flex-col min-h-[500px]">
        {/* MÀN HÌNH RỖNG: 4 CÂU HỎI GỢI Ý SẴN */}
        {messages.length === 0 && (
          <div className="py-8 flex flex-col gap-6 animate-in fade-in duration-200">
            <div className="p-5 border border-[#2C2A26]/15 bg-[#F2EDE3]/40 rounded-[1px]">
              <p className="font-display italic text-lg text-[#2C2A26]">
                "Bạn trẻ muốn hỏi gì về nếp áo ngày xưa cứ thong thả nói, ta cùng trò chuyện."
              </p>
              <p className="text-xs font-sans text-[#6E5439] mt-1">
                Gõ câu hỏi bên dưới hoặc chọn một trong bốn chủ đề người trẻ hay băn khoăn:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CAU_HOI_GOI_Y.map((cauHoi, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(cauHoi)}
                  className="p-3.5 text-left border border-[#2C2A26]/18 bg-[#FBF8F2] hover:border-[#A8322A] hover:bg-[#F2EDE3] transition-all cursor-pointer rounded-[1px] group flex flex-col justify-between"
                >
                  <span className="font-mono text-[10px] text-[#A8322A] block mb-1">
                    GỢI Ý #{idx + 1}
                  </span>
                  <span className="text-xs font-sans text-[#2C2A26] group-hover:text-[#A8322A] leading-snug">
                    {cauHoi}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* DANH SÁCH TIN NHẮN */}
        <div className="flex flex-col gap-6 pb-6 flex-1">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            const isStreamingThis = isStreaming && streamingMessageId === msg.id;

            if (isUser) {
              /* TIN NHẮN CỦA NGƯỜI DÙNG: NỀN --NGA, BO 2PX, CĂN PHẢI */
              return (
                <div key={msg.id} className="flex justify-end">
                  <div className="max-w-[85%] bg-[#F2EDE3] border border-[#2C2A26]/15 rounded-[2px] px-4 py-2.5 text-xs md:text-sm font-sans text-[#2C2A26] shadow-2xs">
                    {boMaNguon(msg.content)}
                  </div>
                </div>
              );
            }

            /* TIN NHẮN CỦA CỤ NGHỆ: KHÔNG CÓ BONG BÓNG, CHỈ LÀ CHỮ TRÊN NỀN,
               CÓ ĐƯỜNG KẺ TÓC DỌC MÀU --HOANG BÊN TRÁI NHƯ ĐOẠN TRÍCH SÁCH */
            return (
              <div key={msg.id} className="flex flex-col gap-2">
                <div className="border-l-2 border-[#C39A27] pl-4 py-1 text-xs md:text-sm font-sans text-[#2C2A26] leading-relaxed">
                  <span>{boMaNguon(msg.content)}</span>
                  {/* TRONG LÚC STREAM: CON TRỎ NHẤP NHÁY MẢNH Ở CUỐI DÒNG, CẤM BA CHẤM NHẢY */}
                  {isStreamingThis && (
                    <span
                      className="inline-block w-1.5 h-4 bg-[#A8322A] animate-pulse ml-1 align-middle"
                      aria-label="Đang gõ"
                    />
                  )}
                </div>

                {/* NẾU LÀ TRƯỜNG HỢP DƯỚI NGƯỠNG (laNgoaiNguong):
                    TRẢ THẲNG LỜI NHẮC KÈM BA LIÊN KẾT TỚI BẢO TÀNG */}
                {msg.laNgoaiNguong && (
                  <div className="ml-4 mt-2 p-3.5 bg-[#F2EDE3] border border-[#2C2A26]/15 flex flex-col gap-2 rounded-[1px]">
                    <span className="font-mono text-[10px] text-[#A8322A] uppercase tracking-wider">
                      TRA CỨU TRỰC TIẾP TRONG BẢO TÀNG
                    </span>
                    <div className="flex flex-col sm:flex-row gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleNavigateToMuseum('nien_bieu')}
                        className="px-2.5 py-1.5 bg-[#FBF8F2] border border-[#2C2A26]/20 text-[11px] font-mono text-[#2C2A26] hover:border-[#A8322A] hover:text-[#A8322A] transition-colors cursor-pointer text-left"
                      >
                        1. Xem trục Niên biểu lịch sử →
                      </button>
                      <button
                        type="button"
                        onClick={() => handleNavigateToMuseum('theo_lop')}
                        className="px-2.5 py-1.5 bg-[#FBF8F2] border border-[#2C2A26]/20 text-[11px] font-mono text-[#2C2A26] hover:border-[#A8322A] hover:text-[#A8322A] transition-colors cursor-pointer text-left"
                      >
                        2. Tra cứu theo Sáu lớp áo →
                      </button>
                      <button
                        type="button"
                        onClick={() => handleNavigateToMuseum('theo_vung')}
                        className="px-2.5 py-1.5 bg-[#FBF8F2] border border-[#2C2A26]/20 text-[11px] font-mono text-[#2C2A26] hover:border-[#A8322A] hover:text-[#A8322A] transition-colors cursor-pointer text-left"
                      >
                        3. Khám phá theo Vùng địa dư →
                      </button>
                    </div>
                  </div>
                )}

                {/* HÀNG NGUỒN: SỬ DỤNG SOURCETAG ĐỒNG BỘ */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="ml-4 mt-1 pt-1">
                    <SourceTag sourceIds={msg.sources.map((s) => s.id)} />
                  </div>
                )}

                {/* DÒNG NHẮC MẢNH NẾU CÓ NĂM/TRIỀU ĐẠI MÀ CHƯA GẮN NGUỒN */}
                {msg.canhBaoThieuNguon && (
                  <div className="ml-4 mt-1 font-mono text-[11px] text-[#6E5439] italic">
                    * Phần này chưa gắn được nguồn cụ thể, bạn nên đối chiếu thêm trong mục Luật văn hoá.
                  </div>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* ===================================================================
            KHUNG NHẬP LIỆU & NÚT DỪNG KHI ĐANG STREAM
            =================================================================== */}
        <div className="sticky bottom-4 z-20 bg-[#FBF8F2] pt-2">
          {/* NÚT DỪNG ĐỂ NGẮT GIỮA CHỪNG KHI STREAM */}
          {isStreaming && (
            <div className="flex justify-center pb-2">
              <button
                type="button"
                onClick={handleStopStreaming}
                className="px-4 py-1 bg-[#16243A] text-[#F2EDE3] font-mono text-xs uppercase tracking-wider hover:bg-[#A8322A] transition-colors cursor-pointer rounded-[1px] shadow-sm flex items-center gap-2"
              >
                <span className="w-2 h-2 bg-[#A8322A] rounded-full animate-ping" />
                <span>DỪNG TRẢ LỜI [ESC]</span>
              </button>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(inputVal);
            }}
            className="flex items-center gap-2 border border-[#2C2A26]/30 bg-[#FBF8F2] p-1.5 focus-within:border-[#A8322A] transition-colors rounded-[1px] shadow-sm"
          >
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              disabled={isStreaming}
              placeholder="Hỏi Cụ Nghệ về nguồn gốc, nếp mặc, kiêng kỵ..."
              className="flex-1 px-3 py-2 text-xs md:text-sm font-sans text-[#2C2A26] placeholder:text-[#6E5439]/60 focus:outline-none bg-transparent disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputVal.trim() || isStreaming}
              className={`px-5 py-2 font-mono text-xs uppercase tracking-wider rounded-[1px] transition-colors ${
                inputVal.trim() && !isStreaming
                  ? 'bg-[#A8322A] text-[#F2EDE3] hover:bg-[#A8322A]/90 cursor-pointer'
                  : 'bg-[#2C2A26]/10 text-[#2C2A26]/40 cursor-not-allowed'
              }`}
            >
              HỎI CỤ
            </button>
          </form>
          <div className="pt-1.5 flex flex-wrap justify-between items-center gap-x-4 gap-y-0.5 text-[10px] font-mono text-[#6E5439]">
            <span>Đối chiếu với {SOURCES.length} nguồn của Mặc Việt</span>
            <span>Lưu tối đa 20 lượt gần nhất</span>
          </div>
        </div>
      </div>

      {/* =====================================================================
          MODAL CHI TIẾT NGUỒN THƯ TỊCH (KHI BẤM VIÊN THUỐC NGUỒN)
          ===================================================================== */}
      {selectedSource && (
        <div className="fixed inset-0 z-50 bg-[#0D1826]/85 flex items-center justify-center p-4">
          <div className="bg-[#FBF8F2] border border-[#2C2A26] w-full max-w-lg p-6 flex flex-col gap-4 shadow-2xl rounded-[1px] animate-in fade-in duration-150">
            <div className="flex items-start justify-between border-b border-[#2C2A26]/15 pb-3">
              <div>
                <span className="micro-label text-[#A8322A]">
                  KHẢO CHỨNG THƯ TỊCH
                </span>
                <h3 className="font-display text-xl text-[#2C2A26] mt-0.5">
                  {selectedSource.ten}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSource(null)}
                className="font-mono text-xs text-[#2C2A26] hover:text-[#A8322A] px-2 py-1 border border-[#2C2A26]/20 cursor-pointer"
              >
                ĐÓNG [ESC]
              </button>
            </div>

            <div className="flex flex-col gap-2 font-mono text-xs text-[#2C2A26] bg-[#F2EDE3] p-4 border border-[#2C2A26]/10">
              <div>
                <strong>Tác giả:</strong> {selectedSource.tacGia}
              </div>
              <div>
                <strong>Năm ấn hành/khảo đính:</strong> {selectedSource.nam}
              </div>
              <div>
                <strong>Thể loại:</strong> {selectedSource.loai.toUpperCase()}
              </div>
            </div>

            {selectedSource.ghiChu && (
              <div className="text-xs font-sans text-[#2C2A26]/85 leading-relaxed bg-[#FBF8F2] border border-[#2C2A26]/15 p-3">
                <span className="font-mono text-[10px] text-[#6E5439] block mb-1 uppercase">
                  Ghi chú khảo cứu:
                </span>
                {selectedSource.ghiChu}
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedSource(null)}
                className="px-4 py-1.5 bg-[#16243A] text-[#F2EDE3] font-mono text-xs uppercase tracking-wider hover:bg-[#A8322A] transition-colors cursor-pointer rounded-[1px]"
              >
                ĐÃ HIỂU
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
