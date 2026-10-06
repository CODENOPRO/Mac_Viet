export type ScreenType = 'landing' | 'studio' | 'lookbook' | 'cu_nghe' | 'culture_rules';

export type StudioStep = 1 | 2 | 3 | 4; // 1: Bối cảnh, 2: Ảnh của bạn, 3: Xưởng phối, 4: Kết quả Look Card
export const TOTAL_STUDIO_STEPS = 4;
export const formatStudioStepLabel = (step: number, title?: string): string => {
  const stepStr = step.toString().padStart(2, '0');
  const totalStr = TOTAL_STUDIO_STEPS.toString().padStart(2, '0');
  return title ? `BƯỚC ${stepStr} / ${totalStr} · ${title}` : `BƯỚC ${stepStr} / ${totalStr}`;
};
export type GeminiConnectionStatus = 'ready' | 'cached' | 'fallback';

export type GarmentLayer = 'thuong_y' | 'ha_y' | 'thu_phuc' | 'hai' | 'phu_kien';
export type RegionId = 'bac' | 'trung' | 'nam' | 'tay_bac' | 'toan_quoc';
export type GenderType = 'nam' | 'nu' | 'ca_hai';
export type CertaintyLevel = 'da_xac_lap' | 'thuc_hanh_hien_nay' | 'dang_tranh_luan';
export type SocialClass = 'hoang_gia' | 'quan_lai' | 'dan_gian';
export type RuleSeverity = 'do' | 'vang' | 'xanh';

export interface Source {
  id: string; // S01..S12
  ten: string;
  tenNgan: string; // Tên ngắn gọn hiển thị ngoài giao diện
  tacGia: string;
  nam: number | string;
  loai: 'sach' | 'bao_tang' | 'tu_lieu' | 'cong_dong';
  ghiChu: string;
  url: string | null; // liên kết chính, bằng lienKet[0] nếu có
  loaiTruyCap: 'truc_tuyen' | 'tu_lieu_in' | 'hien_vat_bao_tang' | 'chua_cong_bo';
  ghiChuTruyCap: string;
  kiemChung: KiemChungNguon;
}

/** Cách người xem tự kiểm chứng một nguồn. Mọi liên kết đều đã được mở thử trước khi đưa vào. */
export interface KiemChungNguon {
  cach: 'mo_truc_tuyen' | 'tra_cuu_sach' | 'xem_hien_vat' | 'chua_cong_bo';
  lienKet: { nhan: string; url: string }[];
  huongDan: string; // cần đối chiếu điều gì ở liên kết
}

export interface Garment {
  id: string; // G01..G16
  ten: string;
  tenKhac: string[];
  lop: GarmentLayer;
  vung: RegionId[];
  nienDai: string;
  mucTrangTrong: 1 | 2 | 3 | 4 | 5;
  gioiTinh: GenderType;
  chatLieuPhoBien: string[];
  mauTruyenThong: string[]; // mã màu hex
  moTaNgan: string; // dưới 40 từ
  cauChuyen: string; // 120-150 từ, kể chuyện, không hàn lâm
  dungKhiNao: string[];
  khongDungKhiNao: string[];
  sourceIds: string[];
  doChacChan: CertaintyLevel;
  anh?: string; // dataURL hoặc đường dẫn ảnh hiện vật tham chiếu
  moTaHinhAnh?: string; // mô tả cấu trúc bằng tiếng Anh, chỉ dùng cho prompt sinh ảnh
  anhThamChieuThat?: string; // ảnh chụp thật dùng làm tham chiếu cho model, không dùng hình vẽ
}

export interface Background {
  id: string; // BG1..BG8
  ten: string;
  moTaChoAI: string;
  hopVoiSuKien: string[];
  hopVoiVung: string[];
  hex?: string;
}

export interface Motif {
  id: string; // M01..M08
  ten: string;
  yNghia: string;
  tangLop: SocialClass;
  canThan: boolean;
  mucDo?: 'do' | 'vang' | 'binh_thuong';
  sourceIds?: string[];
}

export interface NamedColor {
  id: string;
  ten: string;
  hex: string;
  yNghia: string;
}

export interface Palette {
  id: string;
  ten: string;
  mauSac: string[];
  moTa: string;
  thoiKyHoacVung: string;
}

export interface EventContext {
  id: string; // E01..E08
  ten: string;
  moTa?: string;
  mucTrangTrongYeuCau: 1 | 2 | 3 | 4 | 5;
  mauNenTranh: string[];
  mauNenDung: string[];
  luuY: string;
  /** Có ở bối cảnh hiệu lực (data/boiCanhSuKien.ts): vai của người dùng trong dịp này */
  vaiTro?: VaiTro;
}

