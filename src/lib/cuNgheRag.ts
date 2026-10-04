import { GARMENTS } from '../data/garments';
import { MOTIFS } from '../data/motifs';
import { REGIONS } from '../data/regions';
import { EVENTS } from '../data/events';
import { CULTURE_RULES } from '../data/cultureRules';
import { SOURCES } from '../data/sources';
import { Source } from '../types';

export interface RagItem {
  id: string;
  loai: 'garment' | 'motif' | 'region' | 'event' | 'rule';
  ten: string;
  moTa: string;
  sourceIds: string[];
  score: number;
}

export interface RagResult {
  duDungNguong: boolean;
  topItems: RagItem[];
  validSources: Source[];
  contextText: string;
}

// Danh sách từ dừng tiếng Việt thông dụng cần loại bỏ khi tách từ khoá
const STOP_WORDS = new Set([
  'la', 'cua', 'va', 'co', 'duoc', 'trong', 'cac', 'mot', 'nhung', 'voi',
  'cho', 've', 'nguoi', 'nay', 'do', 'khi', 'de', 'tu', 'thi', 'ma',
  'nhu', 'ra', 'vao', 'o', 'hay', 'hoac', 'cung', 'da', 'dang', 'se',
  'con', 'lai', 'khong', 'chua', 'chang', 'gi', 'sao', 'nao', 'dau',
  'ai', 'the', 'vay', 'oi', 'a', 'nhe', 'nhi', 'giup', 'toi', 'em',
  'minh', 'ban', 'hoi', 'cu', 'nghe', 'xem', 'biet', 'giai', 'thich',
  'xin', 'duoc', 'muon', 'co_the', 'nhan', 'giua', 'khac', 'giong',
]);

// Hàm chuyển chuỗi tiếng Việt thành chữ thường không dấu
export function boDau(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

/**
 * 1. Tách từ khoá từ câu hỏi của người dùng
 * Bỏ dấu, tách theo khoảng trắng, loại từ dừng
 */
export function trichXuatTuKhoa(cauHoi: string): string[] {
  const norm = boDau(cauHoi);
  const rawWords = norm
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 2 && !STOP_WORDS.has(w));

  return Array.from(new Set(rawWords));
}

/**
 * 2 & 3. Chấm điểm mọi mục trong dữ liệu và lấy 5 mục cao điểm nhất
 */
