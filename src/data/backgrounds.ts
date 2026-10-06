import { Background } from '../types';

// Bối cảnh chụp thật theo dịp và vùng miền, không dùng phông studio.
// Mỗi dịp là một không gian. Vùng miền quyết định kiến trúc, cây cối và ánh sáng.
// moTaChoAI có chỗ trống {kienTruc} {hoaTet} {phoCo}; moTaBoiCanh() điền theo vùng trước khi gửi model.

interface CanhVung {
  kienTruc: string;
  hoaTet: string;
  phoCo: string;
  anhSang: string;
  ghiChu?: string;
}

const VUNG: Record<string, CanhVung> = {
  R01: {
    kienTruc:
      'northern Vietnamese village architecture: weathered red-brick walls, dark mossy fish-scale roof tiles, ironwood pillars, a worn brick-paved courtyard',
    hoaTet: 'a pink peach-blossom tree',
    phoCo:
      'a narrow Hanoi old quarter street with moss-stained ochre facades, green wooden shutters and overhead wires',
    anhSang: 'soft hazy northern light',
  },
  R02: {
    kienTruc:
      'Hue heritage architecture: aged moss-stained lime-washed walls, faded red lacquered wooden columns, curved tube-tile roofs, pine and frangipani trees',
    hoaTet: 'a yellow apricot-blossom (mai) tree',
    phoCo:
      'a quiet Hoi An old town street with ochre-yellow walls, dark wooden doors and unlit silk lanterns',
    anhSang: 'soft diffused overcast light',
  },
  R03: {
    kienTruc:
      'southern Vietnamese countryside architecture: a wooden three-room house with dark timber columns and a tiled roof, a swept earth yard, coconut and nipa palms',
    hoaTet: 'yellow apricot blossoms (mai) in glazed ceramic pots',
    phoCo:
      'a Saigon alley with old shophouses, faded green shutters, potted plants and a small sidewalk café softly blurred',
    anhSang: 'warm bright southern daylight',
  },
  R04: {
    kienTruc:
      'a northwest Vietnam mountain setting: wooden stilt houses, a stone path, terraced rice fields and misty mountains in the distance',
    hoaTet: 'white plum and pink peach blossoms on bare branches',
    phoCo: 'a small mountain-town street with wooden houses and a misty hillside behind',
    anhSang: 'cool clear mountain light',
    ghiChu: 'Do not depict any ethnic-minority ceremony or costume, and no other people.',
  },
};

// Chưa chọn vùng, hoặc chọn toàn quốc
const VUNG_CHUNG: CanhVung = {
  kienTruc:
    'traditional Vietnamese architecture: aged lime-washed walls, dark wooden pillars, a tiled roof, a brick-paved courtyard',
  hoaTet: 'yellow apricot and pink peach blossoms',
  phoCo: 'a quiet old-town street with weathered ochre walls and dark wooden shutters',
  anhSang: 'soft natural daylight',
};

const BI_DANH_VUNG: Record<string, string> = { bac: 'R01', trung: 'R02', nam: 'R03', tay_bac: 'R04' };

const MOI_VUNG = ['R01', 'R02', 'R03', 'R04', 'bac', 'trung', 'nam', 'tay_bac', 'toan_quoc'];

const canh = (id: string, suKien: string, ten: string, moTaChoAI: string): Background => ({
  id,
  ten,
  moTaChoAI,
  hopVoiSuKien: [suKien],
  hopVoiVung: MOI_VUNG,
});

