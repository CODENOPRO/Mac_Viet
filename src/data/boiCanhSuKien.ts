import { EventContext, PhongCach, UserContextSetup, VaiTro } from '../types';
import { EVENTS } from './events';

// Logic bối cảnh, một chiều: DỊP → VAI → MỨC TRANG TRỌNG và PHONG CÁCH ĐƯỢC PHÉP.
//
// - Dịp quyết định có những vai nào. Kỷ yếu không có chủ nhà, đám cưới không có vai chọn bừa.
// - Vai quyết định mức trang trọng mà dịp đòi hỏi ở bạn. Mức này là chuẩn mực xã hội của dịp,
//   không phải sở thích, nên người dùng không kéo được. Muốn mặc trang trọng hơn thì chọn món
//   trang trọng hơn; app so mức của bộ đồ với mức dịp yêu cầu.
// - Vai quyết định phong cách nào được mở. Mặc định luôn là Nguyên bản, chặt nhất.
//   Nới luật phải do người dùng chủ động chọn, và chỉ ở vai cho phép.
// - Mỗi vai chỉ được tách ra khi nó đổi ít nhất một thứ kiểm chứng được:
//   mức trang trọng, luật văn hoá áp dụng, hoặc phong cách được mở.

export type MucTrangTrong = UserContextSetup['mucTrangTrong'];

export interface LuaChonVaiTro {
  id: VaiTro;
  label: string;
  desc: string;
  /** Câu tiếng Anh tả thần thái, gửi cho model ảnh */
  prompt: string;
  /** Mức trang trọng dịp đòi hỏi ở người giữ vai này */
  mucTrangTrong: MucTrangTrong;
  /** Phong cách được mở cho vai này, cái đầu là mặc định */
  phongCach: PhongCach[];
  /** Vì sao phong cách nới luật bị khoá với vai này */
  lyDoKhoa?: string;
}

export interface LuatSuKien {
  vaiTro: LuaChonVaiTro[];
  /** Nói thẳng phần app chưa làm ở dịp này, thay vì để trống cho người dùng tự đoán */
  ghiChuPhamVi?: string;
}

const CHAT: PhongCach[] = ['nguyen_ban', 'toi_gian'];
const CO_REMIX: PhongCach[] = ['nguyen_ban', 'toi_gian', 'remix_pho'];

