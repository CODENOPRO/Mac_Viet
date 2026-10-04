// Kho lưu trữ đường dẫn hình ảnh cho toàn bộ landing và ứng dụng
// Sử dụng SVG vector mỹ thuật cao đúng tỉ lệ, tông màu chuẩn hệ màu Mặc Việt, không dùng ảnh rác ngoài luồng
export const IMAGES = {
  heroChamAo: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
    <defs>
      <radialGradient id="clothLight" cx="65%" cy="35%" r="75%">
        <stop offset="0%" stop-color="%231E3352" />
        <stop offset="45%" stop-color="%2316243A" />
        <stop offset="85%" stop-color="%230D1826" />
        <stop offset="100%" stop-color="%2308101A" />
      </radialGradient>
      <linearGradient id="foldGlow" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="%23C39A27" stop-opacity="0.25"/>
        <stop offset="50%" stop-color="%2316243A" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="lapel" x1="30%" y1="0%" x2="80%" y2="100%">
        <stop offset="0%" stop-color="%23223A5E"/>
        <stop offset="60%" stop-color="%2316243A"/>
        <stop offset="100%" stop-color="%230D1826"/>
      </linearGradient>
      <filter id="fabricNoise" x="0%" y="0%" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" result="noise"/>
        <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.05 0"/>
        <feBlend in="SourceGraphic" in2="noise" mode="multiply"/>
      </filter>
    </defs>
    <rect width="1920" height="1080" fill="url(%23clothLight)" filter="url(%23fabricNoise)"/>
    <!-- Các nếp gấp tà áo ngũ thân chàm lộng lẫy và đường chỉ may tinh tế -->
    <path d="M 400,-100 Q 800,450 1400,1180 L 1920,1180 L 1920,-100 Z" fill="url(%23lapel)" opacity="0.85"/>
    <path d="M 350,-100 Q 750,450 1350,1180" stroke="%23C39A27" stroke-width="1.5" stroke-opacity="0.4" fill="none"/>
    <path d="M 520,-80 Q 920,490 1520,1180" stroke="%230D1826" stroke-width="6" fill="none" opacity="0.6"/>
    <path d="M 518,-80 Q 918,490 1518,1180" stroke="%231E3352" stroke-width="2" fill="none"/>
    
    <!-- Hàng khuy cài bằng đồng thau chạm thủ công của áo ngũ thân -->
    <g transform="translate(680, 240)">
      <circle cx="0" cy="0" r="14" fill="%23C39A27" stroke="%23F2EDE3" stroke-width="1.5" opacity="0.9"/>
      <circle cx="0" cy="0" r="8" fill="%236E5439"/>
      <path d="M -14,0 L -38, -6" stroke="%23C39A27" stroke-width="3" stroke-linecap="round"/>
    </g>
    <g transform="translate(850, 440)">
      <circle cx="0" cy="0" r="14" fill="%23C39A27" stroke="%23F2EDE3" stroke-width="1.5" opacity="0.9"/>
      <circle cx="0" cy="0" r="8" fill="%236E5439"/>
      <path d="M -14,0 L -38, -6" stroke="%23C39A27" stroke-width="3" stroke-linecap="round"/>
    </g>
    <g transform="translate(1040, 670)">
      <circle cx="0" cy="0" r="14" fill="%23C39A27" stroke="%23F2EDE3" stroke-width="1.5" opacity="0.9"/>
      <circle cx="0" cy="0" r="8" fill="%236E5439"/>
      <path d="M -14,0 L -38, -6" stroke="%23C39A27" stroke-width="3" stroke-linecap="round"/>
    </g>
    <g transform="translate(1240, 920)">
      <circle cx="0" cy="0" r="14" fill="%23C39A27" stroke="%23F2EDE3" stroke-width="1.5" opacity="0.9"/>
      <circle cx="0" cy="0" r="8" fill="%236E5439"/>
      <path d="M -14,0 L -38, -6" stroke="%23C39A27" stroke-width="3" stroke-linecap="round"/>
    </g>
    <!-- Thớ lụa dệt chéo huyền ảo -->
    <line x1="0" y1="0" x2="1920" y2="1080" stroke="%23F2EDE3" stroke-width="0.5" stroke-opacity="0.04"/>
  </svg>`,

  man2TuThanVanKhan: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200">
    <defs>
      <linearGradient id="warmBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="%23F7F2E8"/>
        <stop offset="100%" stop-color="%23E7DFC9"/>
      </linearGradient>
      <linearGradient id="aoNau" x1="20%" y1="0%" x2="80%" y2="100%">
        <stop offset="0%" stop-color="%237A5C3E"/>
        <stop offset="60%" stop-color="%235C432B"/>
        <stop offset="100%" stop-color="%233A291A"/>
      </linearGradient>
      <linearGradient id="khanVan" x1="0%" y1="0%" x2="100%" y2="50%">
        <stop offset="0%" stop-color="%232C2A26"/>
        <stop offset="50%" stop-color="%231E1D1A"/>
        <stop offset="100%" stop-color="%2311100E"/>
      </linearGradient>
    </defs>
    <rect width="900" height="1200" fill="url(%23warmBg)"/>
    <!-- Họa cảnh người phụ nữ mặc áo tứ thân nâu gụ đang vấn khăn từ sau lưng -->
    <!-- Bờ vai và cổ áo tứ thân lưng khâu sống đôi -->
    <path d="M 220,1200 Q 300,680 450,560 Q 600,680 680,1200 Z" fill="url(%23aoNau)"/>
    <line x1="450" y1="560" x2="450" y2="1200" stroke="%233A291A" stroke-width="2.5"/> <!-- Đường sống áo tứ thân -->
    
    <!-- Gáy và búi tóc -->
    <path d="M 390,560 Q 450,580 510,560 L 500,430 Q 450,440 400,430 Z" fill="%23D8C8B3"/>
    <!-- Vành khăn vấn vải the đen cuốn nhiều lớp trên đỉnh đầu -->
    <ellipse cx="450" cy="380" rx="140" ry="110" fill="url(%23khanVan)"/>
    <ellipse cx="450" cy="370" rx="120" ry="90" fill="%231A1917"/>
    <path d="M 330,370 Q 450,330 570,370 Q 450,410 330,370 Z" fill="%2324221E" stroke="%23C39A27" stroke-width="0.8" stroke-opacity="0.3"/>
    
    <!-- Hai cánh tay vươn lên chỉnh nếp khăn sau gáy tạo dáng kiêu sa -->
    <path d="M 280,720 Q 310,510 390,400" stroke="%23D8C8B3" stroke-width="38" stroke-linecap="round" fill="none"/>
    <path d="M 620,720 Q 590,510 510,400" stroke="%23D8C8B3" stroke-width="38" stroke-linecap="round" fill="none"/>
    
    <!-- Ánh sáng xiên chiều tà đổ bóng nhẹ -->
    <rect width="900" height="1200" fill="%23C39A27" opacity="0.04"/>
  </svg>`,

  // Hình nền vector nhỏ cho 4 vùng văn hóa (dùng cho nút chọn vùng ở Bước 1)
  regionBacBo: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="120" viewBox="0 0 300 120">
    <rect width="300" height="120" fill="%2316243A"/>
    <path d="M0,120 Q60,70 120,90 T240,60 T300,80 L300,120 Z" fill="%236E5439" opacity="0.5"/>
    <path d="M0,120 Q80,50 160,80 T300,60 L300,120 Z" fill="%23A8322A" opacity="0.3"/>
    <circle cx="240" cy="35" r="18" fill="%23C39A27" opacity="0.4"/>
    <line x1="0" y1="0" x2="300" y2="120" stroke="%23F2EDE3" stroke-width="0.5" stroke-opacity="0.1"/>
  </svg>`,

  regionTrungBo: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="120" viewBox="0 0 300 120">
    <rect width="300" height="120" fill="%230D1826"/>
    <!-- Mái ngói cung đình Huế cổ kính -->
    <path d="M20,100 L60,50 L240,50 L280,100 Z" fill="%23C39A27" opacity="0.25"/>
    <path d="M50,50 Q150,30 250,50" stroke="%23C39A27" stroke-width="2" fill="none" opacity="0.7"/>
    <rect x="90" y="55" width="120" height="50" fill="%23A8322A" opacity="0.4"/>
    <line x1="0" y1="110" x2="300" y2="110" stroke="%23C39A27" stroke-width="1" opacity="0.3"/>
  </svg>`,

  regionNamBo: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="120" viewBox="0 0 300 120">
    <rect width="300" height="120" fill="%2316243A"/>
    <!-- Sóng nước Cửu Long và họa tiết khăn rằn -->
    <path d="M0,80 Q75,60 150,80 T300,80 L300,120 L0,120 Z" fill="%232C2A26" opacity="0.6"/>
    <path d="M0,95 Q75,75 150,95 T300,95 L300,120 L0,120 Z" fill="%236E5439" opacity="0.4"/>
    <line x1="20" y1="0" x2="20" y2="120" stroke="%23F2EDE3" stroke-width="1" stroke-opacity="0.12"/>
    <line x1="60" y1="0" x2="60" y2="120" stroke="%23F2EDE3" stroke-width="1" stroke-opacity="0.12"/>
    <line x1="100" y1="0" x2="100" y2="120" stroke="%23F2EDE3" stroke-width="1" stroke-opacity="0.12"/>
  </svg>`,

  regionTayBac: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="120" viewBox="0 0 300 120">
    <rect width="300" height="120" fill="%230D1826"/>
    <!-- Dãy núi Tây Bắc và thổ cẩm chàm -->
    <polygon points="0,120 50,40 100,120" fill="%2316243A" opacity="0.8"/>
    <polygon points="80,120 150,25 220,120" fill="%236E5439" opacity="0.5"/>
    <polygon points="180,120 240,45 300,120" fill="%23A8322A" opacity="0.4"/>
    <path d="M0,115 L300,115" stroke="%23C39A27" stroke-width="1.5" stroke-dasharray="4,4" opacity="0.5"/>
  </svg>`,
};