export function chayRagCucBo(cauHoi: string): RagResult {
  const tuKhoas = trichXuatTuKhoa(cauHoi);
  const rawNormQuery = boDau(cauHoi);

  if (tuKhoas.length === 0) {
    return {
      duDungNguong: false,
      topItems: [],
      validSources: [],
      contextText: '',
    };
  }

  const items: RagItem[] = [];

  // Tính điểm khớp cho một chuỗi văn bản
  const tinhDiem = (text: string, trongSo = 1): number => {
    if (!text) return 0;
    const textNorm = boDau(text);
    let pts = 0;
    for (const kw of tuKhoas) {
      if (textNorm.includes(kw)) {
        pts += trongSo;
      }
    }
    return pts;
  };

  // Quét danh sách GARMENTS
  for (const g of GARMENTS) {
    let score = 0;
    score += tinhDiem(g.ten, 4);
    for (const tk of g.tenKhac) score += tinhDiem(tk, 3);
    score += tinhDiem(g.moTaNgan, 2);
    score += tinhDiem(g.cauChuyen, 1);
    for (const d of g.dungKhiNao) score += tinhDiem(d, 2);
    for (const kd of g.khongDungKhiNao) score += tinhDiem(kd, 2);

    // Thưởng điểm nếu có cụm từ chính xác
    if (rawNormQuery.includes(boDau(g.ten))) score += 8;

    if (score > 0) {
      items.push({
        id: g.id,
        loai: 'garment',
        ten: g.ten,
        moTa: `${g.moTaNgan}. Niên đại: ${g.nienDai}. Tên khác: ${g.tenKhac.join(', ') || 'không'}. Mặc khi: ${g.dungKhiNao.join(', ')}. Tránh khi: ${g.khongDungKhiNao.join(', ')}.`,
        sourceIds: g.sourceIds,
        score,
      });
    }
  }

  // Quét MOTIFS (Hoa văn)
  for (const m of MOTIFS) {
    let score = 0;
    score += tinhDiem(m.ten, 4);
    score += tinhDiem(m.yNghia, 2);
    if (rawNormQuery.includes(boDau(m.ten))) score += 6;

    if (score > 0) {
      items.push({
        id: m.id,
        loai: 'motif',
        ten: `Hoa văn ${m.ten}`,
        moTa: `${m.yNghia}. Tầng lớp: ${m.tangLop}.`,
        sourceIds: m.sourceIds || ['S01', 'S03'],
        score,
      });
    }
  }

  // Quét REGIONS (Vùng miền)
  for (const r of REGIONS) {
    let score = 0;
    score += tinhDiem(r.ten, 4);
    score += tinhDiem(r.dacTrung, 2);
    for (const cl of r.chatLieu) score += tinhDiem(cl, 3);
    if (rawNormQuery.includes(boDau(r.ten))) score += 6;

    if (score > 0) {
      items.push({
        id: r.id,
        loai: 'region',
        ten: `Vùng ${r.ten}`,
        moTa: `${r.dacTrung}. Chất liệu đặc trưng: ${r.chatLieu.join(', ')}.`,
        sourceIds: ['S01', 'S09', 'S10'],
        score,
      });
    }
  }

  // Quét EVENTS (Sự kiện bối cảnh)
  for (const e of EVENTS) {
    let score = 0;
    score += tinhDiem(e.ten, 4);
    if (e.moTa) score += tinhDiem(e.moTa, 2);
    score += tinhDiem(e.luuY, 2);
    if (rawNormQuery.includes(boDau(e.ten))) score += 6;

    if (score > 0) {
      items.push({
        id: e.id,
        loai: 'event',
        ten: `Sự kiện ${e.ten}`,
        moTa: `${e.moTa || ''}. Lưu ý: ${e.luuY}. Màu nên tránh: ${e.mauNenTranh.join(', ')}.`,
        sourceIds: ['S01', 'S04'],
        score,
      });
    }
  }

  // Quét CULTURE_RULES (Quy tắc văn hoá)
  for (const cr of CULTURE_RULES) {
    let score = 0;
    score += tinhDiem(cr.ten, 4);
    score += tinhDiem(cr.dieuKien, 3);
    score += tinhDiem(cr.thongDiep, 2);

    if (score > 0) {
      items.push({
        id: cr.id,
        loai: 'rule',
        ten: `Quy tắc ${cr.ten}`,
        moTa: `${cr.thongDiep}. Điều kiện: ${cr.dieuKien}.`,
        sourceIds: cr.sourceIds,
        score,
      });
    }
  }

  // Sắp xếp điểm giảm dần
  items.sort((a, b) => b.score - a.score);

  // 4. Kiểm tra ngưỡng điểm
  // Ngưỡng tối thiểu: điểm cao nhất phải >= 3 (chứng tỏ có ít nhất 1-2 từ khoá then chốt trùng)
  const maxScore = items.length > 0 ? items[0].score : 0;
  if (maxScore < 3) {
    return {
      duDungNguong: false,
      topItems: [],
      validSources: [],
      contextText: '',
    };
  }

  // Lấy tối đa 5 mục điểm cao nhất
  const topItems = items.slice(0, 5);

  // Tập hợp các nguồn thư tịch liên quan
  const sourceIdSet = new Set<string>();
  for (const it of topItems) {
    for (const sid of it.sourceIds) {
      sourceIdSet.add(sid);
    }
  }

  const validSources = SOURCES.filter((s) => sourceIdSet.has(s.id));

  // Định dạng khối DỮ LIỆU ĐÃ KIỂM DUYỆT
  const contextLines = [
    '=== DỮ LIỆU ĐÃ KIỂM DUYỆT (CHỈ ĐƯỢC DÙNG DỮ LIỆU DƯỚI ĐÂY) ===',
  ];

  topItems.forEach((it, i) => {
    contextLines.push(`${i + 1}. [${it.id}] ${it.ten}: ${it.moTa}`);
  });

  contextLines.push('\n=== NGUỒN THƯ TỊCH KHẢO CHỨNG HỢP LỆ ===');
  validSources.forEach((s) => {
    contextLines.push(
      `- [${s.id}] ${s.ten} (Tác giả: ${s.tacGia}, Năm: ${s.nam}, Thể loại: ${s.loai})`
    );
  });

  return {
    duDungNguong: true,
    topItems,
    validSources,
    contextText: contextLines.join('\n'),
  };
}

/**
 * 5. Kiểm định sau khi trả lời:
 * - Trích xuất các mã nguồn trong câu trả lời dạng [S01], [S02]
 * - Lọc bỏ các mã không tồn tại trong data/sources.ts và ghi log console
 * - Nếu không có nguồn nào mà lại có năm/triều đại thì đánh dấu cảnh báo
 */
export interface KiemDinhSauTraLoi {
  validSourceIds: string[];
  sources: Source[];
  canhBaoThieuNguon: boolean;
}

export function kiemDinhTraLoi(cauTraLoi: string): KiemDinhSauTraLoi {
  const matches = cauTraLoi.match(/\[S\d{2}\]/g) || [];
  const extractedIds = Array.from(new Set(matches.map((m) => m.replace(/[\[\]]/g, ''))));

  const validSources: Source[] = [];
  const validSourceIds: string[] = [];

  for (const sid of extractedIds) {
    const s = SOURCES.find((item) => item.id === sid);
    if (s) {
      validSources.push(s);
      validSourceIds.push(s.id);
    } else {
      console.warn(`[KIỂM ĐỊNH NGUỒN CỤ NGHỆ] Loại bỏ mã nguồn giả mạo không tồn tại: ${sid}`);
    }
  }

  // Kiểm tra xem câu trả lời có chứa con số năm hoặc tên triều đại không
  const hasYear = /\b(1[0-9]{3}|20[0-2][0-9])\b/.test(cauTraLoi);
  const hasDynasty =
    /(thế kỷ \d+|thế kỷ thứ \d+|triều lý|thời lý|triều trần|thời trần|triều lê|thời lê|lê sơ|lê trung hưng|chúa nguyễn|triều nguyễn|thời nguyễn|tây sơn|đàng trong|đàng ngoài)/i.test(
      cauTraLoi
    );

  const canhBaoThieuNguon = validSourceIds.length === 0 && (hasYear || hasDynasty);

  return {
    validSourceIds,
    sources: validSources,
    canhBaoThieuNguon,
  };
}

