import { PhongCach, UserContextSetup, VaiTro } from '../types';
import { EVENTS } from './events';

// Dịp là gốc của bối cảnh. Vai trò, khoảng trang trọng và phong cách được phép đều suy ra từ dịp,
// để không còn những tổ hợp vô lý như kỷ yếu mà làm chủ nhà, hay đám cưới vai khách mà chọn cô dâu.

export type MucTrangTrong = UserContextSetup['mucTrangTrong'];

export interface LuaChonVaiTro {
  id: VaiTro;
  label: string;
  desc: string;
  /** Câu tiếng Anh tả thần thái, gửi cho model ảnh */
  prompt: string;
  /** Chọn vai này thì gợi ý luôn mức trang trọng, phong cách */
  mucGoiY?: MucTrangTrong;
  phongCachGoiY?: PhongCach;
}

export interface LuatSuKien {
  vaiTro: LuaChonVaiTro[];
  /** Khoảng trang trọng hợp lý của dịp: [thấp nhất, cao nhất] */
  mucTrangTrong: [MucTrangTrong, MucTrangTrong];
  phongCach: PhongCach[];
  /** Lý do khi một phong cách không dùng được cho dịp này */
  lyDoKhoaPhongCach: string;
}

export const LUAT_SU_KIEN: Record<string, LuatSuKien> = {
  E01: {
    vaiTro: [
      { id: 'chu_nha', label: 'Gia chủ đón Tết', desc: 'Ở nhà đón khách, thắp hương đầu năm', prompt: 'warm, dignified bearing of a host welcoming New Year visitors at home' },
      { id: 'di_chuc_tet', label: 'Đi chúc Tết', desc: 'Đến nhà họ hàng, thầy cô, bạn bè', prompt: 'polite, cheerful bearing of a visitor paying a New Year call' },
      { id: 'du_xuan', label: 'Du xuân, chụp ảnh', desc: 'Đi lễ đầu năm, dạo hội xuân', prompt: 'relaxed, joyful bearing of someone out enjoying the spring festival', mucGoiY: 2 },
    ],
    mucTrangTrong: [2, 4],
    phongCach: ['nguyen_ban', 'toi_gian', 'remix_pho'],
    lyDoKhoaPhongCach: 'Ngày Tết không phải sân khấu',
  },
  E02: {
    vaiTro: [
      { id: 'hoc_sinh', label: 'Học sinh, sinh viên', desc: 'Chụp cùng lớp, đứng chung khung với bạn', prompt: 'youthful, friendly bearing of a student posing for a class graduation photo' },
      { id: 'thay_co', label: 'Thầy cô', desc: 'Chụp cùng lớp chủ nhiệm, chững chạc hơn', prompt: 'composed, dignified bearing of a teacher posing with the class', mucGoiY: 4, phongCachGoiY: 'nguyen_ban' },
    ],
    mucTrangTrong: [2, 4],
    phongCach: ['nguyen_ban', 'toi_gian', 'remix_pho'],
    lyDoKhoaPhongCach: 'Màu quá nổi làm nhoà ảnh cả lớp',
  },
  E03: {
    vaiTro: [
      { id: 'khach_moi', label: 'Khách mời', desc: 'Bạn bè, đồng nghiệp đến dự', prompt: 'understated bearing of a wedding guest who does not outshine the couple' },
      { id: 'nguoi_nha', label: 'Người nhà hai họ', desc: 'Họ hàng ra đón khách, đứng làm lễ', prompt: 'warm, dignified bearing of a close relative of the couple greeting guests', mucGoiY: 5, phongCachGoiY: 'nguyen_ban' },
      { id: 'be_trap', label: 'Bê tráp, phù dâu phù rể', desc: 'Đội hình mặc đồng bộ trong lễ ăn hỏi', prompt: 'neat, upright bearing of a member of the betrothal tray-bearing party, dressed like the rest of the group', phongCachGoiY: 'toi_gian' },
    ],
    mucTrangTrong: [3, 5],
    phongCach: ['nguyen_ban', 'toi_gian', 'remix_pho'],
    lyDoKhoaPhongCach: 'Dễ lấn át cô dâu chú rể',
  },
  E04: {
    vaiTro: [
      { id: 'nguoi_di_le', label: 'Người đi lễ', desc: 'Dâng hương, vãn cảnh, giữ kín đáo', prompt: 'quiet, reverent bearing of a worshipper at a pagoda' },
    ],
    mucTrangTrong: [3, 5],
    phongCach: ['nguyen_ban', 'toi_gian'],
    lyDoKhoaPhongCach: 'Không gian thờ tự cần kín đáo',
  },
  E05: {
    vaiTro: [
      { id: 'chu_le', label: 'Người chủ lễ', desc: 'Đứng khấn trước bàn thờ thay cả nhà', prompt: 'solemn, upright bearing of the person leading the ancestral rite', mucGoiY: 5 },
      { id: 'con_chau', label: 'Con cháu về dự', desc: 'Về giỗ, phụ giúp, lễ ông bà', prompt: 'respectful, modest bearing of a descendant attending the ancestral ceremony', mucGoiY: 4 },
    ],
    mucTrangTrong: [4, 5],
    phongCach: ['nguyen_ban', 'toi_gian'],
    lyDoKhoaPhongCach: 'Không gian thờ tự, hạn chế remix',
  },
  E06: {
    vaiTro: [
      { id: 'nguoi_ra_mat', label: 'Người đến ra mắt', desc: 'Lần đầu gặp gia đình người yêu', prompt: 'tidy, slightly reserved and respectful bearing of someone meeting a partner\'s family for the first time' },
    ],
    mucTrangTrong: [2, 4],
    phongCach: ['nguyen_ban', 'toi_gian'],
    lyDoKhoaPhongCach: 'Ra mắt nên giản dị, chỉn chu',
  },
  E07: {
    vaiTro: [
      { id: 'dao_pho', label: 'Người dạo phố', desc: 'Cà phê, tham quan, chụp ảnh', prompt: 'relaxed, easy bearing of someone strolling through the old quarter' },
    ],
    mucTrangTrong: [1, 3],
    phongCach: ['nguyen_ban', 'toi_gian', 'remix_pho', 'san_khau'],
    lyDoKhoaPhongCach: '',
  },
  E08: {
    vaiTro: [
      { id: 'bieu_dien', label: 'Người biểu diễn', desc: 'Lên sân khấu, trình diễn tiết mục', prompt: 'poised bearing of a performer about to go on stage', phongCachGoiY: 'san_khau' },
      { id: 'dan_chuong_trinh', label: 'Người dẫn chương trình', desc: 'MC, ban tổ chức sự kiện', prompt: 'confident, welcoming bearing of a master of ceremonies', mucGoiY: 4, phongCachGoiY: 'nguyen_ban' },
      { id: 'khan_gia', label: 'Khách dự sự kiện', desc: 'Xem biểu diễn, dự hội văn hoá', prompt: 'understated bearing of a guest attending a cultural event', mucGoiY: 3, phongCachGoiY: 'toi_gian' },
    ],
    mucTrangTrong: [2, 5],
    phongCach: ['nguyen_ban', 'toi_gian', 'remix_pho', 'san_khau'],
    lyDoKhoaPhongCach: '',
  },
};

