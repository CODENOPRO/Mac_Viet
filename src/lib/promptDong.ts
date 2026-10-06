import { EventContext, LookState, UserContextSetup } from '../types';
import { REGIONS } from '../data/regions';

// Prompt động: mỗi lựa chọn ở bước bối cảnh điều khiển đúng một phần của bức ảnh.
// Phần tiếng Anh gửi cho model; phần tiếng Việt hiện cho người dùng thấy biến nào đang chạy.

export interface BoiCanhAnh {
  khongKhi: string;
  dangDung: string;
  anhSang: string;
  chatLieu: string;
  hoanThien: string;
  dangMay: string;
  huongNgheThuat: string;
  tomTat: string[];
}

const SU_KIEN: Record<string, [string, string]> = {
  E01: ['festive, warm and joyful Lunar New Year mood; a gentle natural smile', 'Tết: không khí ấm, vui'],
  E02: ['youthful, fresh graduation-photo mood; a relaxed confident smile', 'Kỷ yếu: trẻ trung'],
  E03: ['elegant, polite wedding-guest mood; a composed gentle smile; dressed so as not to outshine the couple', 'Cưới: nhã nhặn, không lấn át'],
  E04: ['serene, reverent mood for a pagoda visit; calm expression without a broad smile; modest posture', 'Lễ chùa: trang nghiêm'],
  E05: ['solemn, respectful mood for an ancestral ceremony; calm and serious expression', 'Giỗ: nghiêm trang'],
  E06: ["warm, tidy, approachable mood for meeting a partner's family; a soft smile", 'Ra mắt: chỉn chu'],
  E07: ['relaxed, natural everyday mood; an easy slight smile', 'Phố cổ: thoải mái'],
  E08: ['confident, expressive stage presence', 'Biểu diễn: tự tin'],
};

const DANG_TRANG_TRONG =
  'standing upright, feet together, hands clasped in front at the waist, looking at the camera';

const PHONG_CACH: Record<UserContextSetup['phongCach'], { huong: string; dang: string; vi: string }> = {
  nguyen_ban: {
    huong: 'historically faithful, museum-accurate styling; no modern hairstyle, makeup or accessories',
    dang: DANG_TRANG_TRONG,
    vi: 'Nguyên bản: chuẩn điển chế',
  },
  toi_gian: {
    huong: 'minimal, clean and restrained styling; muted overall palette; nothing beyond the listed items',
    dang: DANG_TRANG_TRONG,
    vi: 'Tối giản: gọn, tiết chế',
  },
  remix_pho: {
    huong: 'contemporary street-editorial styling; a natural modern hairstyle is fine; the clothing itself stays traditional',
    dang: 'relaxed stance with weight on one leg, one hand resting loosely at the side, looking at the camera',
    vi: 'Remix phố: dáng thả lỏng',
  },
  san_khau: {
    huong: 'theatrical, high-impact styling with bold contrast',
    dang: 'expressive confident stance, chin slightly raised, shoulders open',
    vi: 'Sân khấu: ấn tượng',
  },
};

const VAI_TRO: Record<UserContextSetup['vaiTro'], [string, string]> = {
  chu_nha: ['bearing of a welcoming host', 'Chủ nhà: đón tiếp'],
  khach_moi: ['understated bearing of a guest', 'Khách mời: nhã nhặn'],
  co_dau_chu_re: ['the most ceremonial bearing of a bride or groom, upright and poised', 'Cô dâu chú rể: trang trọng nhất'],
  bieu_dien: ['poised bearing of a performer about to go on stage', 'Người biểu diễn: sẵn sàng lên sân khấu'],
};

const MUC_TRANG_TRONG: Record<number, [string, string]> = {
  1: ['plain everyday finishing with soft natural creases and a matte surface', 'Thường ngày: vải mộc'],
  2: ['neat casual finishing', 'Dạo phố: gọn gàng'],
  3: ['neat, well-pressed finishing', 'Có lễ: phẳng phiu'],
  4: ['crisp, carefully pressed finishing with a refined sheen', 'Trang trọng: là phẳng, bóng nhẹ'],
  5: ['immaculate ceremonial finishing, crisp folds and a rich lustre', 'Đại lễ: hoàn thiện tuyệt đối'],
};

const NGUOI_MAC: Record<UserContextSetup['nguoiMac'], [string, string]> = {
  nam: ["cut every garment the way it is traditionally made for men: straighter and looser through the body", 'Dáng may nam'],
  nu: ['cut every garment the way it is traditionally made for women: more fitted at the waist with a long graceful line', 'Dáng may nữ'],
  khong_neu: ['', ''],
};