/**
 * Câu trả lời mẫu sâu sắc cho 4 câu hỏi định sẵn (hoạt động ngay cả khi offline / quota limit)
 */
export const CAU_HOI_GOI_Y = [
  'Áo ngũ thân và áo dài bây giờ khác nhau chỗ nào?',
  'Đi lễ chùa thì nên tránh màu gì?',
  'Khăn vấn với khăn đóng có phải một thứ không?',
  'Tôi phối sneaker với áo tấc có được không?',
] as const;

export const CAU_TRA_LOI_MAU: Record<string, { traLoi: string; sourceIds: string[] }> = {
  [CAU_HOI_GOI_Y[0]]: {
    traLoi:
      'Bạn hỏi câu này trúng ngay vào cái gốc của nghề may nước mình đấy. Áo ngũ thân xưa có năm thân vải ghép lại: bốn thân ngoài tượng trưng cho tứ thân phụ mẫu (cha mẹ mình và cha mẹ người phối ngẫu), còn thân con giấu kín bên trong che chở người mặc, nhắc nhở giữ nếp nhà thanh bạch. Cổ áo đứng thẳng, cài năm chiếc cúc bên hữu [S01]. Còn áo dài tân thời bây giờ thường chỉ có hai tà trước sau, may chiết eo ôm sát theo vóc dáng phương Tây từ phong trào cải cách thời trang thập niên 1930 [S04]. Một đằng kín đáo mực thước che chở người mặc, một đằng tôn vinh đường cong cơ thể, nhìn qua thì thấy họ hàng gần nhưng cốt cách bên trong khác nhau nhiều lắm.',
    sourceIds: ['S01', 'S04'],
  },
  [CAU_HOI_GOI_Y[1]]: {
    traLoi:
      'Chốn thiền môn là nơi người ta tìm về thanh tịnh, nên phục sức cốt ở lòng thành kính và sự khiêm nhường. Bạn nên tránh mặc những màu quá rực rỡ chói chang như đỏ chót, vàng choé hoặc phối nhiều màu đối chọi gây tán loạn vẻ tôn nghiêm [S01]. Đặc biệt tránh xa các bộ đồ may hở cổ, ngắn tay hay bó sát. Người xưa đi lễ chuộng các sắc trầm mặc như màu lam khói, màu nâu sồng của đất, hoặc sắc ngà và the đen [S11]. Vải vóc nền nã, đường kim kín đáo thì tâm mới tĩnh được bạn ạ.',
    sourceIds: ['S01', 'S11'],
  },
  [CAU_HOI_GOI_Y[2]]: {
    traLoi:
      'Nhiều bạn trẻ bây giờ hay gọi lẫn, nhưng thật ra là hai lối phục sức khác nhau đấy. Khăn vấn là dải vải the hoặc nhung dài, bọc lấy nếp tóc rồi quấn từng vòng quanh đầu một cách thủ công. Mỗi lần vấn là một lần người mặc tự tay nắn nếp, vành khăn ôm mềm mại và tôn lên khuôn mặt [S01]. Còn khăn đóng, hay còn gọi là khăn xếp, là loại may sẵn trên cốt cứng định hình với các nếp xếp đều chằn chặn, xuất hiện phổ biến vào cuối triều Nguyễn và đầu thế kỷ 20 để tiện đội nhanh [S04]. Khăn vấn thì có hồn của sự thủ công mềm mại, còn khăn đóng thì tề chỉnh, nghiêm trang của sự điển chế.',
    sourceIds: ['S01', 'S04'],
  },
  [CAU_HOI_GOI_Y[3]]: {
    traLoi:
      'Áo tấc vốn là lễ phục tay thụng buông dài rộng rãi một tấc, dùng trong các đại lễ tôn nghiêm như tế tự gia tiên hay cưới hỏi [S01]. Giày sneaker là biểu tượng của sự năng động, bước nhanh trên phố xá hiện đại. Hai thứ này nếu đem ghép vào nhau ở chốn thờ tự hay nghi lễ gia đình thì chẳng khác nào người đang nghiêm cẩn thắp hương mà chân lại muốn chạy đua, làm giảm đi vẻ uy nghiêm mực thước [S03]. Nếu bạn đi dạo phố, chụp ảnh phong cách thể nghiệm đường phố thì có thể coi là một sáng tạo trẻ trung, nhưng khi vào chốn lễ nghi thì một đôi hài thêu hay guốc mộc mộc mạc mới là mảnh ghép trọn vẹn nhất.',
    sourceIds: ['S01', 'S03'],
  },
};
