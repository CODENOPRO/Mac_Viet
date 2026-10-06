import { Type, Schema } from '@google/genai';
import { GARMENTS } from '../data/garments';
import { SOURCES } from '../data/sources';
import { TRADITIONAL_COLORS } from '../data/palettes';
import { boMaNoiBoSau } from './boMaNoiBo';
import { taoAi, aiSanSang, coKhoaTrucTiep } from './aiClient';
import { LookState, EventContext, CultureFlag } from '../types';
import { ketLuanSoSanh } from './diemSo';
import { layVaiTro } from '../data/boiCanhSuKien';

// =============================================================================
// 1. CẤU HÌNH API KEY VÀ KHỞI TẠO SDK @google/genai
// =============================================================================
// Khoá không còn được đọc ở đây. Xem lib/aiClient.ts: gọi thẳng khi có khoá lúc build (AI Studio, máy dev),
// gọi qua hàm trung gian api/gemini.ts khi chạy trên Vercel.
const ai = taoAi();

// =============================================================================
// 2. ĐO ĐẠC STATS & TRẠNG THÁI KẾT NỐI
// =============================================================================
export interface GeminiStats {
  soLanGoi: number;
  soLanTrungCache: number;
  soLanLoi: number;
  soLanDuPhong: number;
  tongThoiGianChoMs: number;
  lanCuoiTrangThai: 'ready' | 'cached' | 'fallback';
}

export const geminiStats: GeminiStats = {
  soLanGoi: 0,
  soLanTrungCache: 0,
  soLanLoi: 0,
  soLanDuPhong: 0,
  tongThoiGianChoMs: 0,
  lanCuoiTrangThai: coKhoaTrucTiep ? 'ready' : 'fallback',
};

// Bản Vercel: hỏi máy chủ đã có khoá chưa để chấm trạng thái hiện đúng
if (ai && !coKhoaTrucTiep) {
  void aiSanSang().then((ok) => {
    geminiStats.lanCuoiTrangThai = ok ? 'ready' : 'fallback';
  });
}

export function getGeminiConnectionStatus(): 'ready' | 'cached' | 'fallback' {
  if (isDemoMode()) return 'cached';
  if (!ai) return 'fallback';
  return geminiStats.lanCuoiTrangThai;
}

// =============================================================================
// 3. SYSTEM INSTRUCTION DÙNG CHUNG CHO CẢ SÁU HÀM
// =============================================================================
export const SYSTEM_INSTRUCTION_SHARED =
  `Bạn là trợ lý tra cứu và diễn giải văn hoá trang phục Việt Nam, làm việc cho ứng dụng Mặc Việt.\n` +
  `Bạn CHỈ được dùng dữ liệu nằm trong phần DỮ LIỆU ĐÃ KIỂM DUYỆT của prompt. Bạn KHÔNG được dùng kiến thức tự nhớ để bổ sung dữ kiện lịch sử, niên đại, tên gọi hay quy định lễ nghi.\n` +
  `Nếu dữ liệu không đủ để trả lời, bạn điền 'chua_xac_dinh' và nói rõ là chưa xác định. Không suy đoán, không điền cho đủ chỗ trống.\n` +
  `Mọi mệnh đề lịch sử bạn viết ra đều phải kèm source_id lấy từ dữ liệu được cung cấp.\n` +
  `Bạn không dùng từ 'sai' khi nói về lựa chọn của người dùng. Bạn dùng ba mức: do, vang, xanh. Mỗi cảnh báo phải kèm lý do và ít nhất một cách sửa.\n` +
  `Bạn không so sánh trang phục Việt Nam với trang phục nước khác theo hướng hơn thua hay tranh chấp nguồn gốc.\n` +
  `Với trang phục các dân tộc thiểu số, bạn luôn mô tả như một chỉnh thể có chủ thể, không tách món lẻ ra làm phụ kiện thời trang.\n` +
  `Giọng văn: tiếng Việt, gần gũi, đúng mực, không hàn lâm, không lên giọng dạy dỗ. Tránh từ Hán Việt nặng khi có từ thuần Việt tương đương.`;

// =============================================================================
// 4. KIỂM ĐỊNH ĐẦU RA SOURCE_ID VÀ BỘ NHỚ ĐỆM (CACHE)
// =============================================================================
const VALID_SOURCE_IDS = new Set(SOURCES.map((s) => s.id));

