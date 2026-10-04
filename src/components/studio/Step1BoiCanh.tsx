import { useState } from 'react';
import { useStore, store } from '../../lib/store';
import { EVENTS } from '../../data/events';
import { REGIONS } from '../../data/regions';
import { IMAGES } from '../../data/images';
import { layTenMucTrangTrong } from '../../data/palettes';
import { VaiTro, PhongCach, NganSach, formatStudioStepLabel } from '../../types';

export default function Step1BoiCanh() {
  const { contextSetup, selectedEvent, selectedRegion } = useStore();
  const [isCustomOpen, setIsCustomOpen] = useState(false);

  const vaiTroOptions: { id: VaiTro; label: string; desc: string }[] = [
    { id: 'chu_nha', label: 'Chủ nhà', desc: 'Đón tiếp họ hàng, giữ nếp gia phong' },
    { id: 'khach_moi', label: 'Khách mời', desc: 'Trang nhã, không lấn át nhân vật chính' },
    { id: 'co_dau_chu_re', label: 'Cô dâu chú rể', desc: 'Tâm điểm ngày đại hỷ, phẩm phục cao nhất' },
    { id: 'bieu_dien', label: 'Người biểu diễn', desc: 'Sân khấu, nghệ thuật, phóng khoáng' },
  ];

  const phongCachOptions: { id: PhongCach; label: string; desc: string }[] = [
    { id: 'nguyen_ban', label: 'Nguyên bản', desc: 'Siết chặt điển chế cổ truyền triều đại' },
    { id: 'toi_gian', label: 'Tối giản', desc: 'Phom dáng chuẩn, màu sắc nền nã' },
    { id: 'remix_pho', label: 'Remix phố', desc: 'Nới luật phụ kiện giày, túi dạo phố' },
    { id: 'san_khau', label: 'Sân khấu', desc: 'Cho phép màu nổi bật, hoa văn lớn' },
  ];

  const nganSachOptions: { id: NganSach; label: string }[] = [
    { id: 'thue', label: 'Thuê cổ phục' },
    { id: 'may_do', label: 'May đo thủ công' },
    { id: 'mua_san', label: 'Mua sẵn cách tân' },
  ];

  const trangTrongLabels = [
    'Thường ngày',
    'Dạo phố',
    'Có lễ',
    'Trang trọng',
    'Đại lễ',
  ];

  const canProceed = Boolean(contextSetup.eventId && contextSetup.regionId);

  // Nhãn tóm tắt giá trị mặc định đang dùng khi đóng khối tuỳ chỉnh
  const vaiTroLabel = vaiTroOptions.find((v) => v.id === contextSetup.vaiTro)?.label || 'Khách mời';
  const phongCachLabel = phongCachOptions.find((p) => p.id === contextSetup.phongCach)?.label || 'Tối giản';
  const nganSachLabel = nganSachOptions.find((n) => n.id === contextSetup.nganSach)?.label || 'Thuê cổ phục';
  const nguoiMacLabel = contextSetup.nguoiMac === 'nam' ? 'Người mặc Nam' : contextSetup.nguoiMac === 'nu' ? 'Người mặc Nữ' : 'Chưa nêu giới';
  const summaryLine = `${nguoiMacLabel} · ${layTenMucTrangTrong(contextSetup.mucTrangTrong)} · ${contextSetup.nhietDo}°C ${contextSetup.thoiTietMua ? 'có mưa' : 'khô ráo'} · ${vaiTroLabel} · ${phongCachLabel} · ${nganSachLabel}`;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-150 select-none">
      <div>
        <span className="micro-label text-[#A8322A]">{formatStudioStepLabel(1)}</span>
        <h2 className="font-display text-3xl text-[#2C2A26] font-normal mt-1">
          Thiết lập bối cảnh &amp; quy chuẩn ứng xử
        </h2>
        <p className="text-sm font-sans text-[#6E5439] mt-1 max-w-xl">
          Chọn Sự kiện và Vùng miền để bắt đầu. Hệ thống Culture Guard sẽ tự động áp dụng các quy chuẩn điển lễ phù hợp nhất.
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
                const regionBg =
                  r.id === 'bac' || r.id === 'R01'
                    ? IMAGES.regionBacBo
                    : r.id === 'trung' || r.id === 'R02'
                    ? IMAGES.regionTrungBo
                    : r.id === 'nam' || r.id === 'R03'
                    ? IMAGES.regionNamBo
                    : IMAGES.regionTayBac;

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
                    {/* Ảnh nền nhỏ với lớp phủ bảo vệ tương phản */}
                    <div
                      className="absolute inset-0 opacity-15 group-hover:opacity-25 transition-opacity bg-cover bg-center pointer-events-none"
                      style={{ backgroundImage: `url("${regionBg}")` }}
                    />
                    <div className="relative z-10">
                      <span className="font-display text-base text-[#2C2A26] block leading-tight">
                        {r.ten}
                      </span>
                      <span className="text-[11px] font-sans text-[#6E5439] block mt-0.5 truncate max-w-[200px]">
                        {r.khongGianVanHoa || r.chatLieu.slice(0, 2).join(' · ')}
                      </span>
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
            <div className="p-5 md:p-6 border-t border-[#2C2A26]/12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 bg-[#FBF8F2]">
              {/* 3. MỨC TRANG TRỌNG */}
              <div className="border border-[#2C2A26]/12 bg-[#F2EDE3]/50 p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 hairline-b">
                    <span className="micro-label text-[#2C2A26]">3. MỨC TRANG TRỌNG</span>
                    <span className="font-mono text-xs text-[#A8322A] font-bold">
                      {layTenMucTrangTrong(contextSetup.mucTrangTrong)}
                    </span>
                  </div>

                  <div className="pt-4">
                    <input
                      type="range"
                      min={1}
                      max={5}
                      step={1}
                      value={contextSetup.mucTrangTrong}
                      onChange={(e) =>
                        store.setContextSetup({
                          mucTrangTrong: Number(e.target.value) as 1 | 2 | 3 | 4 | 5,
                        })
                      }
                      className="w-full accent-[#A8322A] cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-[#6E5439] pt-2">
                      {trangTrongLabels.map((label, idx) => (
                        <span
                          key={idx}
                          className={
                            contextSetup.mucTrangTrong === idx + 1
                              ? 'text-[#A8322A] font-bold'
                              : ''
                          }
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <p className="text-[11px] font-sans text-[#6E5439] italic pt-3 mt-2 border-t border-[#2C2A26]/10">
                  Mặc định theo sự kiện, có thể kéo để ghi đè.
                </p>
              </div>

              {/* 4. THỜI TIẾT & NHIỆT ĐỘ */}
              <div className="border border-[#2C2A26]/12 bg-[#F2EDE3]/50 p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 hairline-b">
                    <span className="micro-label text-[#2C2A26]">4. THỜI TIẾT DỰ BÁO</span>
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
                  Nhiệt độ trên 32°C kích hoạt cảnh báo nóng.
                </p>
              </div>

              {/* 5. VAI TRÒ */}
              <div className="border border-[#2C2A26]/12 bg-[#F2EDE3]/50 p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 hairline-b">
                    <span className="micro-label text-[#2C2A26]">5. VAI TRÒ XUẤT HIỆN</span>
                    <span className="micro-label text-[#6E5439]">4 VỊ THẾ</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-3">
                    {vaiTroOptions.map((opt) => {
                      const isSelected = contextSetup.vaiTro === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => store.setContextSetup({ vaiTro: opt.id })}
                          className={`p-2 border text-left cursor-pointer transition-colors ${
                            isSelected
                              ? 'border-[#A8322A] bg-[#F2EDE3]'
                              : 'border-[#2C2A26]/12 bg-[#FBF8F2] hover:border-[#2C2A26]/30'
                          }`}
                        >
                          <span className="font-display text-xs text-[#2C2A26] block leading-tight">
                            {opt.label}
                          </span>
                          <span className="text-[9px] font-sans text-[#6E5439] block mt-0.5 truncate">
                            {opt.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 6. PHONG CÁCH CÁ NHÂN */}
              <div className="border border-[#2C2A26]/12 bg-[#F2EDE3]/50 p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 hairline-b">
                    <span className="micro-label text-[#2C2A26]">6. PHONG CÁCH</span>
                    <span className="micro-label text-[#A8322A]">NỚI LUẬT</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-3">
                    {phongCachOptions.map((opt) => {
                      const isSelected = contextSetup.phongCach === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => store.setContextSetup({ phongCach: opt.id })}
                          className={`p-2 border text-left cursor-pointer transition-colors ${
                            isSelected
                              ? 'border-[#A8322A] bg-[#F2EDE3]'
                              : 'border-[#2C2A26]/12 bg-[#FBF8F2] hover:border-[#2C2A26]/30'
                          }`}
                        >
                          <span className="font-display text-xs text-[#2C2A26] block leading-tight">
                            {opt.label}
                          </span>
                          <span className="text-[9px] font-sans text-[#6E5439] block mt-0.5 truncate">
                            {opt.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 7. NGÂN SÁCH DỰ KIẾN */}
              <div className="border border-[#2C2A26]/12 bg-[#F2EDE3]/50 p-4 flex flex-col justify-between md:col-span-2 lg:col-span-1">
                <div>
                  <div className="flex items-center justify-between pb-2 hairline-b">
                    <span className="micro-label text-[#2C2A26]">7. HÌNH THỨC SỞ HỮU</span>
                    <span className="micro-label text-[#6E5439]">NGÂN SÁCH</span>
                  </div>

                  <div className="flex flex-col gap-2 pt-3">
                    {nganSachOptions.map((opt) => {
                      const isSelected = contextSetup.nganSach === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => store.setContextSetup({ nganSach: opt.id })}
                          className={`p-2 border text-left cursor-pointer transition-colors ${
                            isSelected
                              ? 'border-[#A8322A] bg-[#F2EDE3]'
                              : 'border-[#2C2A26]/12 bg-[#FBF8F2] hover:border-[#2C2A26]/30'
                          }`}
                        >
                          <span className="font-display text-xs text-[#2C2A26] block">
                            {opt.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <p className="text-[11px] font-sans text-[#6E5439] italic pt-2 mt-2 border-t border-[#2C2A26]/10">
                  Dùng để định hướng gợi ý tiệm may và mức chi phí.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* THANH ĐIỀU HƯỚNG SANG BƯỚC 2: Bật ngay khi chọn Sự kiện & Vùng miền */}
      <div className="flex items-center justify-between pt-4 border-t border-[#2C2A26]/15">
        <div className="text-xs font-mono text-[#6E5439]">
          BỐI CẢNH: <span className="text-[#2C2A26] font-bold">{selectedEvent.ten}</span> · VÙNG: <span className="text-[#2C2A26] font-bold">{selectedRegion.ten}</span>
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