// Vai đầu tiên của mỗi dịp có mức bằng mức dịp ghi trên thẻ, để thẻ và mặc định khớp nhau.
export const LUAT_SU_KIEN: Record<string, LuatSuKien> = {
  E01: {
    vaiTro: [
      { id: 'di_chuc_tet', label: 'Đi chúc Tết', desc: 'Đến nhà ông bà, họ hàng, thầy cô', prompt: 'polite, respectful bearing of a visitor paying a New Year call to elders', mucTrangTrong: 3, phongCach: CO_REMIX },
      { id: 'chu_nha', label: 'Gia chủ đón Tết', desc: 'Ở nhà đón khách, thắp hương đầu năm', prompt: 'warm, dignified bearing of a host welcoming New Year visitors at home', mucTrangTrong: 4, phongCach: CHAT, lyDoKhoa: 'Gia chủ giữ nếp nhà ngày đầu năm' },
      { id: 'du_xuan', label: 'Du xuân, chụp ảnh', desc: 'Dạo hội xuân, chụp ảnh ngày Tết', prompt: 'relaxed, joyful bearing of someone out enjoying the spring festival', mucTrangTrong: 2, phongCach: CO_REMIX },
    ],
  },
  E02: {
    vaiTro: [
      { id: 'hoc_sinh', label: 'Học sinh, sinh viên', desc: 'Chụp cùng lớp, đứng chung khung với bạn', prompt: 'youthful, friendly bearing of a student posing for a class graduation photo', mucTrangTrong: 3, phongCach: CO_REMIX },
      { id: 'thay_co', label: 'Thầy cô', desc: 'Chụp cùng lớp chủ nhiệm', prompt: 'composed, dignified bearing of a teacher posing with the class', mucTrangTrong: 4, phongCach: CHAT, lyDoKhoa: 'Thầy cô giữ phong thái chuẩn mực trước lớp' },
    ],
  },
  E03: {
    vaiTro: [
      { id: 'khach_moi', label: 'Khách mời', desc: 'Bạn bè, đồng nghiệp đến dự', prompt: 'understated bearing of a wedding guest who does not outshine the couple', mucTrangTrong: 4, phongCach: CO_REMIX },
      { id: 'nguoi_nha', label: 'Người nhà hai họ', desc: 'Họ hàng ra đón khách, đứng làm lễ', prompt: 'warm, dignified bearing of a close relative of the couple greeting guests', mucTrangTrong: 5, phongCach: CHAT, lyDoKhoa: 'Người nhà mặc theo nếp hai họ' },
      { id: 'be_trap', label: 'Bê tráp, phù dâu phù rể', desc: 'Đội hình mặc đồng bộ trong lễ', prompt: 'neat, upright bearing of a member of the betrothal tray-bearing party', mucTrangTrong: 4, phongCach: CHAT, lyDoKhoa: 'Đội bê tráp mặc đồng bộ theo nhà trai, nhà gái' },
    ],
    ghiChuPhamVi: 'Trang phục cô dâu chú rể có hệ luật riêng, bản này chưa phối.',
  },
  E04: {
    vaiTro: [
      { id: 'nguoi_di_le', label: 'Người đi lễ', desc: 'Dâng hương, vãn cảnh, giữ kín đáo', prompt: 'quiet, reverent bearing of a worshipper at a pagoda', mucTrangTrong: 4, phongCach: CHAT, lyDoKhoa: 'Không gian thờ tự cần kín đáo' },
    ],
    ghiChuPhamVi: 'App không phối pháp phục của tăng ni.',
  },
  E05: {
    vaiTro: [
      { id: 'chu_le', label: 'Người chủ lễ', desc: 'Đứng khấn trước bàn thờ thay cả nhà', prompt: 'solemn, upright bearing of the person leading the ancestral rite', mucTrangTrong: 5, phongCach: CHAT, lyDoKhoa: 'Không gian thờ tự, hạn chế remix' },
      { id: 'con_chau', label: 'Con cháu về dự', desc: 'Về giỗ, phụ giúp, lễ ông bà', prompt: 'respectful, modest bearing of a descendant attending the ancestral ceremony', mucTrangTrong: 4, phongCach: CHAT, lyDoKhoa: 'Không gian thờ tự, hạn chế remix' },
    ],
  },
  E06: {
    vaiTro: [
      { id: 'nguoi_ra_mat', label: 'Người đến ra mắt', desc: 'Lần đầu gặp gia đình người yêu', prompt: "tidy, slightly reserved and respectful bearing of someone meeting a partner's family for the first time", mucTrangTrong: 3, phongCach: CHAT, lyDoKhoa: 'Ra mắt nên giản dị, chỉn chu' },
    ],
  },
  E07: {
    vaiTro: [
      { id: 'dao_pho', label: 'Người dạo phố', desc: 'Cà phê, tham quan, chụp ảnh', prompt: 'relaxed, easy bearing of someone strolling through the old quarter', mucTrangTrong: 2, phongCach: CO_REMIX },
    ],
  },
  E08: {
    vaiTro: [
      { id: 'bieu_dien', label: 'Người biểu diễn', desc: 'Lên sân khấu, trình diễn tiết mục', prompt: 'poised bearing of a performer about to go on stage', mucTrangTrong: 4, phongCach: ['nguyen_ban', 'toi_gian', 'san_khau'] },
      { id: 'dan_chuong_trinh', label: 'Người dẫn chương trình', desc: 'MC, đại diện ban tổ chức', prompt: 'confident, welcoming bearing of a master of ceremonies', mucTrangTrong: 4, phongCach: CHAT, lyDoKhoa: 'Người dẫn đại diện ban tổ chức' },
      { id: 'khan_gia', label: 'Khách dự sự kiện', desc: 'Xem biểu diễn, dự hội văn hoá', prompt: 'understated bearing of a guest attending a cultural event', mucTrangTrong: 3, phongCach: CO_REMIX },
    ],
  },
};

export function layLuatSuKien(eventId: string): LuatSuKien {
  return LUAT_SU_KIEN[eventId] || LUAT_SU_KIEN.E07;
}

export function layVaiTro(eventId: string, vaiTro?: VaiTro): LuaChonVaiTro {
  const luat = layLuatSuKien(eventId);
  return luat.vaiTro.find((v) => v.id === vaiTro) || luat.vaiTro[0];
}

/** Lý do một phong cách bị khoá với vai đang chọn. Trả rỗng nếu phong cách đó được mở. */
export function lyDoKhoaPhongCach(vai: LuaChonVaiTro, phongCach: PhongCach): string {
  if (vai.phongCach.includes(phongCach)) return '';
  if (phongCach === 'san_khau') return 'Chỉ dành cho người biểu diễn';
  return vai.lyDoKhoa || 'Không hợp vai này';
}

/**
 * Đưa bối cảnh về tổ hợp hợp lệ: vai phải thuộc dịp, mức trang trọng lấy theo vai,
 * phong cách phải được vai cho phép (không thì về Nguyên bản).
 */
export function chuanHoaBoiCanh(ctx: UserContextSetup): UserContextSetup {
  const vai = layVaiTro(ctx.eventId, ctx.vaiTro);
  return {
    ...ctx,
    vaiTro: vai.id,
    mucTrangTrong: vai.mucTrangTrong,
    phongCach: vai.phongCach.includes(ctx.phongCach) ? ctx.phongCach : vai.phongCach[0],
  };
}

/**
 * Bối cảnh hiệu lực: dịp kèm vai, với mức trang trọng yêu cầu đã tính theo vai.
 * Mọi nơi chấm điểm, gợi ý, kiểm luật văn hoá đều đọc từ đây, để cả app chỉ có một con số.
 */
export function boiCanhHieuLuc(eventId: string, vaiTro?: VaiTro): EventContext {
  const dip = EVENTS.find((e) => e.id === eventId) || EVENTS[0];
  const vai = layVaiTro(dip.id, vaiTro);
  return { ...dip, mucTrangTrongYeuCau: vai.mucTrangTrong, vaiTro: vai.id };
}