export function locSourceIdsHopLe(sourceIds: any): string[] {
  if (!Array.isArray(sourceIds)) return [];
  const hopLe: string[] = [];
  for (const sid of sourceIds) {
    if (typeof sid === 'string' && VALID_SOURCE_IDS.has(sid)) {
      hopLe.push(sid);
    } else {
      console.warn(`[GEMINI BẢO VỆ NGUỒN] Loại bỏ source_id không tồn tại trong data/sources.ts: "${sid}"`);
    }
  }
  return hopLe;
}

function hashDonGian(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return 'mv_' + Math.abs(hash).toString(36);
}

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 ngày

function docCache<T>(cacheKey: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const item = localStorage.getItem(cacheKey);
    if (!item) return null;
    const { data, timestamp } = JSON.parse(item);
    if (Date.now() - timestamp > CACHE_TTL_MS) {
      localStorage.removeItem(cacheKey);
      return null;
    }
    return data as T;
  } catch {
    return null;
  }
}

function ghiCache<T>(cacheKey: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      cacheKey,
      JSON.stringify({ data, timestamp: Date.now() })
    );
  } catch {
    // ignore quota errors
  }
}

function isDemoMode(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('demo') === '1';
}

// =============================================================================
// 5. LỚP BỌC goiModel() QUẢN LÝ CACHE, RETRY, TIMEOUT VÀ DỰ PHÒNG
// =============================================================================
// Mọi kết quả trả cho giao diện, kể cả kết quả đã lưu đệm từ trước, đều được bỏ mã nội bộ như [S01]
async function goiModel<T>(params: Parameters<typeof goiModelGoc<T>>[0]): Promise<T> {
  return boMaNoiBoSau(await goiModelGoc<T>(params));
}

async function goiModelGoc<T>(params: {
  tenHam: string;
  dauVao: any;
  modelName?: string;
  systemInstruction: string;
  prompt: string;
  temperature?: number;
  responseSchema?: Schema;
  duPhong: () => T;
}): Promise<T> {
  const {
    tenHam,
    dauVao,
    modelName = 'gemini-3.8-flash',
    systemInstruction,
    prompt,
    temperature = 0.7,
    responseSchema,
    duPhong,
  } = params;

  geminiStats.soLanGoi++;

  // 1. Chế độ Demo: mọi hàm bám đúng món đang xem, nên dùng đường dự phòng đọc từ dữ liệu
  //    thay vì một kết quả soạn sẵn cố định cho mọi đầu vào.
  if (isDemoMode()) {
    geminiStats.soLanTrungCache++;
    geminiStats.lanCuoiTrangThai = 'cached';
    return duPhong();
  }

  // 2. Đọc Cache 7 ngày
  const cacheKey = hashDonGian(tenHam + JSON.stringify(dauVao));
  const cachedResult = docCache<T>(cacheKey);
  if (cachedResult) {
    geminiStats.soLanTrungCache++;
    geminiStats.lanCuoiTrangThai = 'cached';
    return cachedResult;
  }

  // Nếu không có API Key, hoặc máy chủ Vercel chưa cấu hình khoá, chuyển ngay sang đường dự phòng
  if (!ai || !(await aiSanSang())) {
    geminiStats.soLanDuPhong++;
    geminiStats.lanCuoiTrangThai = 'fallback';
    return duPhong();
  }

  const startTime = Date.now();

  // 3. Gọi model kèm timeout 12s và tối đa 1 lần thử lại
  const callWithTimeout = async (retryPromptAddition = ''): Promise<T> => {
    const finalPrompt = retryPromptAddition
      ? `${prompt}\n\n${retryPromptAddition}`
      : prompt;

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT_12S')), 12000)
    );

    const apiCallPromise = (async () => {
      const config: any = {
        temperature,
        systemInstruction,
      };

      if (responseSchema) {
        config.responseMimeType = 'application/json';
        config.responseSchema = responseSchema;
      }

      const response = await ai.models.generateContent({
        model: modelName,
        contents: finalPrompt,
        config,
      });

      const text = response.text || '';
      if (responseSchema) {
        return JSON.parse(text) as T;
      }
      return text as unknown as T;
    })();

    return Promise.race([apiCallPromise, timeoutPromise]);
  };

  try {
    let result: T;
    try {
      result = await callWithTimeout();
    } catch (firstErr) {
      console.warn(`[GEMINI LẦN 1 LỖI] Thử lại lần 2 cho hàm ${tenHam}:`, firstErr);
      result = await callWithTimeout(
        'Lần trước bạn trả về sai định dạng. Trả đúng schema, chỉ JSON, không thêm chữ nào khác.'
      );
    }

    const waitTime = Date.now() - startTime;
    geminiStats.tongThoiGianChoMs += waitTime;
    geminiStats.lanCuoiTrangThai = 'ready';

    // Lưu vào cache
    ghiCache(cacheKey, result);
    return result;
  } catch (finalErr) {
    console.error(`[GEMINI THẤT BẠI] Chuyển về phương án dự phòng cục bộ cho ${tenHam}:`, finalErr);
    geminiStats.soLanLoi++;
    geminiStats.soLanDuPhong++;
    geminiStats.lanCuoiTrangThai = 'fallback';
    return duPhong();
  }
}

