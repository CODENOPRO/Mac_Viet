import { GoogleGenAI } from '@google/genai';

// Khởi tạo Gemini dùng chung cho gemini.ts và tryOn.ts.
//
// Hai chế độ:
// 1. Có khoá trực tiếp lúc build (AI Studio tự cấp, hoặc máy dev có file .env): gọi thẳng Google.
// 2. Bản trên Vercel: KHÔNG BAO GIỜ nhúng khoá vào mã trình duyệt. Trình duyệt gọi hàm trung gian
//    api/gemini.ts trên máy chủ Vercel, hàm đó mới đọc khoá GEMINI_API_KEY trong phần cài đặt Vercel.
//    vite.config.ts bật chế độ này khi build trên Vercel và để trống khoá trực tiếp.
//
// Không đọc biến VITE_GEMINI_API_KEY: Vite nhúng mọi biến VITE_ vào mã trình duyệt, ai mở trang cũng đọc được.

declare const __GEMINI_QUA_PROXY__: boolean;

const khoaTrucTiep: string =
  typeof process !== 'undefined' && process.env?.GEMINI_API_KEY ? process.env.GEMINI_API_KEY : '';

export const QUA_PROXY: boolean = typeof __GEMINI_QUA_PROXY__ !== 'undefined' && __GEMINI_QUA_PROXY__ === true;

export const coKhoaTrucTiep = Boolean(khoaTrucTiep);

export function taoAi(): GoogleGenAI | null {
  if (khoaTrucTiep) return new GoogleGenAI({ apiKey: khoaTrucTiep });
  if (QUA_PROXY && typeof window !== 'undefined') {
    // Khoá giả, hàm trung gian sẽ thay bằng khoá thật ở phía máy chủ
    return new GoogleGenAI({
      apiKey: 'qua-ham-trung-gian',
      httpOptions: { baseUrl: `${window.location.origin}/api/gemini` },
    });
  }
  return null;
}

let huaSanSang: Promise<boolean> | null = null;

/** Máy chủ đã có khoá chưa. Hỏi một lần, nhớ kết quả cho cả phiên. */
export function aiSanSang(): Promise<boolean> {
  if (khoaTrucTiep) return Promise.resolve(true);
  if (!QUA_PROXY || typeof window === 'undefined') return Promise.resolve(false);
  if (!huaSanSang) {
    huaSanSang = fetch('/api/gemini', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { coKhoa: false }))
      .then((d) => Boolean(d?.coKhoa))
      .catch(() => false);
  }
  return huaSanSang;
}
