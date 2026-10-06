// Hàm trung gian Gemini chạy trên máy chủ Vercel.
//
// Khoá GEMINI_API_KEY chỉ nằm ở đây, đọc từ phần cài đặt Environment Variables của Vercel,
// không bao giờ đi xuống trình duyệt. Trình duyệt gọi /api/gemini/<đường của Google>,
// vercel.json chuyển thành /api/gemini?duong=<đường>, hàm này thay khoá giả bằng khoá thật rồi chuyển tiếp.
//
// GET  /api/gemini                → { coKhoa: boolean } để app biết đã cấu hình khoá chưa
// POST /api/gemini/v1beta/models/gemini-*:generateContent         → chuyển tiếp
// POST /api/gemini/v1beta/models/gemini-*:streamGenerateContent   → chuyển tiếp dạng stream

const GOOGLE = 'https://generativelanguage.googleapis.com';

// Chỉ cho phép đúng hai thao tác app dùng, trên đúng các model app dùng. Mọi đường khác bị chặn,
// để không ai mượn khoá này gọi model đắt hơn.
const MODEL_CHO_PHEP = ['gemini-3.8-flash', 'gemini-3.1-flash-image', 'gemini-3.1-flash-lite-image'];
const DUONG_HOP_LE = /^v1(beta)?\/models\/([a-z0-9.-]+):(generateContent|streamGenerateContent)$/;
const MODEL_ANH = /-image$/;

// Giới hạn số lần gọi theo địa chỉ IP. Bộ đếm nằm trong bộ nhớ của từng máy chủ Vercel nên chỉ là
// lớp chặn cơ bản; muốn chặn tuyệt đối thì đặt thêm hạn mức chi tiêu ở Google AI Studio.
const CUA_SO_MS = 10 * 60 * 1000;
const TOI_DA_LUOT_CHU = 60; // lời gọi chữ trong 10 phút
const TOI_DA_LUOT_ANH = 12; // lời gọi ảnh trong 10 phút
const demLuot = new Map<string, number[]>();

function vuotHanMuc(khoa: string, toiDa: number): boolean {
  const bayGio = Date.now();
  const cacLan = (demLuot.get(khoa) || []).filter((t) => bayGio - t < CUA_SO_MS);
  const vuot = cacLan.length >= toiDa;
  if (!vuot) cacLan.push(bayGio);
  demLuot.set(khoa, cacLan);
  // Dọn bớt khi bảng đếm phình to
  if (demLuot.size > 5000) {
    for (const [k, v] of demLuot) if (!v.some((t) => bayGio - t < CUA_SO_MS)) demLuot.delete(k);
  }
  return vuot;
}

// Ảnh người dùng đã thu về cạnh dài 1024px, cộng ảnh hiện vật tham chiếu, vẫn dưới mức này
const TOI_DA_BYTE = 4_000_000;

const json = (du: unknown, status = 200) =>
  new Response(JSON.stringify(du), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

export async function GET(): Promise<Response> {
  return json({ coKhoa: Boolean(process.env.GEMINI_API_KEY) });
}

export async function POST(req: Request): Promise<Response> {
  const khoa = process.env.GEMINI_API_KEY;
  if (!khoa) return json({ error: 'Chưa cấu hình GEMINI_API_KEY trên Vercel.' }, 503);

  const url = new URL(req.url);
  const duong = url.searchParams.get('duong') || '';
  const khop = duong.match(DUONG_HOP_LE);
  if (!khop || !MODEL_CHO_PHEP.includes(khop[2])) return json({ error: 'Đường gọi không được phép.' }, 403);

  // Chỉ nhận yêu cầu từ chính trang Mặc Việt. Trình duyệt luôn gửi Origin khi POST,
  // nên yêu cầu thiếu cả Origin lẫn Referer là gọi thẳng từ ngoài trình duyệt: chặn.
  const nguon = req.headers.get('origin') || req.headers.get('referer');
  let hostNguon = '';
  try {
    hostNguon = nguon ? new URL(nguon).host : '';
  } catch {
    hostNguon = '';
  }
  if (hostNguon !== url.host) return json({ error: 'Nguồn gọi không được phép.' }, 403);

  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'khong-ro';
  const laAnh = MODEL_ANH.test(khop[2]);
  if (vuotHanMuc(`${ip}:${laAnh ? 'anh' : 'chu'}`, laAnh ? TOI_DA_LUOT_ANH : TOI_DA_LUOT_CHU)) {
    // Trả đúng dạng lỗi của Google để app nhận ra là hết hạn mức (mã 429)
    return json(
      { error: { code: 429, status: 'RESOURCE_EXHAUSTED', message: 'Gọi quá nhiều trong ít phút, thử lại sau.' } },
      429
    );
  }

  const than = await req.arrayBuffer();
  if (than.byteLength > TOI_DA_BYTE) return json({ error: 'Yêu cầu quá lớn.' }, 413);

  const thamSo = new URLSearchParams(url.search);
  thamSo.delete('duong');
  const chuoiThamSo = thamSo.toString();

  const traVe = await fetch(`${GOOGLE}/${duong}${chuoiThamSo ? `?${chuoiThamSo}` : ''}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': khoa },
    body: than,
  });

  // Chuyển nguyên luồng trả về, giữ được dạng stream cho Cụ Nghệ
  return new Response(traVe.body, {
    status: traVe.status,
    headers: {
      'content-type': traVe.headers.get('content-type') || 'application/json',
      'cache-control': 'no-store',
    },
  });
}