export const BACKGROUNDS: Background[] = [
  canh(
    'BC-E01',
    'E01',
    'Sân nhà ngày Tết',
    'the front courtyard of a traditional family house decorated for Lunar New Year, {kienTruc}, with {hoaTet} beside the person and red paper decorations that carry no legible writing; mid-morning'
  ),
  canh(
    'BC-E02',
    'E02',
    'Sân trường mùa phượng',
    'an old school courtyard with a yellow colonial-era building, stone benches and a red flame tree (phuong) in bloom, {kienTruc} in the far background; late afternoon with dappled sunlight'
  ),
  canh(
    'BC-E03',
    'E03',
    'Sân nhà có rạp cưới',
    'the courtyard of a family house prepared for a traditional Vietnamese wedding, {kienTruc}, a fabric wedding canopy and fresh flower arrangements softly blurred behind, no bride and no groom; morning'
  ),
  canh(
    'BC-E04',
    'E04',
    'Sân chùa',
    'the stone-paved courtyard of a Vietnamese pagoda, curved temple roofs, an incense burner with a thin wisp of smoke, old bodhi or frangipani trees, {kienTruc}; early morning, calm'
  ),
  canh(
    'BC-E05',
    'E05',
    'Hiên nhà thờ họ',
    'the veranda in front of the ancestral worship hall of an old family house, {kienTruc}, dark lacquered wooden doors open with a warm candle glow inside, carved wooden panels softly blurred with no legible characters; soft morning light, solemn mood'
  ),
  canh(
    'BC-E06',
    'E06',
    'Hiên nhà, sân trước',
    'the porch and front yard of a cosy traditional family house, {kienTruc}, wooden doors, potted plants and a low tea table softly blurred; late morning'
  ),
  canh('BC-E07', 'E07', 'Phố cổ', '{phoCo}; golden late afternoon'),
  canh(
    'BC-E08',
    'E08',
    'Sân đình biểu diễn',
    'an open courtyard of a heritage communal house used as a performance space, {kienTruc}, red fabric drapes and a low wooden stage softly blurred behind; late afternoon with warm light'
  ),
];

/** Chọn không gian theo dịp. Không khớp dịp nào thì về hiên nhà, cảnh trung tính nhất. */
export function chonBoiCanhTuDong(suKien?: string): Background {
  const ma = (suKien || '').toUpperCase();
  return BACKGROUNDS.find((b) => b.hopVoiSuKien.includes(ma)) || BACKGROUNDS[5];
}

function cauThoiTiet(thoiTiet?: { mua?: boolean; nhietDo?: number }): string {
  if (!thoiTiet) return '';
  if (thoiTiet.mua) return 'overcast just after rain, damp stone ground, no rain falling on the person';
  const t = thoiTiet.nhietDo;
  if (t === undefined) return '';
  if (t < 18) return 'cool misty air, soft diffused light';
  if (t >= 32) return 'hot clear day, bright sunlight softened by shade';
  return 'clear dry air, soft sunlight';
}

/** Câu tả cảnh tiếng Anh gửi model: không gian của dịp, ghép kiến trúc và ánh sáng của vùng, cộng thời tiết. */
export function moTaBoiCanh(
  bg: Background,
  vungId?: string,
  thoiTiet?: { mua?: boolean; nhietDo?: number }
): string {
  const v = VUNG[BI_DANH_VUNG[vungId || ''] || vungId || ''] || VUNG_CHUNG;
  const [noiChup, gio] = bg.moTaChoAI
    .replace('{kienTruc}', v.kienTruc)
    .replace('{hoaTet}', v.hoaTet)
    .replace('{phoCo}', v.phoCo)
    .split('; ');
  // Mưa hoặc lạnh thì thời tiết quyết định ánh sáng, không chồng thêm nắng của vùng
  const tt = cauThoiTiet(thoiTiet);
  const trumAnhSang = Boolean(thoiTiet?.mua) || (thoiTiet?.nhietDo !== undefined && thoiTiet.nhietDo < 18);
  const anhSang = trumAnhSang ? tt : [v.anhSang, tt].filter(Boolean).join(', ');
  return [
    `LOCATION: ${noiChup}.`,
    gio ? `TIME: ${gio}.` : '',
    `LIGHT: ${anhSang}.`,
    v.ghiChu || '',
  ]
    .filter(Boolean)
    .join(' ');
}