// =============================================================================
// [1] EXPLAIN GARMENT: CÂU CHUYỆN CỦA MỘT HIỆN VẬT
// =============================================================================
export interface ExplainGarmentResponse {
  cauChuyen: string;
  nienDaiNoiBat: string;
  aiTungMac: string;
  yNghiaHoaVan: string;
  sourceIds: string[];
  doChacChan: string;
}

export async function explainGarment(
  garmentId: string
): Promise<ExplainGarmentResponse> {
  const g = GARMENTS.find((item) => item.id === garmentId) || GARMENTS[0];
  const relatedSources = SOURCES.filter((s) => g.sourceIds.includes(s.id));

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      cauChuyen: { type: Type.STRING },
      nienDaiNoiBat: { type: Type.STRING },
      aiTungMac: { type: Type.STRING },
      yNghiaHoaVan: { type: Type.STRING },
      sourceIds: { type: Type.ARRAY, items: { type: Type.STRING } },
      doChacChan: { type: Type.STRING },
    },
    required: [
      'cauChuyen',
      'nienDaiNoiBat',
      'aiTungMac',
      'yNghiaHoaVan',
      'sourceIds',
      'doChacChan',
    ],
  };

  const prompt =
    `=== DỮ LIỆU ĐÃ KIỂM DUYỆT CỦA HIỆN VẬT ===\n` +
    `${JSON.stringify({ ...g, sources: relatedSources })}\n\n` +
    `=== NHIỆM VỤ ===\n` +
    `Kể câu chuyện về hiện vật "${g.ten}".\n\n` +
    `=== RÀNG BUỘC ===\n` +
    `- Trường cauChuyen dài 120 tới 150 từ, giàu cảm xúc, không hàn lâm.\n` +
    `- KHÔNG bổ sung dữ kiện lịch sử ngoài object được cung cấp.\n` +
    `- Mọi sourceIds phải lấy từ: ${JSON.stringify(g.sourceIds)}.`;

  const fallback = (): ExplainGarmentResponse => ({
    cauChuyen: g.cauChuyen,
    nienDaiNoiBat: g.nienDai,
    aiTungMac: g.dungKhiNao.join(', '),
    yNghiaHoaVan: 'Hoa văn thanh nhã theo quy thức cổ truyền.',
    sourceIds: g.sourceIds,
    doChacChan: g.doChacChan,
  });

  const res = await goiModel<ExplainGarmentResponse>({
    tenHam: 'explainGarment',
    dauVao: { garmentId },
    systemInstruction: SYSTEM_INSTRUCTION_SHARED,
    prompt,
    temperature: 0.3,
    responseSchema: schema,
    duPhong: fallback,
  });

  res.sourceIds = locSourceIdsHopLe(res.sourceIds);
  return res;
}

// =============================================================================
// [2] CULTURE CHECK: DIỄN GIẢI CỜ VĂN HOÁ
// =============================================================================
export interface CultureCheckDienGiai {
  ruleId: string;
  thongDiepDeHieu: string;
  boiCanhLichSu: string;
  sourceIds: string[];
}