export interface Region {
  id: 'R01' | 'R02' | 'R03' | 'R04' | 'bac' | 'trung' | 'nam' | 'tay_bac';
  ten: string;
  khongGianVanHoa?: string;
  dacTrung: string;
  trangPhucTieuBieu: string[];
  chatLieu: string[];
  bangMau: string[];
  ghiChuTonTrong: string;
}

export interface RuleFixOption {
  moTa: string;
  apDung?: (look: LookState) => LookState;
}

export interface ActiveRuleItem {
  rule: CultureRule;
  mucDoHienThi: 'do' | 'vang' | 'xanh' | 'thong_tin';
  isDowngraded?: boolean;
}

export interface CultureFlag {
  ruleId: string;
  mucDo: RuleSeverity;
  mucDoChung: 'do' | 'vang' | 'xanh';
  tieuDe: string; // "Cần cân nhắc" cho đỏ, "Hơi lệch bối cảnh" cho vàng, "Phối hợp lệ" cho xanh
  thongDiep: string;
  cachSua: string;
  sourceIds: string[];
  tenBangMauKhop?: string;
  luatViPham: ActiveRuleItem[];
  tongSoLuatBan: number;
}

export interface LookState {
  thuongY?: Garment | null;
  haY?: Garment | null;
  thuPhuc?: Garment | null;
  hai?: Garment | null;
  phuKien?: Garment[];
  hoaVan?: Motif | null;
  mauChinh?: string;
  phuKienHienDai?: boolean; // ví dụ sneaker, túi xách hiện đại
  nhietDo?: number; // dùng cho CR-15 (ví dụ > 32 độ)
  isEthnicMinoritySingle?: boolean; // CR-17
  hasEthnicEmbroideryOnVietTop?: boolean; // CR-18
  isGopChungTayBac?: boolean; // CR-19
  nguoiMac?: NguoiMacGioiTinh;
}

export interface CultureRule {
  id: string; // CR-01 tới CR-21
  ten: string;
  dieuKien: string; // mô tả bằng chữ cho con người đọc
  kiemTra: (look: LookState, boiCanh?: EventContext, regionId?: string) => boolean;
  mucDo: 'do' | 'vang' | 'xanh';
  thongDiep: string; // 1 tới 2 câu, KHÔNG dùng từ "sai"
  cachSua: RuleFixOption[];
  sourceIds: string[];
  doChacChan: 'da_xac_lap' | 'thuc_hanh_hien_nay' | 'dang_tranh_luan';
  phanLoaiLoi?: 'lech_vung' | 'lech_thoi_ky' | 'nghi_le' | 'dien_che' | 'tien_dung' | 'ban_sac';
  apDung?: (look: LookState) => LookState;
  viDu: LookState | null;
}

export interface Avatar {
  id: string; // A00 (dáng người tham chiếu nội bộ)
  ten: string;
  gioiTinh: GenderType;
  dang: string;
  moTaChoAI: string;
}

export interface HarmonyResult {
  mucDoTrangTrongPhuHop: boolean;
  vungMienThongNhat: boolean;
  diemHaiHoa: number;
  canhBao: CultureFlag[];
  goiY: string[];
}

// Vai trò gắn với từng dịp, xem data/boiCanhSuKien.ts
export type VaiTro =
  | 'chu_nha'
  | 'di_chuc_tet'
  | 'du_xuan'
  | 'hoc_sinh'
  | 'thay_co'
  | 'khach_moi'
  | 'nguoi_nha'
  | 'be_trap'
  | 'nguoi_di_le'
  | 'chu_le'
  | 'con_chau'
  | 'nguoi_ra_mat'
  | 'dao_pho'
  | 'bieu_dien'
  | 'dan_chuong_trinh'
  | 'khan_gia';
export type PhongCach = 'nguyen_ban' | 'toi_gian' | 'remix_pho' | 'san_khau';
export type NguoiMacGioiTinh = 'nam' | 'nu' | 'khong_neu';

export interface UserContextSetup {
  eventId: string;
  regionId: string;
  mucTrangTrong: 1 | 2 | 3 | 4 | 5;
  nhietDo: number;
  thoiTietMua: boolean;
  vaiTro: VaiTro;
  phongCach: PhongCach;
  nguoiMac: NguoiMacGioiTinh;
}

export interface LookCardData {
  id: string;
  ten: string;
  ngayTao: string;
  look: LookState;
  eventContextId?: string;
  /** Vai trong dịp lúc lưu, để mở lại thì luật văn hoá chấm đúng như lúc lưu */
  vaiTro?: VaiTro;
  ghiChu?: string;
  /** Có ảnh mặc thử lưu kèm trong IndexedDB (xem lib/anhLookbook.ts) */
  coAnh?: boolean;
}
