import React from 'react';
import { useStore } from '../../lib/store';
import { TRADITIONAL_COLORS } from '../../data/palettes';
import { BACKGROUNDS, chonBoiCanhTuDong } from '../../data/backgrounds';
import { Background } from '../../types';

interface BanDaChonPanelProps {
  className?: string;
  onOpenWhyModal?: () => void;
}

export default function BanDaChonPanel({ className = '', onOpenWhyModal }: BanDaChonPanelProps) {
  const { lookState, selectedEvent, selectedRegion, tryOnBackgroundId } = useStore();

  // Xác định màu chính
  const mainColorHex = lookState.mauChinh || '#16243A';
  const mainColorObj = TRADITIONAL_COLORS.find(
    (c) => c.hex.toLowerCase() === mainColorHex.toLowerCase()
  );
  const mainColorName = mainColorObj?.ten || 'Chàm';

  // Xác định bối cảnh nền
  const currentBg: Background =
    BACKGROUNDS.find((b) => b.id === tryOnBackgroundId) ||
    chonBoiCanhTuDong(selectedEvent?.id, selectedRegion?.id);

  // Phụ kiện
  const phuKienText =
    lookState.phuKien && lookState.phuKien.length > 0
      ? lookState.phuKien.map((p) => p.ten).join(', ')
      : lookState.phuKienHienDai
      ? 'Phụ kiện hiện đại'
      : 'Không dùng';

  // Hoa văn
  const hoaVanText = lookState.hoaVan?.ten || 'Trơn không thêu';

  // Danh sách 6 lớp phục trang
  const sixLayers = [
    {
      id: 'L1',
      label: 'LỚP 1 · THƯỢNG Y',
      val: lookState.thuongY?.ten || 'Chưa chọn',
      sub: lookState.thuongY?.nienDai,
      colorHex: mainColorHex, // Thượng y mang sắc màu chính người dùng chọn
      hasColor: Boolean(lookState.thuongY),
    },
    {
      id: 'L2',
      label: 'LỚP 2 · HẠ Y',
      val: lookState.haY?.ten || 'Quần lụa trắng',
      sub: lookState.haY?.chatLieuPhoBien?.join(', '),
      colorHex: lookState.haY?.mauTruyenThong?.[0] || '#F2EDE3',
      hasColor: Boolean(lookState.haY),
    },
    {
      id: 'L3',
      label: 'LỚP 3 · THỦ PHỤC',
      val: lookState.thuPhuc?.ten || 'Khăn vấn',
      sub: lookState.thuPhuc?.nienDai,
      colorHex: lookState.thuPhuc?.mauTruyenThong?.[0] || '#2C2A26',
      hasColor: Boolean(lookState.thuPhuc),
    },
    {
      id: 'L4',
      label: 'LỚP 4 · HÀI',
      val: lookState.hai?.ten || 'Hài thêu',
      sub: lookState.hai?.chatLieuPhoBien?.join(', '),
      colorHex: lookState.hai?.mauTruyenThong?.[0] || '#A8322A',
      hasColor: Boolean(lookState.hai),
    },
    {
      id: 'L5',
      label: 'LỚP 5 · PHỤ KIỆN',
      val: phuKienText,
      sub: lookState.phuKien?.[0]?.chatLieuPhoBien?.join(', '),
      colorHex: lookState.phuKien?.[0]?.mauTruyenThong?.[0],
      hasColor: Boolean(lookState.phuKien?.[0]?.mauTruyenThong?.[0]),
    },
    {
      id: 'L6',
      label: 'LỚP 6 · HOA VĂN',
      val: hoaVanText,
      sub: lookState.hoaVan?.yNghia,
      colorHex: '#C39A27',
      hasColor: Boolean(lookState.hoaVan),
    },
  ];

  return (
    <div className={`flex flex-col ${className}`}>
      {/* 2. DÒNG JETBRAINS MONO 11PX NGAY TRÊN KHỐI (QUY ĐỊNH BẮT BUỘC) */}
      <div className="font-mono text-[11px] text-[#A8322A] tracking-wider uppercase mb-1.5 font-medium leading-tight">
        DAY LA BAN GHI CHINH XAC. ANH BEN CANH CHI LA MINH HOA.
      </div>

      {/* 1. KHỐI BẠN ĐÃ CHỌN (ĐỌC TRỰC TIẾP TỪ LOOKSTATE, KHÔNG QUA GEMINI) */}
      <div className="border border-[#2C2A26]/18 bg-[#FBF8F2] p-3 md:p-3.5 corner-mark flex flex-col gap-2.5 shadow-2xs">
        <div className="flex items-center justify-between pb-2 border-b border-[#2C2A26]/12">
          <span className="micro-label text-[#2C2A26] font-bold">BẠN ĐÃ CHỌN</span>
          <span className="font-mono text-[10px] text-[#6E5439] uppercase tracking-wider">
            6 LỚP + SẮC NỀN
          </span>
        </div>

        {/* BẢNG LIỆT KÊ SÁU LỚP */}
        <div className="flex flex-col divide-y divide-[#2C2A26]/10 text-xs">
          {sixLayers.map((layer) => (
            <div key={layer.id} className="py-1.5 flex items-start justify-between gap-2">
              <div className="flex flex-col min-w-0">
                <span className="font-mono text-[10px] text-[#6E5439] tracking-wider uppercase">
                  {layer.label}
                </span>
                <span className="font-display text-xs text-[#2C2A26] font-medium leading-snug truncate">
                  {layer.val}
                </span>
                {layer.sub && (
                  <span className="font-sans text-[10px] text-[#6E5439]/80 truncate">
                    {layer.sub}
                  </span>
                )}
              </div>

              {/* Ô màu nhỏ nếu có thông tin màu */}
              {layer.hasColor && layer.colorHex && (
                <div className="flex items-center gap-1.5 shrink-0 pt-1">
                  <span
                    className="w-3.5 h-3.5 border border-[#2C2A26]/30 rounded-full shadow-2xs"
                    style={{ backgroundColor: layer.colorHex }}
                  />
                </div>
              )}
            </div>
          ))}

          {/* DÒNG MÀU CHÍNH */}
          <div className="py-1.5 flex items-center justify-between gap-2">
            <div className="flex flex-col">
              <span className="font-mono text-[10px] text-[#6E5439] tracking-wider uppercase">
                MÀU CHÍNH PHỤC TRANG
              </span>
              <span className="font-display text-xs text-[#2C2A26] font-medium">
                {mainColorName}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span
                className="w-4 h-4 border border-[#2C2A26]/40 rounded-full shadow-2xs"
                style={{ backgroundColor: mainColorHex }}
              />
            </div>
          </div>

          {/* DÒNG BỐI CẢNH NỀN */}
          <div className="py-1.5 flex items-start justify-between gap-2">
            <div className="flex flex-col min-w-0">
              <span className="font-mono text-[10px] text-[#6E5439] tracking-wider uppercase">
                BỐI CẢNH KHÔNG GIAN
              </span>
              <span className="font-display text-xs text-[#2C2A26] font-medium truncate">
                {currentBg.ten}
              </span>
              <span className="font-sans text-[10px] text-[#6E5439]/80 line-clamp-1">
                {currentBg.moTaChoAI}
              </span>
            </div>
          </div>
        </div>

        {/* NÚT MỞ MODAL ĐỐI SOÁT CHI TIẾT NẾU CÓ CALLBACK */}
        {onOpenWhyModal && (
          <button
            type="button"
            onClick={onOpenWhyModal}
            className="w-full mt-1 pt-2 border-t border-[#2C2A26]/10 text-left font-sans text-[11px] text-[#A8322A] hover:underline cursor-pointer flex items-center justify-between"
          >
            <span>Vì sao ảnh AI có thể lệch chi tiết?</span>
            <span className="font-mono text-xs">→</span>
          </button>
        )}
      </div>
    </div>
  );
}