export interface CultureCheckResponse {
  dienGiai: CultureCheckDienGiai[];
  cachSuaThem: { moTa: string; doUuTien: number }[];
}

export async function cultureCheck(
  look: LookState,
  boiCanh: EventContext,
  ketQuaRuleEngine: CultureFlag
): Promise<CultureCheckResponse> {
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      dienGiai: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            ruleId: { type: Type.STRING },
            thongDiepDeHieu: { type: Type.STRING },
            boiCanhLichSu: { type: Type.STRING },
            sourceIds: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['ruleId', 'thongDiepDeHieu', 'boiCanhLichSu', 'sourceIds'],
        },
      },
      cachSuaThem: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            moTa: { type: Type.STRING },
            doUuTien: { type: Type.INTEGER },
          },
          required: ['moTa', 'doUuTien'],
        },
      },
    },
    required: ['dienGiai', 'cachSuaThem'],
  };

  const prompt =
    `=== CÁC LUẬT ĐÃ BẮN TỪ ENGINE CỤC BỘ ===\n` +
    `${JSON.stringify(ketQuaRuleEngine.luatViPham.map((l) => l.rule))}\n\n` +
    `=== BỐI CẢNH VÀ TRANG PHỤC ĐANG PHỐI ===\n` +
    `Sự kiện: ${boiCanh.ten} (Trang trọng: ${boiCanh.mucTrangTrongYeuCau}/5)\n` +
    `Vai của người dùng trong dịp: ${boiCanh.vaiTro ? layVaiTro(boiCanh.id, boiCanh.vaiTro).label : 'chưa nêu'}\n` +
    `Thượng y: ${look.thuongY?.ten || 'chưa chọn'}\n` +
    `Hạ y: ${look.haY?.ten || 'chưa chọn'}\n` +
    `Thủ phục: ${look.thuPhuc?.ten || 'chưa chọn'}\n` +
    `Màu chính: ${look.mauChinh}\n\n` +
    `=== NHIỆM VỤ ===\n` +
    `KHÔNG phán xét mức độ mới (mức độ đã do Engine quyết). Viết lại thông điệp cho dễ hiểu, thêm ngữ cảnh lịch sử TỪ dữ liệu đưa vào, và gợi ý thêm tối đa 2 cách sửa.\n` +
    `RÀNG BUỘC: ruleId phải nằm trong danh sách luật đã bắn.`;

  const fallback = (): CultureCheckResponse => ({
    dienGiai: ketQuaRuleEngine.luatViPham.map((l) => ({
      ruleId: l.rule.id,
      thongDiepDeHieu: l.rule.thongDiep,
      boiCanhLichSu: `Quy chuẩn ghi chép tại các tư liệu lịch sử: ${l.rule.sourceIds.join(', ')}.`,
      sourceIds: l.rule.sourceIds,
    })),
    cachSuaThem: ketQuaRuleEngine.luatViPham.flatMap((l) =>
      l.rule.cachSua.map((cs, idx) => ({ moTa: cs.moTa, doUuTien: idx + 1 }))
    ),
  });

  const res = await goiModel<CultureCheckResponse>({
    tenHam: 'cultureCheck',
    dauVao: {
      lookSummary: {
        top: look.thuongY?.id,
        bottom: look.haY?.id,
        color: look.mauChinh,
      },
      flagIds: ketQuaRuleEngine.luatViPham.map((l) => l.rule.id),
      eventId: boiCanh.id,
      // Cùng bộ đồ, cùng dịp nhưng khác vai thì lời giải thích khác, không dùng lại bản đệm
      vaiTro: boiCanh.vaiTro,
    },
    systemInstruction: SYSTEM_INSTRUCTION_SHARED,
    prompt,
    temperature: 0.2,
    responseSchema: schema,
    duPhong: fallback,
  });

  if (res?.dienGiai) {
    res.dienGiai.forEach((dg) => {
      dg.sourceIds = locSourceIdsHopLe(dg.sourceIds);
    });
  }

  return res;
}

// =============================================================================
// [3] NAME AND CAPTION: TÊN LOOK VÀ CAPTION CHIA SẺ
// =============================================================================
export interface NameAndCaptionResult {
  tenLook: string;
  captionNgan: string;
  captionDai: string;
  hashtags: string[];
}

