import { GenderType } from '../types';

export interface BoTrangPhuc {
  id: string; // 'BO1'..'BO6'
  ten: string;
  gioiTinh: GenderType; // 'nu' | 'ca_hai' | 'nam'
  cacMonTheoLop: {
    thuongY: string[]; // ids
    haY: string[];     // ids
    thuPhuc: string[]; // ids
    hai: string[];     // ids
    phuKien?: string[]; // ids
    phuKienBatBuoc?: string[]; // ids (ví dụ G16 yếm cho BO1)
  };
  moTa: string;
  sourceIds: string[];
}

export const BO_TRANG_PHUC: BoTrangPhuc[] = [
  {
    id: 'BO1',
    ten: 'Tứ thân Bắc Bộ',
    gioiTinh: 'nu',
    cacMonTheoLop: {
      thuongY: ['G03'],
      haY: ['G11'],
      thuPhuc: ['G12', 'G14'],
      hai: ['G15'],
      phuKien: ['G16'],
      phuKienBatBuoc: ['G16'],
    },
    moTa: 'Bộ thường phục của phụ nữ Bắc Bộ: áo tứ thân mặc ngoài yếm, váy đụp, thắt lưng lụa, khăn vấn hoặc nón quai thao.',
    sourceIds: ['S01', 'S05'],
  },
  {
    id: 'BO2',
    ten: 'Ngũ thân và áo tấc',
    gioiTinh: 'ca_hai',
    cacMonTheoLop: {
      thuongY: ['G04', 'G05'],
      haY: ['G10'],
      thuPhuc: ['G12', 'G13'],
      hai: ['G15'],
      phuKien: [],
    },
    moTa: 'Áo ngũ thân hoặc áo tấc mặc với quần ống rộng. Nam thường đội khăn đóng, nữ thường vấn khăn.',
    sourceIds: ['S01', 'S02', 'S04'],
  },
  {
    id: 'BO3',
    ten: 'Áo dài tân thời',
    gioiTinh: 'ca_hai',
    cacMonTheoLop: {
      thuongY: ['G08'],
      haY: ['G10'],
      thuPhuc: ['G12'],
      hai: ['G15'],
      phuKien: [],
    },
    moTa: 'Áo dài hiện đại mặc với quần ống rộng.',
    sourceIds: ['S07', 'S10'],
  },
  {
    id: 'BO4',
    ten: 'Bà ba Nam Bộ',
    gioiTinh: 'ca_hai',
    cacMonTheoLop: {
      thuongY: ['G09'],
      haY: ['G10'],
      thuPhuc: [], // không có món nào bắt buộc
      hai: ['G15'],
      phuKien: [],
    },
    moTa: 'Áo bà ba mặc với quần dài, thường kèm khăn rằn hoặc nón lá.',
    sourceIds: ['S09', 'S10'],
  },
  {
    id: 'BO5',
    ten: 'Cung đình Nguyễn',
    gioiTinh: 'nu',
    cacMonTheoLop: {
      thuongY: ['G06'],
      haY: ['G10'],
      thuPhuc: ['G12'],
      hai: ['G15'],
      phuKien: [],
    },
    moTa: 'Phẩm phục cung đình của hậu phi và mệnh phụ triều Nguyễn.',
    sourceIds: ['S01', 'S03', 'S04'],
  },
  {
    id: 'BO6',
    ten: 'Cổ phục trước thế kỷ 17',
    gioiTinh: 'ca_hai',
    cacMonTheoLop: {
      thuongY: ['G01', 'G02'],
      haY: ['G10'],
      thuPhuc: ['G12', 'G13'],
      hai: ['G15'],
      phuKien: [],
    },
    moTa: 'Áo giao lĩnh, viên lĩnh thời Lý Trần Lê.',
    sourceIds: ['S01', 'S06'],
  },
];

/**
 * Tìm các bộ trang phục chứa một món thượng y cụ thể
 */
export function timBo(thuongYId?: string | null): BoTrangPhuc[] {
  if (!thuongYId) return [];
  return BO_TRANG_PHUC.filter((bo) => bo.cacMonTheoLop.thuongY.includes(thuongYId));
}

/**
 * Kiểm tra xem một món đồ có thuộc bất kỳ bộ nào của thượng y đang chọn hay không
 */
export function monThuocBoCuaThuongY(
  garmentId: string,
  thuongYId?: string | null
): boolean {
  if (!thuongYId) return true; // Chưa chọn thượng y thì chưa áp đặt hạn chế bộ
  const cacBo = timBo(thuongYId);
  if (cacBo.length === 0) return true;

  return cacBo.some((bo) => {
    const { thuongY, haY, thuPhuc, hai, phuKien } = bo.cacMonTheoLop;
    return (
      thuongY.includes(garmentId) ||
      haY.includes(garmentId) ||
      thuPhuc.includes(garmentId) ||
      hai.includes(garmentId) ||
      (phuKien && phuKien.includes(garmentId))
    );
  });
}
