import { LookState } from '../types';

// Màu thật của từng lớp trong bộ đồ. Thượng y lấy màu chính người dùng chọn; hạ y và thủ phục lấy màu
// người dùng chọn trong màu truyền thống của món, chưa chọn thì là màu đầu tiên của món.
// Luật văn hoá, điểm hài hoà và prompt ảnh đều đọc màu qua đây, để cùng một bộ đồ không bị hiểu hai kiểu.

export const mauThuongY = (look: LookState): string | undefined =>
  look.mauChinh || look.thuongY?.mauTruyenThong?.[0];

export const mauHaY = (look: LookState): string | undefined =>
  look.haY ? look.mauHaY || look.haY.mauTruyenThong?.[0] : undefined;

export const mauThuPhuc = (look: LookState): string | undefined =>
  look.thuPhuc ? look.mauThuPhuc || look.thuPhuc.mauTruyenThong?.[0] : undefined;

export const mauHai = (look: LookState): string | undefined => look.hai?.mauTruyenThong?.[0];

export const cungMau = (a?: string, b?: string): boolean =>
  Boolean(a && b && a.toUpperCase() === b.toUpperCase());