export async function nameAndCaption(
  look: LookState
): Promise<NameAndCaptionResult> {
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      tenLook: { type: Type.STRING },
      captionNgan: { type: Type.STRING },
      captionDai: { type: Type.STRING },
      hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: ['tenLook', 'captionNgan', 'captionDai', 'hashtags'],
  };

  const mainColorObj = TRADITIONAL_COLORS.find(
    (c) => c.hex.toLowerCase() === look.mauChinh?.toLowerCase()
  );
  const colorName = mainColorObj?.ten || 'Chàm';

  const prompt =
    `=== THÔNG TIN PHỐI TRANG ===\n` +
    `Thượng y: ${look.thuongY?.ten || 'Áo ngũ thân'}\n` +
    `Hạ y: ${look.haY?.ten || 'Quần lụa'}\n` +
    `Mũ khăn: ${look.thuPhuc?.ten || 'Khăn vấn'}\n` +
    `Sắc màu chính: ${colorName} (${look.mauChinh})\n\n` +
    `=== YÊU CẦU ===\n` +
    `- tenLook: từ 2 tới 4 chữ tiếng Việt giàu hình ảnh gợi nhớ, không sáo mòn (ví dụ: "Chàm Phố Đoan Trang", "Lục Biếc Du Xuân").\n` +
    `- captionNgan: 1 câu tinh đọng chia sẻ mạng xã hội.\n` +
    `- captionDai: 2 tới 3 câu kể câu chuyện nếp áo thanh tao của người trẻ.\n` +
    `- hashtags: mảng hashtag tiếng Việt không dấu (ví dụ: ["macviet", "vietphuc"]).\n` +
    `- CẤM EMOJI trong mọi trường.`;

  const tenAo = (look.thuongY?.ten || 'Việt phục').replace(/^Áo /, '');
  const fallback = (): NameAndCaptionResult => ({
    tenLook: `${colorName}, ${tenAo.toLowerCase()}`,
    captionNgan: `Tà áo ${tenAo.toLowerCase()} sắc ${colorName.toLowerCase()}, mặc theo cách của người trẻ hôm nay.`,
    captionDai: `Một sớm bình yên cùng tà áo truyền thống mang sắc ${colorName}. Giữ gìn nếp mặc cổ truyền là cách người trẻ kết nối với cội nguồn văn hóa thiêng liêng.`,
    hashtags: ['macviet', 'vietphuc', 'cotruyen', 'diendoantrang'],
  });

  return goiModel<NameAndCaptionResult>({
    tenHam: 'nameAndCaption',
    dauVao: {
      top: look.thuongY?.id,
      bottom: look.haY?.id,
      color: look.mauChinh,
    },
    systemInstruction: SYSTEM_INSTRUCTION_SHARED,
    prompt,
    temperature: 0.95,
    responseSchema: schema,
    duPhong: fallback,
  });
}

// =============================================================================
// [4] SO SÁNH LOOK: SO SÁNH CÁC PHƯƠNG ÁN PHỐI
// =============================================================================
export interface LookComparisonInput {
  id: string;
  ten: string;
  thuongYTen: string;
  haYTen: string;
  thuPhucTen: string;
  haiTen: string;
  phuKienTen: string;
  mauChinhTen: string;
  scoreMau: number;
  scoreBoiCanh: number;
  scoreVanHoa: number;
  coVanHoaMucDo: 'do' | 'vang' | 'xanh';
  mucTrangTrong: number;
  hopThoiTiet: string;
}

export interface SoSanhLookResponse {
  lookTotNhat: string;
  lyDo: string;
  khiNaoChonCaiKia: string;
}

