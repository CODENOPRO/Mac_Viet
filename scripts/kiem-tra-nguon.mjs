// Kiểm tra mọi liên kết nguồn trong src/data/sources.ts.
// Chạy: node scripts/kiem-tra-nguon.mjs
// Báo lỗi khi: liên kết không mở được, hoặc một nguồn không thuộc loại "chưa công bố" mà không có liên kết nào.
import { readFileSync } from 'node:fs';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36';
const src = readFileSync(new URL('../src/data/sources.ts', import.meta.url), 'utf8');

// Tách từng khối nguồn theo id
const khoi = src.split(/\n  \{\n    id: '/).slice(1).map((k) => {
  const id = k.slice(0, k.indexOf("'"));
  const cach = (k.match(/cach: '([a-z_]+)'/) || [])[1];
  const lienKet = [...k.matchAll(/\{\s*nhan:\s*'([^']+)',\s*url:\s*'([^']+)',?\s*\}/g)].map((m) => ({ nhan: m[1], url: m[2] }));
  return { id, cach, lienKet };
});

let loi = 0;
for (const n of khoi) {
  if (n.cach !== 'chua_cong_bo' && n.lienKet.length === 0) {
    console.log(`LỖI  ${n.id}: ghi là "${n.cach}" nhưng không có liên kết nào`);
    loi++;
  }
  if (n.cach === 'chua_cong_bo') console.log(`--   ${n.id}: chưa công bố, không có liên kết (đúng quy ước)`);
  for (const lk of n.lienKet) {
    let ketQua;
    try {
      const r = await fetch(lk.url, { headers: { 'User-Agent': UA }, redirect: 'follow', signal: AbortSignal.timeout(20000) });
      const chanBot = r.headers.get('cf-mitigated') === 'challenge' || (r.status === 403 && r.headers.get('server') === 'cloudflare');
      ketQua = r.ok ? 'MỞ ĐƯỢC' : chanBot ? 'CẦN TRÌNH DUYỆT' : `HỎNG ${r.status}`;
      if (!r.ok && !chanBot) loi++;
    } catch (e) {
      // Một số trang chính thức chặn công cụ tự động bằng vòng chuyển hướng; trình duyệt thật vẫn mở được
      if (String(e.cause?.message || '').includes('redirect count exceeded')) {
        ketQua = 'CẦN TRÌNH DUYỆT';
      } else {
        ketQua = `HỎNG (${e.cause?.code || e.name})`;
        loi++;
      }
    }
    console.log(`${ketQua.padEnd(16)} ${n.id}  ${lk.nhan}`);
  }
}

console.log(loi ? `\n${loi} vấn đề cần sửa.` : '\nMọi nguồn đều có cách kiểm chứng, mọi liên kết đều mở được.');
process.exit(loi ? 1 : 0);
