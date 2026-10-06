import { LookState, UserContextSetup, VaiTro, PhongCach, NguoiMacGioiTinh } from '../types';
import { GARMENTS } from '../data/garments';
import { MOTIFS } from '../data/motifs';

// Link chia sẻ một bộ đồ: chứa đủ các món, màu và toàn bộ bối cảnh (dịp, vai, vùng, phong cách,
// giới, thời tiết), để người nhận mở ra thấy đúng bộ đồ và đúng kết quả chấm như người gửi.
// Dạng: <trang>#look=<mã>. Mã là JSON gọn, mã hoá base64.

interface GoiChiaSe {
  ty?: string; // thượng y
  hy?: string; // hạ y
  tp?: string; // thủ phục
  hi?: string; // hài
  pk?: string[]; // phụ kiện
  hv?: string; // hoa văn
  mc?: string; // màu thượng y
  mh?: string; // màu hạ y
  mt?: string; // màu thủ phục
  hd?: 1; // có phụ kiện hiện đại
  ev: string;
  vt: VaiTro;
  rg: string;
  pc: PhongCach;
  nm: NguoiMacGioiTinh;
  nd: number;
  mu?: 1;
}

export const TIEN_TO_LINK = 'look=';

export function maHoaLook(look: LookState, ctx: UserContextSetup): string {
  const goi: GoiChiaSe = {
    ty: look.thuongY?.id,
    hy: look.haY?.id,
    tp: look.thuPhuc?.id,
    hi: look.hai?.id,
    pk: look.phuKien?.length ? look.phuKien.map((g) => g.id) : undefined,
    hv: look.hoaVan?.id,
    mc: look.mauChinh,
    mh: look.mauHaY,
    mt: look.mauThuPhuc,
    hd: look.phuKienHienDai ? 1 : undefined,
    ev: ctx.eventId,
    vt: ctx.vaiTro,
    rg: ctx.regionId,
    pc: ctx.phongCach,
    nm: ctx.nguoiMac,
    nd: ctx.nhietDo,
    mu: ctx.thoiTietMua ? 1 : undefined,
  };
  return btoa(encodeURIComponent(JSON.stringify(goi)));
}

export function taoLienKetChiaSe(look: LookState, ctx: UserContextSetup): string {
  const goc = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : '';
  return `${goc}#${TIEN_TO_LINK}${encodeURIComponent(maHoaLook(look, ctx))}`;
}

const timMon = (id?: string) => (id ? GARMENTS.find((g) => g.id === id) || null : null);
const laHex = (x?: string) => (x && /^#[0-9a-fA-F]{6}$/.test(x) ? x : undefined);

/** Đọc mã từ hash. Mã hỏng hoặc chứa món không có trong kho thì trả null, app mở như bình thường. */
export function giaiMaLook(hash: string): { look: LookState; ctx: Partial<UserContextSetup> } | null {
  const tho = hash.replace(/^#/, '');
  if (!tho.startsWith(TIEN_TO_LINK)) return null;
  try {
    const goi = JSON.parse(decodeURIComponent(atob(decodeURIComponent(tho.slice(TIEN_TO_LINK.length))))) as GoiChiaSe;
    if (!goi || typeof goi.ev !== 'string') return null;
    const look: LookState = {
      thuongY: timMon(goi.ty),
      haY: timMon(goi.hy),
      thuPhuc: timMon(goi.tp),
      hai: timMon(goi.hi),
      phuKien: (goi.pk || []).map((id) => timMon(id)).filter((g): g is NonNullable<typeof g> => Boolean(g)),
      hoaVan: goi.hv ? MOTIFS.find((m) => m.id === goi.hv) || null : null,
      mauChinh: laHex(goi.mc) || '#16243A',
      mauHaY: laHex(goi.mh),
      mauThuPhuc: laHex(goi.mt),
      phuKienHienDai: goi.hd === 1,
      nhietDo: typeof goi.nd === 'number' ? goi.nd : 24,
      isEthnicMinoritySingle: false,
      hasEthnicEmbroideryOnVietTop: false,
      isGopChungTayBac: false,
    };
    const ctx: Partial<UserContextSetup> = {
      eventId: goi.ev,
      vaiTro: goi.vt,
      regionId: goi.rg,
      phongCach: goi.pc,
      nguoiMac: goi.nm,
      nhietDo: typeof goi.nd === 'number' ? goi.nd : undefined,
      thoiTietMua: goi.mu === 1,
    };
    return { look, ctx };
  } catch {
    return null;
  }
}
