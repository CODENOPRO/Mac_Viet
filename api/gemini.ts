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

// Chỉ cho phép đúng hai thao tác app dùng, trên các model gemini-*. Mọi đường khác bị chặn.
const DUONG_HOP_LE = /^v1(beta)?\/models\/gemini-[a-z0-9.-]+:(generateContent|streamGenerateContent)$/;

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
  if (!DUONG_HOP_LE.test(duong)) return json({ error: 'Đường gọi không được phép.' }, 403);

  // Chỉ nhận yêu cầu từ chính trang Mặc Việt, không nhận từ trang web khác
  const nguon = req.headers.get('origin');
  if (nguon && new URL(nguon).host !== url.host) return json({ error: 'Nguồn gọi không được phép.' }, 403);

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
