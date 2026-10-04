import { NamedColor, Palette } from '../types';

export const TRADITIONAL_COLORS: NamedColor[] = [
  {
    id: 'clr-cham',
    ten: 'Chàm',
    hex: '#16243A',
    yNghia: 'Nhuộm từ cây chàm, nền của nhiều vùng'
  },
  {
    id: 'clr-cham-sau',
    ten: 'Chàm sâu',
    hex: '#0D1826',
    yNghia: 'Tông tối nhất, không bao giờ dùng đen tuyệt đối'
  },
  {
    id: 'clr-dieu',
    ten: 'Điều',
    hex: '#A8322A',
    yNghia: 'Đỏ trầm, dùng làm điểm nhấn duy nhất'
  },
  {
    id: 'clr-yem-dao',
    ten: 'Yếm đào',
    hex: '#C9556A',
    yNghia: 'Hồng đỏ của cổ yếm'
  },
  {
    id: 'clr-nau-non',
    ten: 'Nâu non',
    hex: '#6E5439',
    yNghia: 'Nâu đất Bắc Bộ mộc mạc'
  },
  {
    id: 'clr-the-den',
    ten: 'The đen',
    hex: '#2C2A26',
    yNghia: 'Đen ngả nâu, không phải đen tuyệt đối'
  },
  {
    id: 'clr-nga',
    ten: 'Ngà',
    hex: '#F2EDE3',
    yNghia: 'Trắng ngả vàng'
  },
  {
    id: 'clr-gao',
    ten: 'Gạo',
    hex: '#FBF8F2',
    yNghia: 'Trắng sáng nhất'
  },
  {
    id: 'clr-hoang',
    ten: 'Hoàng',
    hex: '#C39A27',
    yNghia: 'Vàng kim loại, dùng cho nét mảnh'
  },
  {
    id: 'clr-hoang-yen',
    ten: 'Hoàng yến',
    hex: '#E2C15E',
    yNghia: 'Vàng nhạt'
  },
  {
    id: 'clr-luc-biec',
    ten: 'Lục biếc',
    hex: '#3F6B5A',
    yNghia: 'Xanh lá trầm'
  },
  {
    id: 'clr-tam-giang',
    ten: 'Tam giang',
    hex: '#7B8FA1',
    yNghia: 'Xanh xám nhạt'
  },
  {
    id: 'clr-tia-hue',
    ten: 'Tía Huế',
    hex: '#5E3B5A',
    yNghia: 'Tím trầm đặc trưng Huế'
  },
  {
    id: 'clr-muc-tau',
    ten: 'Mực tàu',
    hex: '#1C1C1A',
    yNghia: 'Đen mực'
  }
];

export const HISTORICAL_PALETTES: Palette[] = [
  {
    id: 'pal-bac-bo-dan-gian',
    ten: 'Bắc Bộ dân gian',
    mauSac: ['#6E5439', '#2C2A26', '#C9556A', '#F2EDE3'],
    moTa: 'Nâu non, the đen, yếm đào, ngà',
    thoiKyHoacVung: 'Bắc Bộ'
  },
  {
    id: 'pal-hue-nghi-le',
    ten: 'Huế nghi lễ',
    mauSac: ['#5E3B5A', '#C39A27', '#F2EDE3', '#16243A'],
    moTa: 'Tía Huế, hoàng, ngà, chàm',
    thoiKyHoacVung: 'Trung Bộ (Huế)'
  },
  {
    id: 'pal-cham-dieu-nga',
    ten: 'Chàm điều ngà',
    mauSac: ['#16243A', '#A8322A', '#F2EDE3'],
    moTa: 'Chàm, điều, ngà (bảng an toàn nhất, hợp gần như mọi bối cảnh)',
    thoiKyHoacVung: 'Toàn quốc'
  },
  {
    id: 'pal-nam-bo-tron',
    ten: 'Nam Bộ trơn',
    mauSac: ['#F2EDE3', '#2C2A26', '#3F6B5A'],
    moTa: 'Ngà, the đen, lục biếc',
    thoiKyHoacVung: 'Nam Bộ'
  },
  {
    id: 'pal-xuan-hoi',
    ten: 'Xuân hội',
    mauSac: ['#A8322A', '#E2C15E', '#F2EDE3', '#3F6B5A'],
    moTa: 'Điều, hoàng yến, ngà, lục biếc',
    thoiKyHoacVung: 'Toàn quốc lễ hội'
  },
  {
    id: 'pal-tinh-le',
    ten: 'Tĩnh lễ',
    mauSac: ['#0D1826', '#2C2A26', '#F2EDE3'],
    moTa: 'Chàm sâu, the đen, ngà (dùng cho giỗ chạp, lễ gia tiên)',
    thoiKyHoacVung: 'Thờ tự cổ truyền'
  }
];

export function layTenMucTrangTrong(level?: number): string {
  switch (level) {
    case 1:
      return 'Thường ngày';
    case 2:
      return 'Dạo phố';
    case 3:
      return 'Có lễ';
    case 4:
      return 'Trang trọng';
    case 5:
      return 'Đại lễ';
    default:
      return 'Thường ngày';
  }
}

export function layTenMau(hex?: string): string {
  if (!hex) return 'Màu tự nhiên';
  const clean = hex.trim().toUpperCase();
  const match = TRADITIONAL_COLORS.find((c) => c.hex.toUpperCase() === clean);
  if (match) return match.ten;
  if (clean === '#FFFFFF') return 'Bạch lụa';
  if (clean === '#000000') return 'The đen';
  if (clean === '#B8860B') return 'Hoàng kim';
  if (clean === '#8B0000') return 'Huyết dụ';
  return 'Sắc tự nhiên';
}