const NGAN_SACH: Record<UserContextSetup['nganSach'], [string, string]> = {
  may_do: ['bespoke made-to-measure fit with exact sleeve and hem length', 'May đo: vừa khít'],
  thue: ['classic rental-costume fit, standard length, very slightly roomy', 'Thuê: dáng chuẩn'],
  mua_san: ['clean ready-to-wear fit', 'Mua sẵn: dáng may sẵn'],
};

// Tên vải tiếng Việt sang mô tả tiếng Anh cho model.
const VAI: Record<string, string> = {
  the: 'silk gauze (the)',
  'đũi': 'slubbed raw silk (dui)',
  'lụa': 'silk',
  'gấm': 'silk brocade',
  'đoạn': 'satin-weave silk (doan)',
  sa: 'sheer silk (sa)',
  satin: 'satin',
  'vải bông': 'cotton',
  'vải nâu': 'brown-dyed homespun cotton',
  'lụa vạn phúc': 'Van Phuc silk',
};
const chuan = (s: string) => s.trim().toLowerCase();

function chonVaiTheoVung(look: LookState, regionId: string): { vai?: string; tenVung?: string } {
  const vung = REGIONS.find((r) => r.id === regionId);
  const vaiCuaAo = (look.thuongY?.chatLieuPhoBien || []).map(chuan);
  if (!vung || !vaiCuaAo.length) return { tenVung: vung?.ten };
  const vaiCuaVung = (vung.chatLieu || []).map(chuan);
  // Ưu tiên vải đặc trưng của vùng; lụa là vải chung, chỉ dùng khi không còn vải nào khác khớp.
  const khop = vaiCuaVung.filter((v) => vaiCuaAo.includes(v));
  const chon = khop.find((v) => v !== 'lụa') || khop[0] || vaiCuaAo[0];
  return { vai: chon, tenVung: vung.ten };
}

export function dungBoiCanhAnh(ctx: UserContextSetup, suKien: EventContext | undefined, look: LookState): BoiCanhAnh {
  const tomTat: string[] = [];
  const sk = SU_KIEN[suKien?.id || ''] || SU_KIEN.E07;
  tomTat.push(sk[1]);

  const { vai, tenVung } = chonVaiTheoVung(look, ctx.regionId);
  if (vai) tomTat.push(`${tenVung}: vải ${vai}`);

  if (NGUOI_MAC[ctx.nguoiMac]?.[1]) tomTat.push(NGUOI_MAC[ctx.nguoiMac][1]);

  const muc = MUC_TRANG_TRONG[ctx.mucTrangTrong] || MUC_TRANG_TRONG[3];
  tomTat.push(muc[1]);

  let doDay = 'medium-weight fabric';
  if (ctx.nhietDo >= 30) {
    doDay = 'lightweight, breathable, slightly translucent fabric that drapes softly';
    tomTat.push(`${ctx.nhietDo}°C: vải mỏng nhẹ`);
  } else if (ctx.nhietDo < 20) {
    doDay = 'heavier, warmer fabric with a fuller drape and an extra inner layer';
    tomTat.push(`${ctx.nhietDo}°C: vải dày, thêm lớp`);
  } else {
    tomTat.push(`${ctx.nhietDo}°C: vải vừa`);
  }

  const pc = PHONG_CACH[ctx.phongCach] || PHONG_CACH.nguyen_ban;
  // Dịp lễ chùa và giỗ luôn giữ dáng đứng trang nghiêm, dù phong cách nào.
  const leNghiem = suKien?.id === 'E04' || suKien?.id === 'E05';
  const dangDung = leNghiem ? DANG_TRANG_TRONG : pc.dang;
  tomTat.push(pc.vi);

  // Ánh sáng tự nhiên của nơi chụp, không đèn studio
  let anhSang =
    'natural available light of the location, falling on the person from the same direction and with the same colour as on the scene, gentle shadows, no flash';
  if (ctx.phongCach === 'san_khau') {
    anhSang = 'strong warm directional light from one side, as from a low sun, with deeper shadows';
  }
  if (ctx.thoiTietMua) {
    anhSang += '; cool, soft overcast feel with slightly subdued colours, as on a rainy day';
    tomTat.push('Mưa: ánh sáng dịu, lạnh');
  }

  const vt = VAI_TRO[ctx.vaiTro] || VAI_TRO.khach_moi;
  tomTat.push(vt[1]);

  const ns = NGAN_SACH[ctx.nganSach] || NGAN_SACH.thue;
  tomTat.push(ns[1]);

  return {
    khongKhi: `${sk[0]}; ${vt[0]}`,
    dangDung,
    anhSang,
    chatLieu: vai ? `${VAI[vai] || vai}, ${doDay}` : doDay,
    hoanThien: muc[0],
    dangMay: [NGUOI_MAC[ctx.nguoiMac]?.[0], ns[0]].filter(Boolean).join('; '),
    huongNgheThuat: pc.huong,
    tomTat,
  };
}
