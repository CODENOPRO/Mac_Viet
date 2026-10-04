// Kho ảnh tham chiếu hiện vật chuẩn mực theo hình khối hiện vật lịch sử
const buildGarmentSvg = (id: string, ten: string, content: string): string => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 300" width="480" height="600">
  <rect width="240" height="300" fill="#F2EDE3" />
  <rect x="6" y="6" width="228" height="288" fill="none" stroke="#C39A27" stroke-width="1" opacity="0.4" />
  <text x="14" y="24" font-family="JetBrains Mono, monospace" font-size="9" fill="#6E5439" letter-spacing="1">HIEN VAT ${id}</text>
  <text x="14" y="38" font-family="Fraunces, serif" font-size="11" fill="#2C2A26">${ten}</text>
  ${content}
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const GARMENT_REFERENCE_IMAGES: Record<string, string> = {
  G01: buildGarmentSvg(
    'G01',
    'Áo giao lĩnh',
    `<g>
      <path d="M 60,60 L 180,60 L 210,270 L 30,270 Z" fill="#16243A" opacity="0.95" />
      <path d="M 150,60 L 80,150 L 160,270 L 210,270 Z" fill="#F2EDE3" opacity="0.4" />
      <path d="M 90,60 L 165,145 L 85,270 L 30,270 Z" fill="#16243A" />
      <path d="M 85,60 L 165,145 M 155,60 L 115,110" stroke="#C39A27" stroke-width="2.5" stroke-linecap="round" />
      <path d="M 60,60 L 15,130 L 45,150 L 70,110" fill="#16243A" />
      <path d="M 180,60 L 225,130 L 195,150 L 170,110" fill="#16243A" />
      <rect x="75" y="145" width="90" height="8" fill="#A8322A" rx="1" />
      <path d="M 115,153 L 110,220 M 122,153 L 126,210" stroke="#A8322A" stroke-width="3" stroke-linecap="round" />
    </g>`
  ),
  G02: buildGarmentSvg(
    'G02',
    'Áo viên lĩnh',
    `<g>
      <path d="M 65,65 L 175,65 L 215,270 L 25,270 Z" fill="#16243A" />
      <path d="M 95,65 Q 120,85 145,65" fill="none" stroke="#C39A27" stroke-width="3.5" />
      <path d="M 145,65 L 175,95 L 175,170" fill="none" stroke="#C39A27" stroke-width="2" stroke-dasharray="4 2" />
      <circle cx="150" cy="72" r="2.5" fill="#C39A27" />
      <circle cx="165" cy="88" r="2.5" fill="#C39A27" />
      <circle cx="175" cy="115" r="2.5" fill="#C39A27" />
      <rect x="95" y="105" width="50" height="50" fill="#A8322A" stroke="#C39A27" stroke-width="1.5" />
      <circle cx="120" cy="130" r="14" fill="#C39A27" opacity="0.3" />
      <path d="M 110,130 Q 120,118 130,130" stroke="#F2EDE3" stroke-width="1.5" fill="none" />
      <path d="M 65,65 L 10,130 L 40,155 L 75,115" fill="#16243A" />
      <path d="M 175,65 L 230,130 L 200,155 L 165,115" fill="#16243A" />
    </g>`
  ),
  G03: buildGarmentSvg(
    'G03',
    'Áo tứ thân',
    `<g>
      <path d="M 75,60 L 165,60 L 195,270 L 45,270 Z" fill="#6E5439" opacity="0.85" />
      <polygon points="120,70 100,105 140,105" fill="#C9556A" />
      <line x1="120" y1="60" x2="120" y2="270" stroke="#2C2A26" stroke-width="1.5" stroke-opacity="0.4" />
      <path d="M 75,60 L 105,150 L 80,260 L 55,240 Z" fill="#6E5439" />
      <path d="M 165,60 L 135,150 L 160,260 L 185,240 Z" fill="#6E5439" />
      <rect x="95" y="145" width="50" height="6" fill="#A8322A" />
      <path d="M 116,151 L 110,215 M 124,151 L 128,210" stroke="#A8322A" stroke-width="2.5" stroke-linecap="round" />
      <path d="M 75,60 L 30,140 L 50,150 L 80,105" fill="#6E5439" />
      <path d="M 165,60 L 210,140 L 190,150 L 160,105" fill="#6E5439" />
    </g>`
  ),
  G04: buildGarmentSvg(
    'G04',
    'Áo ngũ thân tay chẽn',
    `<g>
      <path d="M 75,55 L 165,55 L 190,270 L 50,270 Z" fill="#16243A" />
      <rect x="106" y="48" width="28" height="12" rx="2" fill="#F2EDE3" stroke="#2C2A26" stroke-width="1" />
      <path d="M 120,60 L 150,85 L 152,165" fill="none" stroke="#C39A27" stroke-width="1.5" />
      <circle cx="120" cy="54" r="2" fill="#C39A27" />
      <circle cx="132" cy="70" r="2" fill="#C39A27" />
      <circle cx="148" cy="85" r="2" fill="#C39A27" />
      <circle cx="151" cy="115" r="2" fill="#C39A27" />
      <circle cx="152" cy="145" r="2" fill="#C39A27" />
      <path d="M 75,55 L 40,150 L 55,155 L 85,95" fill="#16243A" />
      <path d="M 165,55 L 200,150 L 185,155 L 155,95" fill="#16243A" />
    </g>`
  ),
  G05: buildGarmentSvg(
    'G05',
    'Áo tấc',
    `<g>
      <path d="M 70,55 L 170,55 L 195,275 L 45,275 Z" fill="#16243A" />
      <rect x="105" y="48" width="30" height="12" rx="2" fill="#F2EDE3" stroke="#2C2A26" stroke-width="1" />
      <path d="M 120,60 L 150,85 L 152,160" fill="none" stroke="#C39A27" stroke-width="1.5" />
      <circle cx="120" cy="54" r="2" fill="#C39A27" />
      <circle cx="148" cy="85" r="2" fill="#C39A27" />
      <circle cx="152" cy="130" r="2" fill="#C39A27" />
      <path d="M 70,55 L 10,150 L 30,225 L 75,140" fill="#16243A" stroke="#C39A27" stroke-width="1" />
      <path d="M 170,55 L 230,150 L 210,225 L 165,140" fill="#16243A" stroke="#C39A27" stroke-width="1" />
    </g>`
  ),
  G06: buildGarmentSvg(
    'G06',
    'Áo Nhật Bình',
    `<g>
      <path d="M 70,55 L 170,55 L 200,270 L 40,270 Z" fill="#A8322A" />
      <rect x="100" y="55" width="40" height="55" fill="#F2EDE3" stroke="#C39A27" stroke-width="2" />
      <rect x="104" y="65" width="6" height="110" fill="#A8322A" />
      <rect x="111" y="65" width="6" height="110" fill="#C39A27" />
      <rect x="118" y="65" width="6" height="110" fill="#16243A" />
      <rect x="125" y="65" width="6" height="110" fill="#2D6A4F" />
      <rect x="132" y="65" width="6" height="110" fill="#F2EDE3" />
      <path d="M 70,55 L 15,140 L 40,165 L 75,115" fill="#A8322A" />
      <path d="M 170,55 L 225,140 L 200,165 L 165,115" fill="#A8322A" />
      <rect x="18" y="142" width="22" height="6" fill="#C39A27" transform="rotate(35 18 142)" />
      <rect x="202" y="156" width="22" height="6" fill="#C39A27" transform="rotate(-35 202 156)" />
    </g>`
  ),
  G08: buildGarmentSvg(
    'G08',
    'Áo dài tân thời',
    `<g>
      <path d="M 90,55 Q 100,120 92,150 L 75,275 L 165,275 L 148,150 Q 140,120 150,55 Z" fill="#F2EDE3" />
      <rect x="108" y="44" width="24" height="14" rx="2" fill="#F2EDE3" stroke="#C39A27" stroke-width="1" />
      <path d="M 120,58 Q 140,70 148,105" fill="none" stroke="#2C2A26" stroke-width="1" stroke-dasharray="2 2" />
      <path d="M 90,55 L 50,165 L 62,170 L 98,100" fill="#F2EDE3" />
      <path d="M 150,55 L 190,165 L 178,170 L 142,100" fill="#F2EDE3" />
    </g>`
  ),
  G09: buildGarmentSvg(
    'G09',
    'Áo bà ba',
    `<g>
      <path d="M 75,65 L 165,65 L 175,210 L 155,210 L 145,180 L 95,180 L 85,210 L 65,210 Z" fill="#2C2A26" />
      <path d="M 105,65 Q 120,85 135,65" fill="none" stroke="#F2EDE3" stroke-width="2" />
      <line x1="120" y1="85" x2="120" y2="180" stroke="#F2EDE3" stroke-width="1.5" />
      <circle cx="120" cy="100" r="2" fill="#C39A27" />
      <circle cx="120" cy="125" r="2" fill="#C39A27" />
      <circle cx="120" cy="150" r="2" fill="#C39A27" />
      <path d="M 75,65 L 35,150 L 50,155 L 80,105" fill="#2C2A26" />
      <path d="M 165,65 L 205,150 L 190,155 L 160,105" fill="#2C2A26" />
    </g>`
  ),
  G10: buildGarmentSvg(
    'G10',
    'Quần lụa ống rộng',
    `<g>
      <rect x="70" y="60" width="100" height="12" fill="#D8D0C2" />
      <path d="M 75,72 L 50,265 L 110,265 L 116,130 Z" fill="#F2EDE3" stroke="#D8D0C2" stroke-width="1" />
      <path d="M 165,72 L 190,265 L 130,265 L 124,130 Z" fill="#F2EDE3" stroke="#D8D0C2" stroke-width="1" />
      <line x1="80" y1="90" x2="80" y2="250" stroke="#6E5439" stroke-width="0.8" opacity="0.3" />
      <line x1="160" y1="90" x2="160" y2="250" stroke="#6E5439" stroke-width="0.8" opacity="0.3" />
    </g>`
  ),
  G11: buildGarmentSvg(
    'G11',
    'Váy đụp',
    `<g>
      <rect x="75" y="70" width="90" height="14" fill="#6E5439" rx="2" />
      <path d="M 80,84 L 55,260 L 185,260 L 160,84 Z" fill="#2C2A26" />
      <line x1="115" y1="84" x2="105" y2="260" stroke="#0D1826" stroke-width="1.5" opacity="0.5" />
    </g>`
  ),
  G12: buildGarmentSvg(
    'G12',
    'Khăn vấn',
    `<g>
      <ellipse cx="120" cy="150" rx="60" ry="45" fill="#201F1C" />
      <ellipse cx="120" cy="145" rx="75" ry="35" fill="none" stroke="#2C2A26" stroke-width="22" />
      <ellipse cx="120" cy="145" rx="75" ry="35" fill="none" stroke="#C39A27" stroke-width="1" opacity="0.6" />
      <path d="M 50,145 Q 120,170 190,145" stroke="#F2EDE3" stroke-width="1" fill="none" opacity="0.4" />
    </g>`
  ),
  G13: buildGarmentSvg(
    'G13',
    'Khăn đóng',
    `<g>
      <ellipse cx="120" cy="150" rx="70" ry="32" fill="#201F1C" />
      <ellipse cx="120" cy="140" rx="74" ry="28" fill="none" stroke="#2C2A26" stroke-width="18" />
      <path d="M 54,138 Q 120,162 186,138" stroke="#C39A27" stroke-width="1" fill="none" opacity="0.4" />
      <path d="M 58,144 Q 120,168 182,144" stroke="#C39A27" stroke-width="1" fill="none" opacity="0.5" />
      <path d="M 62,150 Q 120,174 178,150" stroke="#C39A27" stroke-width="1" fill="none" opacity="0.6" />
    </g>`
  ),
  G14: buildGarmentSvg(
    'G14',
    'Nón quai thao',
    `<g>
      <ellipse cx="120" cy="130" rx="95" ry="38" fill="#F2EDE3" stroke="#C39A27" stroke-width="2" />
      <ellipse cx="120" cy="130" rx="40" ry="16" fill="#E8DEC8" stroke="#6E5439" stroke-width="1" />
      <circle cx="120" cy="130" r="10" fill="#C39A27" opacity="0.4" />
      <path d="M 60,145 C 50,190 70,250 80,280" stroke="#A8322A" stroke-width="4" fill="none" stroke-linecap="round" />
      <path d="M 180,145 C 190,190 170,250 160,280" stroke="#A8322A" stroke-width="4" fill="none" stroke-linecap="round" />
      <circle cx="80" cy="278" r="4" fill="#C39A27" />
      <circle cx="160" cy="278" r="4" fill="#C39A27" />
    </g>`
  ),
  G15: buildGarmentSvg(
    'G15',
    'Hài thêu',
    `<g>
      <path d="M 40,180 Q 80,170 110,185 Q 115,160 100,150 Q 60,155 40,180 Z" fill="#A8322A" />
      <path d="M 40,180 Q 25,170 20,155 Q 35,165 50,175" fill="#A8322A" stroke="#C39A27" stroke-width="1.5" />
      <rect x="35" y="180" width="75" height="8" rx="2" fill="#D8D0C2" />
      <path d="M 32,165 Q 45,160 55,168" stroke="#C39A27" stroke-width="1.5" fill="none" />
      <path d="M 130,180 Q 170,170 200,185 Q 205,160 190,150 Q 150,155 130,180 Z" fill="#A8322A" />
      <path d="M 130,180 Q 115,170 110,155 Q 125,165 140,175" fill="#A8322A" stroke="#C39A27" stroke-width="1.5" />
      <rect x="125" y="180" width="75" height="8" rx="2" fill="#D8D0C2" />
      <path d="M 122,165 Q 135,160 145,168" stroke="#C39A27" stroke-width="1.5" fill="none" />
    </g>`
  ),
  G16: buildGarmentSvg(
    'G16',
    'Yếm',
    `<g>
      <polygon points="120,65 185,160 120,250 55,160" fill="#A8322A" stroke="#C39A27" stroke-width="1.5" />
      <path d="M 95,100 Q 120,125 145,100" fill="none" stroke="#F2EDE3" stroke-width="2.5" />
      <path d="M 105,85 L 120,50 L 135,85" stroke="#F2EDE3" stroke-width="1.5" fill="none" />
      <line x1="55" y1="160" x2="30" y2="175" stroke="#F2EDE3" stroke-width="2" stroke-linecap="round" />
      <line x1="185" y1="160" x2="210" y2="175" stroke="#F2EDE3" stroke-width="2" stroke-linecap="round" />
    </g>`
  )
};
