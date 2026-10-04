import { useState } from 'react';
import {
  VIETNAM_MAINLAND_PATH,
  HOANG_SA_PATHS,
  TRUONG_SA_PATHS,
} from '../../data/vietnamMapPath';

export interface BanDoVietNamProps {
  vungDangChon: string;
  onChonVung: (vung: string) => void;
  kichThuoc: 'lon' | 'vua';
  hienNhanDao: boolean;
}

export default function BanDoVietNam({
  vungDangChon,
  onChonVung,
  kichThuoc,
  hienNhanDao,
}: BanDoVietNamProps) {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [hoveredIsland, setHoveredIsland] = useState<'HOANG_SA' | 'TRUONG_SA' | null>(null);

  const maxSvgWidth = kichThuoc === 'lon' ? 'max-w-[420px] md:max-w-[460px]' : 'max-w-[280px] md:max-w-[320px]';

  return (
    <div className="flex flex-col items-center w-full select-none">
      <div className="relative w-full flex items-center justify-center">
        <svg
          viewBox="40 100 1260 2260"
          className={`w-full ${maxSvgWidth} h-auto drop-shadow-sm overflow-visible text-inherit`}
          aria-label="Bản đồ chủ quyền lãnh thổ Việt Nam và bốn vùng văn hóa y phục"
        >
          <defs>
            {/* Mặt nạ cắt duy nhất trích xuất nguyên bản từ Natural Earth */}
            <clipPath id="vnMainlandClip">
              <path d={VIETNAM_MAINLAND_PATH} />
            </clipPath>

            {/* Bộ lọc làm mềm ranh giới ước lệ giữa các vùng văn hoá (tan dần khoảng 40-60px) */}
            <filter id="softRegionBlur" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="18" />
            </filter>
          </defs>

          {/* Nền đất liền nhận màu currentColor từ vùng chứa bên ngoài qua CSS */}
          <path
            d={VIETNAM_MAINLAND_PATH}
            fill="currentColor"
            fillOpacity={0.06}
          />

          {/* 4 vùng văn hoá: áp filter softRegionBlur TRƯỚC KHI cắt bằng clipPath vnMainlandClip */}
          <g clipPath="url(#vnMainlandClip)">
            {/* Lớp màu mờ mềm mại với feGaussianBlur stdDeviation=18 */}
            <g filter="url(#softRegionBlur)">
              {/* VÙNG 1: TÂY BẮC (R04) */}
              <polygon
                points="0,0 520,0 470,630 0,630"
                fill="#A8322A"
                fillOpacity={vungDangChon === 'R04' ? 0.22 : 0}
                className="transition-opacity duration-300"
              />

              {/* VÙNG 2: BẮC BỘ (R01) */}
              <polygon
                points="520,0 1250,0 1250,630 470,630"
                fill="#A8322A"
                fillOpacity={vungDangChon === 'R01' ? 0.22 : 0}
                className="transition-opacity duration-300"
              />

              {/* VÙNG 3: TRUNG BỘ (R02) */}
              <rect
                x="0"
                y="630"
                width="1250"
                height="1130"
                fill="#A8322A"
                fillOpacity={vungDangChon === 'R02' ? 0.22 : 0}
                className="transition-opacity duration-300"
              />

              {/* VÙNG 4: NAM BỘ (R03) */}
              <rect
                x="0"
                y="1760"
                width="1250"
                height="600"
                fill="#A8322A"
                fillOpacity={vungDangChon === 'R03' ? 0.22 : 0}
                className="transition-opacity duration-300"
              />
            </g>

            {/* Lớp bắt sự kiện click / hover trực tiếp trên các vùng (trong suốt, không filter) */}
            <polygon
              points="0,0 520,0 470,630 0,630"
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setHoveredRegion('R04')}
              onMouseLeave={() => setHoveredRegion(null)}
              onClick={() => onChonVung('R04')}
            >
              <title>Tây Bắc</title>
            </polygon>

            <polygon
              points="520,0 1250,0 1250,630 470,630"
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setHoveredRegion('R01')}
              onMouseLeave={() => setHoveredRegion(null)}
              onClick={() => onChonVung('R01')}
            >
              <title>Bắc Bộ</title>
            </polygon>

            <rect
              x="0"
              y="630"
              width="1250"
              height="1130"
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setHoveredRegion('R02')}
              onMouseLeave={() => setHoveredRegion(null)}
              onClick={() => onChonVung('R02')}
            >
              <title>Trung Bộ</title>
            </rect>

            <rect
              x="0"
              y="1760"
              width="1250"
              height="600"
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setHoveredRegion('R03')}
              onMouseLeave={() => setHoveredRegion(null)}
              onClick={() => onChonVung('R03')}
            >
              <title>Nam Bộ</title>
            </rect>
          </g>

          {/* Đường viền ngoài quốc gia nét sắc 1px màu hoàng kim (#C39A27) */}
          <path
            d={VIETNAM_MAINLAND_PATH}
            fill="none"
            stroke="#C39A27"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />

          {/* Nhãn 4 vùng văn hoá bằng font JetBrains Mono */}
          <text
            x="290"
            y="420"
            textAnchor="middle"
            fill="currentColor"
            fillOpacity={vungDangChon === 'R04' ? 1 : 0.65}
            fontFamily="JetBrains Mono"
            fontSize="26"
            fontWeight={vungDangChon === 'R04' ? '600' : '400'}
            className="pointer-events-none tracking-widest"
          >
            TÂY BẮC
          </text>

          <text
            x="640"
            y="480"
            textAnchor="middle"
            fill="currentColor"
            fillOpacity={vungDangChon === 'R01' ? 1 : 0.65}
            fontFamily="JetBrains Mono"
            fontSize="26"
            fontWeight={vungDangChon === 'R01' ? '600' : '400'}
            className="pointer-events-none tracking-widest"
          >
            BẮC BỘ
          </text>

          <text
            x="760"
            y="1080"
            textAnchor="middle"
            fill="currentColor"
            fillOpacity={vungDangChon === 'R02' ? 1 : 0.65}
            fontFamily="JetBrains Mono"
            fontSize="28"
            fontWeight={vungDangChon === 'R02' ? '600' : '400'}
            className="pointer-events-none tracking-widest"
          >
            TRUNG BỘ
          </text>

          <text
            x="610"
            y="1960"
            textAnchor="middle"
            fill="currentColor"
            fillOpacity={vungDangChon === 'R03' ? 1 : 0.65}
            fontFamily="JetBrains Mono"
            fontSize="26"
            fontWeight={vungDangChon === 'R03' ? '600' : '400'}
            className="pointer-events-none tracking-widest"
          >
            NAM BỘ
          </text>

          {/* ===================================================================
              QUẦN ĐẢO HOÀNG SA (LUÔN HIỆN ĐỦ KÈM NHÃN)
              =================================================================== */}
          <g
            className="cursor-pointer transition-all"
            onMouseEnter={() => setHoveredIsland('HOANG_SA')}
            onMouseLeave={() => setHoveredIsland(null)}
            onClick={() => onChonVung('HOANG_SA')}
          >
            <rect
              x="1000"
              y="1170"
              width="250"
              height="200"
              rx="6"
              fill={
                vungDangChon === 'HOANG_SA'
                  ? '#A8322A'
                  : hoveredIsland === 'HOANG_SA'
                  ? '#C39A27'
                  : 'transparent'
              }
              fillOpacity={
                vungDangChon === 'HOANG_SA' ? 0.22 : hoveredIsland === 'HOANG_SA' ? 0.1 : 0
              }
              stroke="#C39A27"
              strokeWidth={vungDangChon === 'HOANG_SA' ? '1.8' : '1'}
              strokeDasharray="6 6"
            />

            {/* Các điểm đảo thật */}
            {HOANG_SA_PATHS.slice(0, 30).map((d, i) => (
              <path
                key={`hsa-raw-${i}`}
                d={d}
                fill="#C39A27"
                stroke="#C39A27"
                strokeWidth="1.5"
              />
            ))}

            {/* Các chấm biểu tượng đảo */}
            <circle cx="1060" cy="1225" r="4.5" fill="#C39A27" />
            <circle cx="1115" cy="1215" r="5" fill="#C39A27" />
            <circle cx="1145" cy="1245" r="5.5" fill="#C39A27" />
            <circle cx="1170" cy="1235" r="4" fill="#C39A27" />
            <circle cx="1110" cy="1275" r="4" fill="#C39A27" />
            <circle cx="1080" cy="1310" r="4.5" fill="#C39A27" />

            {/* Nhãn chữ quần đảo Hoàng Sa */}
            {hienNhanDao && (
              <>
                <text
                  x="1125"
                  y="1395"
                  textAnchor="middle"
                  fill="#C39A27"
                  fontFamily="JetBrains Mono"
                  fontSize="23"
                  fontWeight="600"
                  letterSpacing="2"
                >
                  QUẦN ĐẢO HOÀNG SA
                </text>
                <text
                  x="1125"
                  y="1425"
                  textAnchor="middle"
                  fill="currentColor"
                  fillOpacity="0.75"
                  fontFamily="JetBrains Mono"
                  fontSize="18"
                >
                  (TP. ĐÀ NẴNG)
                </text>
              </>
            )}
          </g>

          {/* ===================================================================
              QUẦN ĐẢO TRƯỜNG SA (LUÔN HIỆN ĐỦ KÈM NHÃN)
              =================================================================== */}
          <g
            className="cursor-pointer transition-all"
            onMouseEnter={() => setHoveredIsland('TRUONG_SA')}
            onMouseLeave={() => setHoveredIsland(null)}
            onClick={() => onChonVung('TRUONG_SA')}
          >
            <rect
              x="820"
              y="1770"
              width="390"
              height="490"
              rx="6"
              fill={
                vungDangChon === 'TRUONG_SA'
                  ? '#A8322A'
                  : hoveredIsland === 'TRUONG_SA'
                  ? '#C39A27'
                  : 'transparent'
              }
              fillOpacity={
                vungDangChon === 'TRUONG_SA' ? 0.22 : hoveredIsland === 'TRUONG_SA' ? 0.1 : 0
              }
              stroke="#C39A27"
              strokeWidth={vungDangChon === 'TRUONG_SA' ? '1.8' : '1'}
              strokeDasharray="6 6"
            />

            {/* Các điểm đảo thật */}
            {TRUONG_SA_PATHS.slice(0, 45).map((d, i) => (
              <path
                key={`tsa-raw-${i}`}
                d={d}
                fill="#C39A27"
                stroke="#C39A27"
                strokeWidth="1.5"
              />
            ))}

            {/* Các chấm biểu tượng đảo */}
            <circle cx="1080" cy="1815" r="4.5" fill="#C39A27" />
            <circle cx="1120" cy="1840" r="4" fill="#C39A27" />
            <circle cx="1040" cy="1880" r="4.5" fill="#C39A27" />
            <circle cx="1065" cy="1915" r="5" fill="#C39A27" />
            <circle cx="980" cy="1940" r="4" fill="#C39A27" />
            <circle cx="1005" cy="1980" r="5.5" fill="#C39A27" />
            <circle cx="920" cy="2010" r="4" fill="#C39A27" />
            <circle cx="945" cy="2045" r="5" fill="#C39A27" />
            <circle cx="975" cy="2090" r="4.5" fill="#C39A27" />
            <circle cx="1010" cy="2140" r="4" fill="#C39A27" />
            <circle cx="890" cy="2195" r="5" fill="#C39A27" />

            {/* Nhãn chữ quần đảo Trường Sa */}
            {hienNhanDao && (
              <>
                <text
                  x="1015"
                  y="2285"
                  textAnchor="middle"
                  fill="#C39A27"
                  fontFamily="JetBrains Mono"
                  fontSize="23"
                  fontWeight="600"
                  letterSpacing="2"
                >
                  QUẦN ĐẢO TRƯỜNG SA
                </text>
                <text
                  x="1015"
                  y="2315"
                  textAnchor="middle"
                  fill="currentColor"
                  fillOpacity="0.75"
                  fontFamily="JetBrains Mono"
                  fontSize="18"
                >
                  (TỈNH KHÁNH HOÀ)
                </text>
              </>
            )}
          </g>
        </svg>
      </div>

      <div className="flex flex-col items-center gap-1.5 mt-3 px-2 max-w-md text-center pointer-events-none">
        <p className="font-mono text-[10px] text-[#C39A27] tracking-wider uppercase font-medium leading-relaxed">
          RANH GIOI VUNG MANG TINH UOC LE THEO DAC TRUNG TRANG PHUC, KHONG PHAI DIA GIOI HANH CHINH.
        </p>
        <p className="font-mono text-[9px] opacity-60 tracking-wider leading-relaxed">
          Bản đồ: Vietnam location map, Uwe Dedering, CC BY-SA 3.0, Natural Earth.
        </p>
      </div>
    </div>
  );
}
