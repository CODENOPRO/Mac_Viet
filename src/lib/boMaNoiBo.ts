// Bỏ mã nội bộ khỏi chữ hiển thị cho người dùng (DESIGN.md điều 9).
// Model được yêu cầu ghi mã nguồn như [S01] để hệ thống kiểm định, nhưng người đọc chỉ thấy
// tên nguồn ở dòng "Nguồn" bên dưới. Bắt cả dạng [S01], [S01][S02], (S01, S02), (G04), (CR-01).

const MA = String.raw`(?:S\d{2}|G\d{2}|CR-\d{2}|BO-\d{2}|M\d{2}|E\d{2}|R\d{2})`;
const MAU_MA = new RegExp(String.raw`\s*[\[(]\s*${MA}(?:\s*[,;]\s*${MA})*\s*[\])]`, 'g');

export function boMaNoiBo(text: string): string {
  return text
    .replace(MAU_MA, '')
    .replace(/\s+([.,;:!?])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// Trường chứa mã cho máy đọc thì giữ nguyên, chỉ làm sạch chữ cho người đọc
const TRUONG_GIU_MA = /(^id$|Id$|Ids$)/;

export function boMaNoiBoSau<T>(du: T): T {
  if (typeof du === 'string') return boMaNoiBo(du) as unknown as T;
  if (Array.isArray(du)) return du.map((x) => boMaNoiBoSau(x)) as unknown as T;
  if (du && typeof du === 'object') {
    const ra: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(du as Record<string, unknown>)) {
      ra[k] = TRUONG_GIU_MA.test(k) ? v : boMaNoiBoSau(v);
    }
    return ra as T;
  }
  return du;
}
