import { useState } from 'react';
import { useStore, store } from '../../lib/store';
import { EVENTS } from '../../data/events';
import { REGIONS } from '../../data/regions';
import { GARMENTS } from '../../data/garments';

const MA_VUNG: Record<string, RegionId> = { R01: 'bac', R02: 'trung', R03: 'nam', R04: 'tay_bac' };
import { layTenMucTrangTrong } from '../../data/palettes';
import { layLuatSuKien, layVaiTro, lyDoKhoaPhongCach } from '../../data/boiCanhSuKien';
import { PhongCach, RegionId, formatStudioStepLabel } from '../../types';

export default function Step1BoiCanh() {
  const { contextSetup, selectedEvent, selectedRegion } = useStore();
  const [isCustomOpen, setIsCustomOpen] = useState(false);

  // Dịp là gốc: dịp quyết định có những vai nào; vai quyết định mức trang trọng và phong cách được mở
  const luatDip = layLuatSuKien(contextSetup.eventId);
  const vaiTroOptions = luatDip.vaiTro;
  const vaiDangChon = layVaiTro(contextSetup.eventId, contextSetup.vaiTro);

  // Mô tả đúng điều code làm với từng phong cách (xem lib/cultureGuard.ts), không hứa hơn
  const phongCachOptions: { id: PhongCach; label: string; desc: string }[] = [
    { id: 'nguyen_ban', label: 'Nguyên bản', desc: 'Giữ đủ mọi luật, ảnh dựng đúng như hiện vật' },
    { id: 'toi_gian', label: 'Tối giản', desc: 'Giữ đủ mọi luật, ảnh tiết chế màu và phụ kiện' },
    { id: 'remix_pho', label: 'Remix phố', desc: 'Phối khác bộ, khác giới hạ từ đỏ xuống vàng' },
    { id: 'san_khau', label: 'Sân khấu', desc: 'Lệch vùng, lệch thời kỳ chỉ còn là thông tin' },
  ];

  const canProceed = Boolean(contextSetup.eventId && contextSetup.regionId);

  // Nhãn tóm tắt giá trị mặc định đang dùng khi đóng khối tuỳ chỉnh
  const phongCachLabel = phongCachOptions.find((p) => p.id === contextSetup.phongCach)?.label || 'Nguyên bản';
  const nguoiMacLabel = contextSetup.nguoiMac === 'nam' ? 'Người mặc Nam' : contextSetup.nguoiMac === 'nu' ? 'Người mặc Nữ' : 'Chưa nêu giới';
  const summaryLine = `${nguoiMacLabel} · ${contextSetup.nhietDo}°C ${contextSetup.thoiTietMua ? 'có mưa' : 'khô ráo'} · ${phongCachLabel}`;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-150 select-none">
      <div>
        <span className="micro-label text-[#A8322A]">{formatStudioStepLabel(1)}</span>
        <h2 className="font-display text-3xl text-[#2C2A26] font-normal mt-1">
          Bạn mặc cho dịp nào, ở vùng nào?
        </h2>
        <p className="text-sm font-sans text-[#6E5439] mt-1 max-w-xl">
          Chọn dịp và vùng là đủ để bắt đầu. Vai của bạn trong dịp quyết định mức trang trọng và luật văn hoá áp dụng.
        </p>
      </div>

      {/* LỰA CHỌN NGƯỜI MẶC TỰ KHAI GIỚI (TUYỆT ĐỐI KHÔNG SUY ĐOÁN TỪ ẢNH) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-[#FBF8F2] border border-[#2C2A26]/18 corner-mark shadow-2xs">
        <div>
          <span className="micro-label text-[#2C2A26] block">NGƯỜI MẶC</span>
          <p className="text-xs font-sans text-[#6E5439] mt-0.5">
            Tự khai giới tính để Culture Guard hỗ trợ kiểm tra nếp áo theo truyền thống.
          </p>
        </div>
        <div className="flex items-center gap-1.5 border border-[#2C2A26]/20 p-1 bg-[#F2EDE3]/50">
          {[
            { id: 'nam', label: 'Nam' },
            { id: 'nu', label: 'Nữ' },
            { id: 'khong_neu', label: 'Không muốn nêu' },
          ].map((opt) => {
            const isSelected = (contextSetup.nguoiMac || 'khong_neu') === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => store.setContextSetup({ nguoiMac: opt.id as any })}
                className={`px-3.5 py-1.5 font-mono text-xs transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#A8322A] text-[#F2EDE3] font-bold shadow-xs'
                    : 'text-[#2C2A26]/80 hover:text-[#2C2A26] hover:bg-[#FBF8F2]'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* HAI THAM SỐ CỐT LÕI (MÀN MẶC ĐỊNH CHỈ HIỆN 2 KHỐI NÀY: 8 THẺ SỰ KIỆN + 4 THẺ VÙNG MIỀN) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. SỰ KIỆN — Chiếm 2 cột */}
        <div className="lg:col-span-2 border border-[#2C2A26]/18 bg-[#FBF8F2] p-5 md:p-6 corner-mark flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 hairline-b">
              <span className="micro-label text-[#2C2A26]">1. SỰ KIỆN THAM GIA</span>
              <span className="micro-label text-[#A8322A]">CHỌN 1 TRONG 8</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
              {EVENTS.map((evt) => {
                const isSelected = contextSetup.eventId === evt.id;
                return (
                  <div
                    key={evt.id}
                    onClick={() => {
                      store.setContextSetup({
                        eventId: evt.id,
                        mucTrangTrong: evt.mucTrangTrongYeuCau,
                      });
                      store.setSelectedEvent(evt);
                    }}
                    className={`p-3.5 border cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#A8322A] bg-[#F2EDE3]'
                        : 'border-[#2C2A26]/12 bg-[#FBF8F2] hover:border-[#2C2A26]/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] text-[#6E5439]">{layTenMucTrangTrong(evt.mucTrangTrongYeuCau)}</span>
                        {/* Dải nhỏ hiện mức trang trọng yêu cầu */}
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span
                              key={i}
                              className={`w-1.5 h-1.5 rounded-full ${
                                i < evt.mucTrangTrongYeuCau ? 'bg-[#A8322A]' : 'bg-[#2C2A26]/20'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <h4 className="font-display text-base text-[#2C2A26] font-normal mt-1 leading-snug">
                        {evt.ten}
                      </h4>
                      <p className="text-xs font-sans text-[#2C2A26]/75 mt-0.5 line-clamp-2 leading-relaxed">
                        {evt.moTa}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 2. VÙNG MIỀN — 1 cột */}
        <div className="border border-[#2C2A26]/18 bg-[#FBF8F2] p-5 md:p-6 corner-mark flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 hairline-b">
              <span className="micro-label text-[#2C2A26]">2. VÙNG MIỀN VĂN HÓA</span>
              <span className="micro-label text-[#6E5439]">4 VÙNG</span>
            </div>

            <div className="flex flex-col gap-2.5 pt-4">
              {REGIONS.map((r) => {
                const isSelected = contextSetup.regionId === r.id;

                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      store.setContextSetup({ regionId: r.id });
                      store.setSelectedRegion(r);
                    }}
                    className={`p-3 border text-left cursor-pointer transition-all flex items-center justify-between relative overflow-hidden group ${
                      isSelected
                        ? 'border-[#A8322A] bg-[#F2EDE3]'
                        : 'border-[#2C2A26]/12 bg-[#FBF8F2] hover:border-[#2C2A26]/40'
                    }`}
                  >
                    <div className="relative z-10">
                      <span className="font-display text-base text-[#2C2A26] block leading-tight">
                        {r.ten}
                      </span>
                      <span className="text-[11px] font-sans text-[#6E5439] block mt-0.5 truncate max-w-[200px]">
                        {r.khongGianVanHoa || r.chatLieu.slice(0, 2).join(' · ')}
                      </span>
                      {/* Nói thẳng khi vùng chưa có hiện vật trong bộ sưu tập, thay vì để người dùng tưởng là có */}
                      {!GARMENTS.some((g) => g.vung.includes(MA_VUNG[r.id] ?? (r.id as RegionId))) && (
                        <span className="text-[11px] font-sans text-[#A8322A] block mt-1">
                          Chưa có hồ sơ hiện vật riêng; Culture Guard chỉ áp dụng luật tôn trọng chỉnh thể trang phục.
                        </span>
                      )}
                    </div>
                    {/* Bảng màu nhỏ minh họa */}
                    <div className="relative z-10 flex items-center gap-1">
                      {r.bangMau.slice(0, 3).map((hex, i) => (
                        <div
                          key={i}
                          className="w-3.5 h-3.5 border border-[#2C2A26]/20"
                          style={{ backgroundColor: hex }}
                        />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 3. VAI CỦA BẠN TRONG DỊP: luôn hiện, vì vai quyết định mức trang trọng và luật áp dụng */}
      <div className="border border-[#2C2A26]/18 bg-[#FBF8F2] p-5 md:p-6 corner-mark">
        <div className="flex items-center justify-between pb-3 hairline-b">
          <span className="micro-label text-[#2C2A26]">3. VAI CỦA BẠN TRONG DỊP NÀY</span>
          <span className="micro-label text-[#6E5439]">
            {vaiTroOptions.length > 1 ? `${vaiTroOptions.length} VAI` : 'DỊP NÀY CÓ 1 VAI'}
          </span>
        </div>

        <div className={`grid gap-3 pt-4 ${vaiTroOptions.length > 1 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1'}`}>
          {vaiTroOptions.map((opt) => {
            const isSelected = vaiDangChon.id === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => store.setContextSetup({ vaiTro: opt.id })}
                className={`p-3 border text-left cursor-pointer transition-colors ${
                  isSelected
                    ? 'border-[#A8322A] bg-[#F2EDE3]'
                    : 'border-[#2C2A26]/12 bg-[#FBF8F2] hover:border-[#2C2A26]/40'
                }`}
              >
                <span className="font-display text-base text-[#2C2A26] block leading-snug">{opt.label}</span>
                <span className="text-xs font-sans text-[#2C2A26]/75 block mt-0.5">{opt.desc}</span>
                <span className="font-mono text-[10px] text-[#6E5439] block mt-1.5">
                  {layTenMucTrangTrong(opt.mucTrangTrong)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Mức trang trọng là hệ quả của dịp và vai, không phải một lựa chọn */}
        <p className="text-xs font-sans text-[#2C2A26] mt-4 leading-relaxed">
          Mức trang trọng dịp yêu cầu:{' '}
          <span className="font-bold text-[#A8322A]">
            {layTenMucTrangTrong(vaiDangChon.mucTrangTrong)} ({vaiDangChon.mucTrangTrong}/5)
          </span>
          . Mức này do dịp «{selectedEvent.ten}» và vai «{vaiDangChon.label}» quyết định, không kéo được. Muốn trang trọng hơn, bạn chọn món trang trọng hơn ở bước phối đồ; app so mức của bộ đồ với mức này.
        </p>
        {luatDip.ghiChuPhamVi && (
          <p className="text-[11px] font-sans text-[#6E5439] italic mt-1.5">{luatDip.ghiChuPhamVi}</p>
        )}
      </div>

      {/* KHỐI THU GỌN: TUỲ CHỈNH THÊM (CHỨA 5 THAM SỐ CÒN LẠI) */}
      <div className="border border-[#2C2A26]/18 bg-[#FBF8F2] corner-mark overflow-hidden shadow-2xs">
        <button
          type="button"
          onClick={() => setIsCustomOpen(!isCustomOpen)}
          className="w-full p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F2EDE3]/50 transition-colors cursor-pointer text-left"
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <span className="micro-label text-[#2C2A26] font-bold">TUỲ CHỈNH THÊM</span>
            <span className="font-mono text-xs text-[#6E5439]">
              {summaryLine}
            </span>
          </div>
          <span className="font-mono text-xs text-[#A8322A] shrink-0 font-bold">
            {isCustomOpen ? 'THU GỌN ▲' : 'MỞ RỘNG ▼'}
          </span>
        </button>

        {/* Khối trượt mượt mà mở bằng grid-template-rows: 0fr -> 1fr */}
        <div
          className="grid transition-all duration-300 ease-in-out"
          style={{ gridTemplateRows: isCustomOpen ? '1fr' : '0fr' }}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="p-5 md:p-6 border-t border-[#2C2A26]/12 grid grid-cols-1 md:grid-cols-2 gap-5 bg-[#FBF8F2]">
              {/* 4. THỜI TIẾT & NHIỆT ĐỘ */}
              <div className="border border-[#2C2A26]/12 bg-[#F2EDE3]/50 p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 hairline-b">
                    <span className="micro-label text-[#2C2A26]">4. THỜI TIẾT HÔM ĐÓ</span>
                    <span className="font-mono text-xs text-[#6E5439]">
                      {contextSetup.nhietDo}°C · {contextSetup.thoiTietMua ? 'Mưa' : 'Khô ráo'}
                    </span>
                  </div>

                  <div className="pt-3 flex flex-col gap-2.5">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={5}
                        max={45}
                        value={contextSetup.nhietDo}
                        onChange={(e) => {
                          const temp = Number(e.target.value);
                          store.setContextSetup({ nhietDo: temp });
                          store.setNhietDo(temp);
                        }}
                        className="w-16 p-1.5 border border-[#2C2A26]/20 bg-[#FBF8F2] font-mono text-xs text-[#2C2A26] outline-none"
                      />
                      <span className="font-mono text-[11px] text-[#2C2A26]">ĐỘ C</span>

                      <div className="flex items-center gap-1 ml-auto">
                        {[33, 24, 15].map((temp) => (
                          <button
                            key={temp}
                            type="button"
                            onClick={() => {
                              store.setContextSetup({ nhietDo: temp });
                              store.setNhietDo(temp);
                            }}
                            className={`px-2 py-0.5 text-[10px] font-mono border transition-colors cursor-pointer ${
                              contextSetup.nhietDo === temp
                                ? 'border-[#A8322A] bg-[#A8322A] text-[#F2EDE3]'
                                : 'border-[#2C2A26]/20 bg-[#FBF8F2] text-[#2C2A26]'
                            }`}
                          >
                            {temp}°
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] font-sans text-[#2C2A26]">Điều kiện:</span>
                      <div className="flex items-center border border-[#2C2A26]/20 text-[10px] font-mono">
                        <button
                          type="button"
                          onClick={() => store.setContextSetup({ thoiTietMua: false })}
                          className={`px-2.5 py-1 transition-colors cursor-pointer ${
                            !contextSetup.thoiTietMua
                              ? 'bg-[#A8322A] text-[#F2EDE3]'
                              : 'bg-[#FBF8F2] text-[#2C2A26]'
                          }`}
                        >
                          KHÔ RÁO
                        </button>
                        <button
                          type="button"
                          onClick={() => store.setContextSetup({ thoiTietMua: true })}
                          className={`px-2.5 py-1 transition-colors cursor-pointer ${
                            contextSetup.thoiTietMua
                              ? 'bg-[#A8322A] text-[#F2EDE3]'
                              : 'bg-[#FBF8F2] text-[#2C2A26]'
                          }`}
                        >
                          CÓ MƯA
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] font-sans text-[#6E5439] italic pt-2 mt-2 border-t border-[#2C2A26]/10">
                  Bạn tự nhập, app không lấy dự báo. Trên 32°C bật cảnh báo nóng; nhiệt độ và mưa đổi độ dày vải, ánh sáng trong ảnh thử.
                </p>
              </div>

              {/* 5. PHONG CÁCH: vai quyết định phong cách nào được mở */}
              <div className="border border-[#2C2A26]/12 bg-[#F2EDE3]/50 p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 hairline-b">
                    <span className="micro-label text-[#2C2A26]">5. PHONG CÁCH</span>
                    <span className="micro-label text-[#A8322A]">NỚI LUẬT</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-3">
                    {phongCachOptions.map((opt) => {
                      const isSelected = contextSetup.phongCach === opt.id;
                      // Phong cách không hợp vai thì khoá và nói lý do, không giấu đi
                      const lyDoKhoa = lyDoKhoaPhongCach(vaiDangChon, opt.id);
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          disabled={Boolean(lyDoKhoa)}
                          onClick={() => store.setContextSetup({ phongCach: opt.id })}
                          className={`p-2 border text-left transition-colors ${
                            lyDoKhoa
                              ? 'border-[#2C2A26]/8 bg-[#FBF8F2] opacity-45 cursor-not-allowed'
                              : isSelected
                              ? 'border-[#A8322A] bg-[#F2EDE3] cursor-pointer'
                              : 'border-[#2C2A26]/12 bg-[#FBF8F2] hover:border-[#2C2A26]/30 cursor-pointer'
                          }`}
                        >
                          <span className="font-display text-xs text-[#2C2A26] block leading-tight">
                            {opt.label}
                          </span>
                          <span className="text-[9px] font-sans text-[#6E5439] block mt-0.5 leading-snug">
                            {lyDoKhoa || opt.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <p className="text-[11px] font-sans text-[#6E5439] italic pt-2 mt-2 border-t border-[#2C2A26]/10">
                  Mặc định là Nguyên bản. Luật mức đỏ không bao giờ được nới, ở phong cách nào cũng vậy.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* THANH ĐIỀU HƯỚNG SANG BƯỚC 2: Bật ngay khi chọn Sự kiện & Vùng miền */}
      <div className="flex items-center justify-between pt-4 border-t border-[#2C2A26]/15">
        <div className="text-xs font-mono text-[#6E5439]">
          BỐI CẢNH: <span className="text-[#2C2A26] font-bold">{selectedEvent.ten}</span> · VAI: <span className="text-[#2C2A26] font-bold">{vaiDangChon.label}</span> · VÙNG: <span className="text-[#2C2A26] font-bold">{selectedRegion.ten}</span>
        </div>

        <button
          type="button"
          disabled={!canProceed}
          onClick={() => store.setStudioStep(2)}
          className={`px-8 py-3.5 text-xs font-mono uppercase tracking-widest corner-mark transition-all ${
            canProceed
              ? 'bg-[#A8322A] text-[#F2EDE3] hover:bg-[#A8322A]/90 cursor-pointer shadow-md'
              : 'bg-[#2C2A26]/20 text-[#2C2A26]/40 cursor-not-allowed'
          }`}
        >
          TIẾP TỤC: ẢNH CỦA BẠN →
        </button>
      </div>
    </div>
  );
}