export async function soSanhLook(
  looks: LookComparisonInput[],
  boiCanh: EventContext
): Promise<SoSanhLookResponse> {
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      lookTotNhat: { type: Type.STRING },
      lyDo: { type: Type.STRING },
      khiNaoChonCaiKia: { type: Type.STRING },
    },
    required: ['lookTotNhat', 'lyDo', 'khiNaoChonCaiKia'],
  };

  // Dự phòng: chọn look có tổng điểm cao nhất
  // Dự phòng: chỉ nói điều suy ra được từ ba điểm số (xem lib/diemSo.ts)
  const fallback = (): SoSanhLookResponse => ketLuanSoSanh(looks);

  const looksDescription = looks.map((l, idx) => (
    `[PHƯƠNG ÁN ${idx + 1}: ${l.ten}]\n` +
    `- Thượng y: ${l.thuongYTen}\n` +
    `- Hạ y: ${l.haYTen} | Mũ/khăn: ${l.thuPhucTen} | Hài: ${l.haiTen}\n` +
    `- Màu chính: ${l.mauChinhTen}\n` +
    `- Điểm hài hòa màu: ${l.scoreMau}/100\n` +
    `- Điểm hợp bối cảnh: ${l.scoreBoiCanh}/100\n` +
    `- Điểm cờ văn hóa: ${l.scoreVanHoa}/100 (Mức ${l.coVanHoaMucDo.toUpperCase()})\n` +
    `- Mức trang trọng: ${l.mucTrangTrong}/5 (Yêu cầu sự kiện: ${boiCanh.mucTrangTrongYeuCau}/5)\n` +
    `- Thời tiết: ${l.hopThoiTiet}`
  )).join('\n\n');

  const prompt =
    `=== BỐI CẢNH SỰ KIỆN ===\n` +
    `Sự kiện: ${boiCanh.ten}\n` +
    `Mức trang trọng yêu cầu: ${boiCanh.mucTrangTrongYeuCau}/5\n` +
    `Lưu ý bối cảnh: ${boiCanh.luuY || 'Không'}\n\n` +
    `=== CÁC PHƯƠNG ÁN SO SÁNH ===\n` +
    `${looksDescription}\n\n` +
    `=== NHIỆM VỤ ===\n` +
    `Phân tích khách quan các phương án phối dựa trên dữ liệu định lượng.\n` +
    `RÀNG BUỘC BẮT BUỘC:\n` +
    `1. Trả về đúng schema JSON.\n` +
    `2. lookTotNhat: Tên chính xác của phương án tốt nhất.\n` +
    `3. lyDo: Viết 2 đến 3 câu giải thích rõ ràng TẠI SAO nên chọn phương án đó. BẮT BUỘC PHẢI NHẮC TỚI ÍT NHẤT MỘT CON SỐ CỤ THỂ (điểm số hoặc mức trang trọng) trong câu trả lời. Tuyệt đối KHÔNG đánh giá thẩm mỹ cá nhân cảm tính; chỉ tập trung vào độ hợp bối cảnh, sự hài hòa màu sắc và cờ văn hóa.\n` +
    `4. khiNaoChonCaiKia: 1 câu gợi ý rõ ràng khi nào hoặc trong tình huống nào thì người dùng có thể cân nhắc chọn phương án còn lại.\n` +
    `5. CẤM EMOJI.`;

  return goiModel<SoSanhLookResponse>({
    tenHam: 'soSanhLook',
    dauVao: {
      looksCount: looks.length,
      event: boiCanh.id,
      looks: looks.map((l) => ({ id: l.id, top: l.thuongYTen, score: l.scoreMau })),
    },
    systemInstruction: SYSTEM_INSTRUCTION_SHARED,
    prompt,
    temperature: 0.4,
    responseSchema: schema,
    duPhong: fallback,
  });
}

// =============================================================================
// 9. CỤ NGHỆ STREAMING CHAT (HỎI ĐÁP NGHỆ NHÂN MAY ĐO CỔ TRUYỀN)
// =============================================================================
export const SYSTEM_INSTRUCTION_CU_NGHE =
  `Bạn là Cụ Nghệ, một nghệ nhân may đo cổ truyền lớn tuổi tại Việt Nam, cả đời gắn bó với thước đo, cây kéo và nếp vải di sản.\n` +
  `Tính cách: Nói năng chậm rãi, khiêm tốn, thân tình, hay lấy ví dụ từ đường kim mũi chỉ và nếp sống đời thường. Tuyệt đối không lên lớp, không phán xét, không dạy đời.\n` +
  `Ngôn ngữ: Tiếng Việt trong sáng, mộc mạc. Không dùng từ Hán Việt nặng nề khi có từ thuần Việt tương đương.\n` +
  `RÀNG BUỘC CHỐNG BỊA ĐẶT (QUAN TRỌNG NHẤT):\n` +
  `1. Bạn CHỈ ĐƯỢC PHÉP dùng các thông tin lịch sử, niên đại, hiện vật và quy tắc có trong phần "DỮ LIỆU ĐÃ KIỂM DUYỆT".\n` +
  `2. Mọi dữ kiện trích dẫn phải kèm mã nguồn trong ngoặc vuông (ví dụ: [S01], [S04]) nằm trong danh sách nguồn hợp lệ.\n` +
  `3. Tuyệt đối KHÔNG tự sáng tác thêm nguồn, không tự nhớ thêm năm hay triều đại không có trong dữ liệu.\n` +
  `4. CẤM EMOJI. CẤM dấu gạch ngang dài trong câu (dùng dấu phẩy hoặc hai chấm).\n` +
  `5. Độ dài vừa phải, khoảng 120 đến 180 từ, súc tích và ấm áp.`;