export function layLuatSuKien(eventId: string): LuatSuKien {
  return LUAT_SU_KIEN[eventId] || LUAT_SU_KIEN.E07;
}

export function layVaiTro(eventId: string, vaiTro: VaiTro): LuaChonVaiTro {
  const luat = layLuatSuKien(eventId);
  return luat.vaiTro.find((v) => v.id === vaiTro) || luat.vaiTro[0];
}

const kep = (muc: number, [thap, cao]: [MucTrangTrong, MucTrangTrong]) =>
  Math.min(cao, Math.max(thap, muc)) as MucTrangTrong;

/**
 * Đưa bối cảnh về một tổ hợp hợp lý.
 * - Đổi dịp: về mức trang trọng mặc định của dịp và vai đầu tiên của dịp.
 * - Đổi vai: áp mức và phong cách gợi ý của vai đó.
 * - Luôn luôn: vai phải thuộc dịp, phong cách phải được dịp cho phép, mức nằm trong khoảng của dịp.
 */
export function chuanHoaBoiCanh(
  cu: UserContextSetup | null,
  moi: UserContextSetup
): UserContextSetup {
  const luat = layLuatSuKien(moi.eventId);
  const ketQua = { ...moi };
  const doiDip = !cu || cu.eventId !== moi.eventId;

  if (doiDip) {
    const dip = EVENTS.find((e) => e.id === moi.eventId);
    if (dip) ketQua.mucTrangTrong = dip.mucTrangTrongYeuCau as MucTrangTrong;
    if (!luat.vaiTro.some((v) => v.id === moi.vaiTro) || cu) ketQua.vaiTro = luat.vaiTro[0].id;
  }
  if (!luat.vaiTro.some((v) => v.id === ketQua.vaiTro)) ketQua.vaiTro = luat.vaiTro[0].id;

  const vai = layVaiTro(ketQua.eventId, ketQua.vaiTro);
  if (doiDip || cu?.vaiTro !== ketQua.vaiTro) {
    const macDinhDip = EVENTS.find((e) => e.id === ketQua.eventId)?.mucTrangTrongYeuCau as MucTrangTrong | undefined;
    if (vai.mucGoiY) ketQua.mucTrangTrong = vai.mucGoiY;
    else if (!doiDip && macDinhDip) ketQua.mucTrangTrong = macDinhDip;
    if (vai.phongCachGoiY) ketQua.phongCach = vai.phongCachGoiY;
  }

  if (!luat.phongCach.includes(ketQua.phongCach)) ketQua.phongCach = luat.phongCach[0];
  ketQua.mucTrangTrong = kep(ketQua.mucTrangTrong, luat.mucTrangTrong);
  return ketQua;
}
