import { Background } from '../types';

export const BACKGROUNDS: Background[] = [
  {
    id: 'BG1',
    ten: 'Sân đình Bắc Bộ',
    moTaChoAI: 'old brick courtyard of a northern Vietnamese communal house, weathered wooden pillars, mossy tiled roof, soft late afternoon light',
    hopVoiSuKien: ['E01', 'E04', 'E05', 'E08'],
    hopVoiVung: ['R01', 'bac', 'toan_quoc']
  },
  {
    id: 'BG2',
    ten: 'Tường vôi nhà cổ',
    moTaChoAI: 'plain aged ivory lime-washed wall, gently peeling texture, strong side light from a window, very simple background',
    hopVoiSuKien: ['E02', 'E06', 'E07'],
    hopVoiVung: ['R01', 'R02', 'R03', 'R04', 'bac', 'trung', 'nam', 'tay_bac', 'toan_quoc']
  },
  {
    id: 'BG3',
    ten: 'Hành lang Đại Nội Huế',
    moTaChoAI: 'corridor of the Hue imperial citadel, deep red lacquered columns, diffused overcast light',
    hopVoiSuKien: ['E03', 'E05', 'E08'],
    hopVoiVung: ['R02', 'trung']
  },
  {
    id: 'BG4',
    ten: 'Nhà cổ Hội An',
    moTaChoAI: 'Hoi An old town house, ochre yellow wall, dark wooden shutters, blurred lanterns in the background',
    hopVoiSuKien: ['E01', 'E02', 'E07'],
    hopVoiVung: ['R02', 'trung']
  },
  {
    id: 'BG5',
    ten: 'Phố cổ Hà Nội',
    moTaChoAI: 'narrow Hanoi old quarter street, mossy walls, a blurred bicycle far behind, shallow depth of field',
    hopVoiSuKien: ['E02', 'E07'],
    hopVoiVung: ['R01', 'bac']
  },
  {
    id: 'BG6',
    ten: 'Bến sông Nam Bộ',
    moTaChoAI: 'southern Vietnam riverbank, wooden sampan blurred in the distance, nipa palms, early morning light',
    hopVoiSuKien: ['E01', 'E07', 'E08'],
    hopVoiVung: ['R03', 'nam']
  },
  {
    id: 'BG7',
    ten: 'Sân trường',
    moTaChoAI: 'Vietnamese school yard, stone benches, flame tree, yellow wall, dappled sunlight',
    hopVoiSuKien: ['E02'],
    hopVoiVung: ['R01', 'R02', 'R03', 'bac', 'trung', 'nam', 'toan_quoc']
  },
  {
    id: 'BG8',
    ten: 'Phòng studio trơn',
    moTaChoAI: 'seamless studio backdrop in ivory or indigo, single soft light source, no props',
    hopVoiSuKien: ['E02', 'E03', 'E06', 'E08'],
    hopVoiVung: ['R01', 'R02', 'R03', 'R04', 'bac', 'trung', 'nam', 'tay_bac', 'toan_quoc']
  }
];

export function chonBoiCanhTuDong(suKien?: string, vung?: string): Background {
  const defaultBg = BACKGROUNDS.find((b) => b.id === 'BG2') || BACKGROUNDS[0];
  if (!suKien && !vung) {
    return defaultBg;
  }

  // Chuẩn hóa mã vùng
  const normalizedRegion = (vung || '').toLowerCase();
  const normalizedEvent = (suKien || '').toUpperCase();

  // 1. Tìm bối cảnh khớp cả sự kiện lẫn vùng miền
  const exactMatch = BACKGROUNDS.find((b) => {
    const matchEvent = b.hopVoiSuKien.includes(normalizedEvent);
    const matchRegion = b.hopVoiVung.some((r) => r.toLowerCase() === normalizedRegion);
    return matchEvent && matchRegion;
  });

  if (exactMatch) {
    return exactMatch;
  }

  // 2. Tìm bối cảnh khớp sự kiện trước
  const eventMatch = BACKGROUNDS.find((b) => b.hopVoiSuKien.includes(normalizedEvent));
  if (eventMatch) {
    return eventMatch;
  }

  // 3. Tìm bối cảnh khớp vùng miền
  const regionMatch = BACKGROUNDS.find((b) =>
    b.hopVoiVung.some((r) => r.toLowerCase() === normalizedRegion)
  );
  if (regionMatch) {
    return regionMatch;
  }

  // 4. Mặc định về BG2: Tường vôi nhà cổ
  return defaultBg;
}