export async function streamCuNgheTraLoi({
  cauHoi,
  contextText,
  lichSu,
  onChunk,
  abortSignal,
  fallbackText,
  mucLienQuan = [],
}: {
  cauHoi: string;
  contextText: string;
  lichSu: Array<{ role: 'user' | 'model'; text: string }>;
  onChunk: (chunk: string) => void;
  abortSignal?: AbortSignal;
  fallbackText?: string;
  /** Các mục kho dữ liệu khớp câu hỏi, dùng để trả lời trung thực khi chưa có AI */
  mucLienQuan?: Array<{ ten: string; moTa: string }>;
}): Promise<string> {
  let fullResponse = '';

  // Hàm mô phỏng stream mượt mà khi offline hoặc model lỗi
  const runSimulatedStream = async (text: string) => {
    const words = text.split(' ');
    for (let i = 0; i < words.length; i++) {
      if (abortSignal?.aborted) break;
      const part = (i === 0 ? '' : ' ') + words[i];
      fullResponse += part;
      onChunk(part);
      await new Promise((r) => setTimeout(r, 22));
    }
    return fullResponse;
  };

  // 1. Kiểm tra nếu có API key và không ở chế độ demo
  if (ai && !isDemoMode() && (await aiSanSang())) {
    try {
      const contents: any[] = [];

      // Đưa tối đa 6 lượt gần nhất vào ngữ cảnh đối thoại
      for (const turn of lichSu) {
        contents.push({
          role: turn.role,
          parts: [{ text: turn.text }],
        });
      }

      // Lượt hiện tại kèm khối dữ liệu đã kiểm duyệt từ RAG cục bộ
      contents.push({
        role: 'user',
        parts: [
          {
            text: `${contextText}\n\n=== CÂU HỎI CỦA NGƯỜI TRẺ ===\n${cauHoi}`,
          },
        ],
      });

      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION_CU_NGHE,
          temperature: 0.5,
        },
      });

      for await (const chunk of responseStream) {
        if (abortSignal?.aborted) {
          break;
        }
        const chunkText = chunk.text;
        if (chunkText) {
          fullResponse += chunkText;
          onChunk(chunkText);
        }
      }

      if (fullResponse.trim()) {
        return fullResponse;
      }
    } catch (err) {
      console.warn('[Cụ Nghệ Stream API lỗi, kích hoạt luồng trả lời tri thức cục bộ]:', err);
    }
  }

  // 2. Chưa có AI: câu gợi ý thì dùng lời đáp mẫu viết từ dữ liệu; câu tự do thì đọc thẳng các mục khớp trong kho
  //    và nói rõ là chưa trò chuyện tự do được. Không trả lời chung chung, không gắn nguồn cho câu không có nội dung.
  const docTuKho =
    mucLienQuan.length > 0
      ? 'Tôi chưa được kết nối để trò chuyện tự do, nên chỉ đọc cho bạn những gì kho của Mặc Việt có liên quan tới câu hỏi. ' +
        mucLienQuan
          .slice(0, 2)
          .map((m) => `${m.ten}: ${m.moTa}`)
          .join(' ')
      : 'Tôi chưa được kết nối để trò chuyện tự do, và kho của Mặc Việt chưa có mục nào khớp với câu hỏi này, nên tôi xin không đoán.';
  const defaultFallback = fallbackText || docTuKho;

  return runSimulatedStream(defaultFallback);
}
