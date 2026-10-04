import { Background } from '../types';
import { hexToHsl, tinhKhoangCachHue } from '../lib/colorHarmony';

// Phông studio trơn một màu. Ngoại cảnh do model vẽ trông giả, nên chỉ dùng phông studio.
const MOI_VUNG = ['R01', 'R02', 'R03', 'R04', 'bac', 'trung', 'nam', 'tay_bac', 'toan_quoc'];

const phong = (hex: string, ten: string): string =>
  `seamless studio paper backdrop in a single solid ${ten} colour, hex ${hex}, with a gentle darker falloff towards the edges, no props, no furniture, no scenery, no floor texture`;

export const BACKGROUNDS: Background[] = [
  {
    id: 'BG1',
    ten: 'Phông đỏ đô trầm',
    hex: '#6E1E26',
    moTaChoAI: phong('#6E1E26', 'deep burgundy red'),
    hopVoiSuKien: ['E01', 'E03', 'E08', 'E02', 'E06', 'E07'],
    hopVoiVung: MOI_VUNG,
  },
  {
    id: 'BG2',
    ten: 'Phông chàm sâu',
    hex: '#1E2A3A',
    moTaChoAI: phong('#1E2A3A', 'deep indigo'),
    hopVoiSuKien: ['E01', 'E03', 'E08', 'E05'],
    hopVoiVung: MOI_VUNG,
  },
  {
    id: 'BG3',
    ten: 'Phông ngà',
    hex: '#ECE5D8',
    moTaChoAI: phong('#ECE5D8', 'warm ivory'),
    hopVoiSuKien: ['E01', 'E02', 'E03', 'E04', 'E05', 'E06', 'E07', 'E08'],
    hopVoiVung: MOI_VUNG,
  },
  {
    id: 'BG4',
    ten: 'Phông nâu trầm',
    hex: '#4A3A2C',
    moTaChoAI: phong('#4A3A2C', 'dark earthy brown'),
    hopVoiSuKien: ['E05', 'E02', 'E06', 'E07'],
    hopVoiVung: MOI_VUNG,
  },
  {
    id: 'BG5',
    ten: 'Phông lục trầm',
    hex: '#2F4A40',
    moTaChoAI: phong('#2F4A40', 'deep muted green'),
    hopVoiSuKien: ['E04'],
    hopVoiVung: MOI_VUNG,
  },
  {
    id: 'BG6',
    ten: 'Phông xám ấm',
    hex: '#8C857B',
    moTaChoAI: phong('#8C857B', 'warm grey'),
    hopVoiSuKien: ['E04', 'E02', 'E06', 'E07'],
    hopVoiVung: MOI_VUNG,
  },
];

// Thứ tự ưu tiên phông theo không khí của từng dịp.
const THU_TU_THEO_DIP: Record<string, string[]> = {
  E01: ['BG1', 'BG3', 'BG2'], // Tết
  E03: ['BG1', 'BG3', 'BG2'], // cưới hỏi
  E08: ['BG1', 'BG2', 'BG3'], // biểu diễn
  E04: ['BG5', 'BG3', 'BG6'], // lễ chùa
  E05: ['BG2', 'BG3', 'BG4'], // giỗ, gia tiên
  E02: ['BG3', 'BG1', 'BG4', 'BG6'], // kỷ yếu
  E06: ['BG3', 'BG1', 'BG4', 'BG6'], // ra mắt gia đình
  E07: ['BG3', 'BG1', 'BG4', 'BG6'], // phố cổ
};

/**
 * Chọn phông theo dịp, rồi lấy phông đầu tiên hợp với màu áo:
 * không cùng họ màu với áo, và đủ tương phản để tôn bộ đồ.
 * vung giữ lại để không phải đổi chỗ gọi; phông studio không phụ thuộc vùng.
 */
export function chonBoiCanhTuDong(suKien?: string, vung?: string, mauAoHex?: string): Background {
  const macDinh = BACKGROUNDS[2];
  const thuTu = (THU_TU_THEO_DIP[(suKien || '').toUpperCase()] || ['BG3', 'BG1', 'BG2'])
    .map((id) => BACKGROUNDS.find((b) => b.id === id))
    .filter((b): b is Background => !!b);
  if (!mauAoHex) return thuTu[0] || macDinh;

  const ao = hexToHsl(mauAoHex);
  const hop = (b: Background) => {
    const p = hexToHsl(b.hex || '#ECE5D8');
    // Phông rất sáng hoặc rất tối đọc như trung tính, dù độ bão hoà HSL có thể cao.
    const phongTrungTinh = p.s < 15 || p.l > 80 || p.l < 20;
    const cungHoMau = !phongTrungTinh && ao.s >= 20 && tinhKhoangCachHue(p.h, ao.h) < 40;
    const duTuongPhan = Math.abs(p.l - ao.l) >= 20 || (ao.s < 20 && p.s > 40);
    return !cungHoMau && duTuongPhan;
  };
  return thuTu.find(hop) || macDinh;
}
