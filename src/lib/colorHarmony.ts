import { HISTORICAL_PALETTES } from '../data/palettes';
import { EventContext } from '../types';

export interface ColorInputItem {
  hex: string;
  trongSo: number;
  lop: string;
}

export interface HarmonyDetail {
  ten: string;
  diem: number;
  toiDa: number;
  nhanXet: string;
}

export interface HarmonyResult {
  diem: number;
  nhan: 'Rất hài hoà' | 'Hài hoà' | 'Tạm được' | 'Lệch';
  chiTiet: HarmonyDetail[];
  goiYSua: string[];
  bangMauKhop: string | null;
}

export interface HSL {
  h: number; // 0 - 360
  s: number; // 0 - 100
  l: number; // 0 - 100
}

/**
 * Chuyển đổi mã hex (chuẩn #RRGGBB hoặc #RGB) sang RGB [0..255]
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) {
    return { r: 128, g: 128, b: 128 };
  }
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/**
 * Chuyển đổi RGB sang HSL [0..360, 0..100, 0..100]
 */
export function rgbToHsl(r: number, g: number, b: number): HSL {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const delta = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);

    if (max === rNorm) {
      h = ((gNorm - bNorm) / delta + (gNorm < bNorm ? 6 : 0)) * 60;
    } else if (max === gNorm) {
      h = ((bNorm - rNorm) / delta + 2) * 60;
    } else {
      h = ((rNorm - gNorm) / delta + 4) * 60;
    }
  }

  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export function hexToHsl(hex: string): HSL {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHsl(r, g, b);
}

/**
 * Khoảng cách hue ngắn nhất trên vòng tròn 360 độ (0 - 180)
 */
export function tinhKhoangCachHue(h1: number, h2: number): number {
  const diff = Math.abs(h1 - h2) % 360;
  return diff > 180 ? 360 - diff : diff;
}

/**
 * Khoảng cách màu sắc xấp xỉ cảm nhận thị giác (weighted Euclidean RGB)
 */
export function tinhDeltaEDonGian(hex1: string, hex2: string): number {
  const c1 = hexToRgb(hex1);
  const c2 = hexToRgb(hex2);
  const rmean = (c1.r + c2.r) / 2;
  const r = c1.r - c2.r;
  const g = c1.g - c2.g;
  const b = c1.b - c2.b;
  return Math.sqrt((((512 + rmean) * r * r) >> 8) + 4 * g * g + (((767 - rmean) * b * b) >> 8));
}

/**
 * Kiểm tra màu có tính trung tính không:
 * Saturation < 20% hoặc các sắc thái đặc thù tiệm cận đen/trắng (L < 16% hoặc L > 88% với saturation thấp)
 */
export function laMauTrungTinh(hsl: HSL): boolean {
  if (hsl.s < 20) return true;
  if (hsl.l > 86 && hsl.s < 45) return true; // các màu ngà, gạo, bạch
  if (hsl.l < 18 && hsl.s < 40) return true; // các màu the đen, mực tàu, chàm sẫm
  return false;
}

/**
 * ENGINE THUẦN TOÁN TÍNH ĐIỂM HÀI HOÀ MÀU SẮC
 * Đầy đủ 5 thành phần, tổng 100 điểm, phản hồi dưới 1ms
 */
export function tinhHaiHoa(
  mau: ColorInputItem[],
  boiCanh?: EventContext
): HarmonyResult {
  // Chuẩn hóa danh sách màu
  const danhSachMau = mau.length > 0
    ? mau
    : [
        { hex: '#16243A', trongSo: 0.5, lop: 'thuong_y' },
        { hex: '#F2EDE3', trongSo: 0.25, lop: 'ha_y' },
        { hex: '#2C2A26', trongSo: 0.1, lop: 'thu_phuc' },
        { hex: '#A8322A', trongSo: 0.05, lop: 'hai' },
        { hex: '#F2EDE3', trongSo: 0.1, lop: 'phu_kien' },
      ];

  const mauKemHsl = danhSachMau.map((item) => ({
    ...item,
    hsl: hexToHsl(item.hex),
  }));

  // Sắp xếp theo trọng số giảm dần
  const mauTheoTrongSo = [...mauKemHsl].sort((a, b) => b.trongSo - a.trongSo);

  // ---------------------------------------------------------------------------
  // 1. QUAN HỆ SẮC ĐỘ (30 ĐIỂM)
  // Tính khoảng cách hue giữa hai màu có trọng số lớn nhất
  // Màu có saturation dưới 10% được coi là trung tính và bỏ qua khi tính khoảng cách hue
  // ---------------------------------------------------------------------------
  const mauCoSacDo = mauTheoTrongSo.filter((m) => m.hsl.s >= 10);
  let diemSacDo = 18;
  let nhanXetSacDo = '';

  if (mauCoSacDo.length <= 1) {
    // Chỉ có 1 màu hoặc toàn bộ là màu trung tính
    diemSacDo = 30;
    nhanXetSacDo = 'Bảng màu đơn sắc hoặc nền trung tính tĩnh tại, thuần khiết.';
  } else {
    const c1 = mauCoSacDo[0];
    const c2 = mauCoSacDo[1];
    const hueDiff = tinhKhoangCachHue(c1.hsl.h, c2.hsl.h);

    if (hueDiff < 15) {
      diemSacDo = 30;
      nhanXetSacDo = `Đơn sắc (${hueDiff}°), sắc thái đồng nhất và trang nhã.`;
    } else if (hueDiff <= 45) {
      diemSacDo = 28;
      nhanXetSacDo = `Tương đồng (${hueDiff}°), chuyển sắc mềm mại và tự nhiên.`;
    } else if (hueDiff >= 150 && hueDiff <= 210) {
      diemSacDo = 26;
      nhanXetSacDo = `Bổ túc trực tiếp (${hueDiff}°), đối trọng sắc sảo và tôn dáng.`;
    } else if (hueDiff >= 110 && hueDiff <= 130) {
      diemSacDo = 24;
      nhanXetSacDo = `Tam giác cân (${hueDiff}°), phong phú và sinh động.`;
    } else if ((hueDiff >= 46 && hueDiff <= 109) || (hueDiff >= 131 && hueDiff <= 149)) {
      diemSacDo = 14;
      nhanXetSacDo = `Vùng chênh vênh (${hueDiff}°), thiếu nhịp điệu tương phản rõ ràng.`;
    } else {
      diemSacDo = 18;
      nhanXetSacDo = `Quan hệ góc sắc độ ${hueDiff}°, cần thêm điểm nối chuyển tiếp.`;
    }
  }

  // ---------------------------------------------------------------------------
  // 2. TƯƠNG PHẢN SÁNG (25 ĐIỂM)
  // deltaL = |L(thượng y) - L(hạ y)|
  // ---------------------------------------------------------------------------
  const thuongYItem = mauKemHsl.find((m) => m.lop === 'thuong_y');
  const haYItem = mauKemHsl.find((m) => m.lop === 'ha_y');

  let deltaL = 35; // Giá trị tiêu chuẩn dự phòng nếu thiếu một trong hai lớp
  if (thuongYItem && haYItem) {
    deltaL = Math.abs(thuongYItem.hsl.l - haYItem.hsl.l);
  } else if (thuongYItem) {
    // So với nền mặc định của hạ y (ngà ~92)
    deltaL = Math.abs(thuongYItem.hsl.l - 92);
  }

  let diemTuongPhan = 16;
  let nhanXetTuongPhan = '';

  if (deltaL < 8) {
    diemTuongPhan = 8;
    nhanXetTuongPhan = `Tương phản sáng rất thấp (ΔL = ${deltaL}), áo và quần dễ bị bệt dính hình khối.`;
  } else if (deltaL <= 20) {
    diemTuongPhan = 16;
    nhanXetTuongPhan = `Tương phản sáng nhẹ (ΔL = ${deltaL}), tách bạch vừa phải.`;
  } else if (deltaL <= 55) {
    diemTuongPhan = 25;
    nhanXetTuongPhan = `Khoảng lý tưởng (ΔL = ${deltaL}), phân định rõ ràng thân áo và vạt quần.`;
  } else if (deltaL <= 77) {
    diemTuongPhan = 19;
    nhanXetTuongPhan = `Tương phản cao (ΔL = ${deltaL}), áo tối quần sáng hoặc ngược lại, rõ nét.`;
  } else {
    diemTuongPhan = 12;
    nhanXetTuongPhan = `Tương phản quá gắt (ΔL = ${deltaL}), có thể gây cảm giác chói hoặc cắt khúc cơ thể.`;
  }

  // ---------------------------------------------------------------------------
  // 3. KỶ LUẬT BÃO HOÀ (20 ĐIỂM)
  // Đếm số màu có saturation trên 70% VÀ trọng số trên 0.2
  // ---------------------------------------------------------------------------
  const soMauRuc = mauKemHsl.filter((m) => m.hsl.s > 70 && m.trongSo > 0.2).length;
  let diemBaoHoa = 20;
  let nhanXetBaoHoa = '';

  if (soMauRuc <= 1) {
    diemBaoHoa = 20;
    nhanXetBaoHoa = 'Kỷ luật bão hòa chuẩn mực, mắt người nhìn có điểm tựa êm dịu.';
  } else if (soMauRuc === 2) {
    diemBaoHoa = 11;
    nhanXetBaoHoa = 'Có 2 mảng màu rực diện tích lớn, tranh chấp thị giác.';
  } else {
    diemBaoHoa = 4;
    nhanXetBaoHoa = 'Từ 3 màu rực bão hòa cao cùng lúc, phá vỡ vẻ điềm đạm cổ truyền.';
  }

  // ---------------------------------------------------------------------------
  // 4. NEO TRUNG TÍNH (15 ĐIỂM)
  // Có ít nhất một màu saturation dưới 20% (hoặc trung tính) và trọng số từ 0.1
  // ---------------------------------------------------------------------------
  const coNeoTrungTinh = mauKemHsl.some(
    (m) => m.trongSo >= 0.1 && (m.hsl.s < 20 || laMauTrungTinh(m.hsl))
  );

  let diemTrungTinh = coNeoTrungTinh ? 15 : 6;
  let nhanXetTrungTinh = coNeoTrungTinh
    ? 'Có ít nhất một sắc độ trung tính neo giữ sự đĩnh đạc cho tổng thể.'
    : 'Thiếu vắng màu trung tính để làm dịu các mảng màu chính.';

  // ---------------------------------------------------------------------------
  // 5. KHỚP BẢNG MÀU GỢI Ý (10 ĐIỂM)
  // So bộ màu đang chọn với 6 bảng màu gợi ý trong data/palettes.ts (nhóm tổng hợp, chưa gắn nguồn)
  // ---------------------------------------------------------------------------
  let maxKhop = 0;
  let bangMauKhopTen: string | null = null;

  for (const pal of HISTORICAL_PALETTES) {
    let matchedCount = 0;
    for (const palHex of pal.mauSac) {
      const hasMatch = mauKemHsl.some(
        (userColor) => tinhDeltaEDonGian(userColor.hex, palHex) <= 38
      );
      if (hasMatch) matchedCount++;
    }
    if (matchedCount > maxKhop) {
      maxKhop = matchedCount;
      bangMauKhopTen = pal.ten;
    }
  }

  let diemChinhDanh = 2;
  let nhanXetChinhDanh = '';

  if (maxKhop >= 3) {
    diemChinhDanh = 10;
    nhanXetChinhDanh = `Khớp bảng màu gợi ý "${bangMauKhopTen}".`;
  } else if (maxKhop === 2) {
    diemChinhDanh = 7;
    nhanXetChinhDanh = `Gần với bảng màu gợi ý "${bangMauKhopTen}".`;
  } else if (maxKhop === 1) {
    diemChinhDanh = 4;
    nhanXetChinhDanh = 'Có một màu trùng với bảng màu gợi ý.';
  } else {
    diemChinhDanh = 2;
    bangMauKhopTen = null;
    nhanXetChinhDanh = 'Chưa khớp bảng màu gợi ý nào.';
  }

  // ---------------------------------------------------------------------------
  // TỔNG ĐIỂM & NHÃN
  // ---------------------------------------------------------------------------
  const tongDiem = Math.min(
    100,
    Math.max(0, diemSacDo + diemTuongPhan + diemBaoHoa + diemTrungTinh + diemChinhDanh)
  );

  let nhan: 'Rất hài hoà' | 'Hài hoà' | 'Tạm được' | 'Lệch';
  if (tongDiem >= 85) {
    nhan = 'Rất hài hoà';
  } else if (tongDiem >= 70) {
    nhan = 'Hài hoà';
  } else if (tongDiem >= 55) {
    nhan = 'Tạm được';
  } else {
    nhan = 'Lệch';
  }

  // ---------------------------------------------------------------------------
  // GỢI Ý SỬA CỤ THỂ HOẶC KHEN NGỢI (Tuân thủ nghiêm ngặt 4 quy tắc đề bài)
  // 1. Chỉ sinh gợi ý sửa khi thành phần tương ứng đạt DƯỚI 60% điểm tối đa của nó.
  // 2. Điểm từ 85: KHÔNG sinh gợi ý sửa, thay vào đó sinh đúng 1 câu KHEN CỤ THỂ.
  // 3. Điểm 70 tới 84: Sinh TỐI ĐA 1 câu gợi ý, lấy từ thành phần mất điểm nhiều nhất (đạt < 60%).
  // 4. Dưới 70: Sinh TỐI ĐA 2 câu gợi ý từ các thành phần đạt < 60%.
  // ---------------------------------------------------------------------------
  interface ComponentEvaluation {
    loai: 'tuong_phan' | 'bao_hoa' | 'trung_tinh' | 'sac_do' | 'chinh_danh';
    ten: string;
    diem: number;
    toiDa: number;
    matDiem: number;
    duoiNguong60: boolean;
    cauGoiY: string;
  }

  // 1. Tương phản sáng (tối đa 25, dưới 60% là < 15)
  let cauGoiYTuongPhan = '';
  if (deltaL < 8) {
    cauGoiYTuongPhan = 'Quần và áo đang cùng độ sáng, đổi quần sang màu ngà hoặc the đen để tách bạch khỏi thân áo.';
  } else if (deltaL > 77) {
    cauGoiYTuongPhan = 'Độ chênh lệch sáng tối giữa áo và quần quá gắt, chọn màu hạ y dịu hơn để hài hòa thị giác.';
  } else {
    cauGoiYTuongPhan = 'Độ chênh sáng giữa áo và quần chưa tối ưu, nên tăng độ tương phản để hình khối trang phục tách bạch.';
  }

  // 2. Kỷ luật bão hoà (tối đa 20, dưới 60% là < 12)
  const cauGoiYBaoHoa = 'Đang có hai hoặc nhiều màu rực cùng lúc, hạ khăn hoặc phụ kiện xuống nâu non hay the đen để mắt có chỗ nghỉ.';

  // 3. Neo trung tính (tối đa 15, dưới 60% là < 9)
  const cauGoiYTrungTinh = 'Tổng thể thiếu màu trung tính neo giữ, hãy chọn hạ y màu ngà hoặc khăn màu the đen để bố cục đĩnh đạc.';

  // 4. Quan hệ sắc độ (tối đa 30, dưới 60% là < 18)
  const cauGoiYSacDo = 'Hai sắc màu chính đang ở vùng chênh vênh, thử đưa một lớp về gam tương đồng hoặc đối lập bổ túc hoàn toàn.';

  // 5. Tính chính danh (tối đa 10, dưới 60% là < 6)
  const cauGoiYChinhDanh = 'Bảng màu chưa ăn nhập với cổ phục, bạn có thể tham khảo bảng Chàm - Điều - Ngà hoặc Huế nghi lễ.';

  const danhGiaCacThanhPhan: ComponentEvaluation[] = [
    {
      loai: 'tuong_phan',
      ten: 'Tương phản sáng',
      diem: diemTuongPhan,
      toiDa: 25,
      matDiem: 25 - diemTuongPhan,
      duoiNguong60: diemTuongPhan < 15,
      cauGoiY: cauGoiYTuongPhan,
    },
    {
      loai: 'bao_hoa',
      ten: 'Kỷ luật bão hoà',
      diem: diemBaoHoa,
      toiDa: 20,
      matDiem: 20 - diemBaoHoa,
      duoiNguong60: diemBaoHoa < 12,
      cauGoiY: cauGoiYBaoHoa,
    },
    {
      loai: 'trung_tinh',
      ten: 'Neo trung tính',
      diem: diemTrungTinh,
      toiDa: 15,
      matDiem: 15 - diemTrungTinh,
      duoiNguong60: diemTrungTinh < 9,
      cauGoiY: cauGoiYTrungTinh,
    },
    {
      loai: 'sac_do',
      ten: 'Quan hệ sắc độ',
      diem: diemSacDo,
      toiDa: 30,
      matDiem: 30 - diemSacDo,
      duoiNguong60: diemSacDo < 18,
      cauGoiY: cauGoiYSacDo,
    },
    {
      loai: 'chinh_danh',
      ten: 'Tính chính danh truyền thống',
      diem: diemChinhDanh,
      toiDa: 10,
      matDiem: 10 - diemChinhDanh,
      duoiNguong60: diemChinhDanh < 6,
      cauGoiY: cauGoiYChinhDanh,
    },
  ];

  // Lọc các thành phần đạt DƯỚI 60% điểm tối đa, sắp xếp theo số điểm mất nhiều nhất
  const thanhPhanCanSua = danhGiaCacThanhPhan
    .filter((tp) => tp.duoiNguong60)
    .sort((a, b) => b.matDiem - a.matDiem);

  const goiYSua: string[] = [];

  if (tongDiem >= 85) {
    // QUY TẮC 2: Từ 85 điểm trở lên: TUYỆT ĐỐI KHÔNG sinh gợi ý sửa, sinh đúng 1 câu khen CỤ THỂ
    let cauKhen = '';
    if (bangMauKhopTen && diemChinhDanh >= 7) {
      if (diemTrungTinh === 15) {
        cauKhen = `Bộ màu khớp bảng điển chế ${bangMauKhopTen}, và có sắc trung tính làm chỗ nghỉ mắt.`;
      } else if (diemSacDo >= 26) {
        cauKhen = `Bộ màu khớp bảng điển chế ${bangMauKhopTen}, quan hệ sắc độ đồng nhất và trang nhã.`;
      } else if (diemTuongPhan >= 19) {
        cauKhen = `Bộ màu khớp bảng điển chế ${bangMauKhopTen}, độ tương phản sáng tối phân định rõ ràng.`;
      } else {
        cauKhen = `Bộ màu khớp chuẩn mực bảng điển chế di sản ${bangMauKhopTen}.`;
      }
    } else if (diemTrungTinh === 15 && diemTuongPhan >= 19) {
      cauKhen = 'Độ tương phản sáng tối phân định rõ ràng thân áo và tà quần, có sắc trung tính làm chỗ nghỉ mắt.';
    } else if (diemSacDo >= 26 && diemTrungTinh === 15) {
      cauKhen = 'Sắc thái màu sắc hài hoà trang nhã, có sắc độ trung tính neo giữ sự đĩnh đạc.';
    } else if (diemBaoHoa === 20 && diemTuongPhan >= 19) {
      cauKhen = 'Kỷ luật bão hòa chuẩn mực êm dịu, tương phản sáng tối tách bạch rõ nét.';
    } else {
      cauKhen = 'Bố cục màu sắc đạt độ tinh tế cao, giữ được sự đoan trang đúng phép tắc truyền thống.';
    }
    goiYSua.push(cauKhen);
  } else if (tongDiem >= 70) {
    // QUY TẮC 3: Điểm 70 tới 84: Sinh TỐI ĐA 1 câu gợi ý, lấy từ thành phần mất điểm nhiều nhất (đạt < 60%)
    if (thanhPhanCanSua.length > 0) {
      goiYSua.push(thanhPhanCanSua[0].cauGoiY);
    } else {
      // Khi không có thành phần nào dưới 60%: Không sinh câu sửa tiêu cực
      goiYSua.push('Bảng màu đạt độ hài hoà tốt, các sắc độ phối hợp chừng mực và thanh nhã.');
    }
  } else {
    // QUY TẮC 4: Dưới 70 điểm: Sinh TỐI ĐA 2 câu gợi ý từ các thành phần đạt < 60%
    if (thanhPhanCanSua.length > 0) {
      thanhPhanCanSua.slice(0, 2).forEach((tp) => goiYSua.push(tp.cauGoiY));
    } else {
      goiYSua.push('Bố cục màu sắc cần thêm sắc độ trung tính hoặc điều chỉnh độ sáng để tạo điểm nhấn hài hòa.');
    }
  }

  const chiTiet: HarmonyDetail[] = [
    { ten: 'Quan hệ sắc độ', diem: diemSacDo, toiDa: 30, nhanXet: nhanXetSacDo },
    { ten: 'Tương phản sáng', diem: diemTuongPhan, toiDa: 25, nhanXet: nhanXetTuongPhan },
    { ten: 'Kỷ luật bão hoà', diem: diemBaoHoa, toiDa: 20, nhanXet: nhanXetBaoHoa },
    { ten: 'Neo trung tính', diem: diemTrungTinh, toiDa: 15, nhanXet: nhanXetTrungTinh },
    { ten: 'Tính chính danh truyền thống', diem: diemChinhDanh, toiDa: 10, nhanXet: nhanXetChinhDanh },
  ];

  return {
    diem: tongDiem,
    nhan,
    chiTiet,
    goiYSua,
    bangMauKhop: bangMauKhopTen,
  };
}

/**
 * 6 BỘ MẪU TỰ KIỂM ĐỊNH THEO QUY ĐỊNH
 */
export interface ColorTestCase {
  id: string;
  ten: string;
  mau: ColorInputItem[];
  khoangMongDoi: { min?: number; max?: number };
}

export const TEST_CASES: ColorTestCase[] = [
  {
    id: 'test-1',
    ten: 'Chàm + ngà + điều (bảng màu lịch sử)',
    mau: [
      { hex: '#16243A', trongSo: 0.50, lop: 'thuong_y' }, // Chàm
      { hex: '#F2EDE3', trongSo: 0.25, lop: 'ha_y' },     // Ngà
      { hex: '#A8322A', trongSo: 0.10, lop: 'thu_phuc' }, // Điều
      { hex: '#16243A', trongSo: 0.05, lop: 'hai' },      // Chàm
      { hex: '#F2EDE3', trongSo: 0.10, lop: 'phu_kien' }, // Ngà
    ],
    khoangMongDoi: { min: 80 },
  },
  {
    id: 'test-2',
    ten: 'Ba màu bão hoà cao cùng lúc',
    mau: [
      { hex: '#FF0055', trongSo: 0.45, lop: 'thuong_y' }, // Đỏ sen rực S=100%
      { hex: '#00E5FF', trongSo: 0.30, lop: 'ha_y' },     // Cyan neon S=100%
      { hex: '#FFD700', trongSo: 0.25, lop: 'thu_phuc' }, // Vàng chanh rực S=100%
    ],
    khoangMongDoi: { max: 59 },
  },
  {
    id: 'test-3',
    ten: 'Toàn bộ cùng một màu (tương phản sáng thấp)',
    mau: [
      { hex: '#16243A', trongSo: 0.50, lop: 'thuong_y' },
      { hex: '#16243A', trongSo: 0.25, lop: 'ha_y' },
      { hex: '#16243A', trongSo: 0.10, lop: 'thu_phuc' },
      { hex: '#16243A', trongSo: 0.05, lop: 'hai' },
      { hex: '#16243A', trongSo: 0.10, lop: 'phu_kien' },
    ],
    khoangMongDoi: { max: 69 },
  },
  {
    id: 'test-4',
    ten: 'Hai màu bổ túc cân bằng có neo trung tính',
    mau: [
      { hex: '#1E56A0', trongSo: 0.45, lop: 'thuong_y' }, // Lam
      { hex: '#D3752A', trongSo: 0.30, lop: 'ha_y' },     // Cam (bổ túc ~180°)
      { hex: '#2C2A26', trongSo: 0.15, lop: 'thu_phuc' }, // The đen (trung tính S<20%)
      { hex: '#F2EDE3', trongSo: 0.10, lop: 'phu_kien' }, // Ngà
    ],
    khoangMongDoi: { min: 75 },
  },
  {
    id: 'test-5',
    ten: 'Một màu duy nhất cộng trung tính',
    mau: [
      { hex: '#A8322A', trongSo: 0.50, lop: 'thuong_y' }, // Điều (màu duy nhất)
      { hex: '#F2EDE3', trongSo: 0.30, lop: 'ha_y' },     // Ngà (trung tính)
      { hex: '#2C2A26', trongSo: 0.10, lop: 'thu_phuc' }, // The đen (trung tính)
      { hex: '#2C2A26', trongSo: 0.10, lop: 'hai' },
    ],
    khoangMongDoi: { min: 70 },
  },
  {
    id: 'test-6',
    ten: 'Màu ngẫu nhiên lệch hoàn toàn',
    mau: [
      { hex: '#7C3AED', trongSo: 0.45, lop: 'thuong_y' }, // Tím chói H=262, S=84%, L=58%
      { hex: '#CA8A04', trongSo: 0.30, lop: 'ha_y' },     // Vàng đục H=42, S=94%, L=40% (ΔHue=140° vùng chênh vênh)
      { hex: '#06B6D4', trongSo: 0.25, lop: 'thu_phuc' }, // Cyan gắt S=95%, không trung tính
    ],
    khoangMongDoi: { max: 54 },
  },
];

export interface TestResultItem {
  id: string;
  ten: string;
  diem: number;
  nhan: string;
  yeuCau: string;
  thoaMan: boolean;
  cauGoiY: string;
  mauThuanVoiNhanDiem: boolean;
}

/**
 * Kiểm tra xem câu gợi ý sinh ra có mâu thuẫn với nhãn điểm số không:
 * - Điểm >= 85: Phải là câu khen ngợi cụ thể, không được chứa câu sửa tiêu cực
 * - Điểm 70 - 84: Tối đa 1 câu gợi ý
 * - Điểm < 70: Tối đa 2 câu gợi ý
 */
export function kiemTraMauThuanNhanDiem(
  diem: number,
  _nhan: string,
  goiYSua: string[]
): boolean {
  const text = (goiYSua[0] || '').toLowerCase();
  if (diem >= 85) {
    const tuSuaTieuCuc = [
      'quá gắt',
      'chênh vênh',
      'chưa ăn nhập',
      'thiếu màu trung tính',
      'cùng độ sáng',
      'lệch nhịp',
      'đổi quần',
      'hạ khăn',
      'chưa tối ưu',
      'đang có hai màu rực',
      'đang có hai hoặc nhiều màu rực',
    ];
    return tuSuaTieuCuc.some((w) => text.includes(w)) || goiYSua.length > 1;
  }
  if (diem >= 70 && diem < 85) {
    return goiYSua.length > 1;
  }
  if (diem < 70) {
    return goiYSua.length > 2;
  }
  return false;
}

/**
 * HÀM TỰ KIỂM BẮT BUỘC:
 * Chạy 6 bộ màu mẫu, kiểm tra console.assert và đo lường performance
 */
export function tuKiemColorHarmony(): {
  ketQua: TestResultItem[];
  tatCaDat: boolean;
  thoiGianChayTbMs: number;
} {
  const ketQua: TestResultItem[] = [];
  let tatCaDat = true;

  // Đo lường tốc độ với 1,000 lượt chạy
  const ITERATIONS = 1000;
  const start = typeof performance !== 'undefined' ? performance.now() : Date.now();

  for (let i = 0; i < ITERATIONS; i++) {
    for (const tc of TEST_CASES) {
      tinhHaiHoa(tc.mau);
    }
  }

  const end = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const thoiGianChayTbMs = (end - start) / (ITERATIONS * TEST_CASES.length);

  // Đánh giá từng ca kiểm thử
  for (const tc of TEST_CASES) {
    const res = tinhHaiHoa(tc.mau);
    let thoaMan = true;
    let yeuCau = '';

    if (tc.khoangMongDoi.min !== undefined) {
      yeuCau = `≥ ${tc.khoangMongDoi.min}`;
      if (res.diem < tc.khoangMongDoi.min) thoaMan = false;
    }
    if (tc.khoangMongDoi.max !== undefined) {
      yeuCau = `≤ ${tc.khoangMongDoi.max}`;
      if (res.diem > tc.khoangMongDoi.max) thoaMan = false;
    }

    const cauGoiY = res.goiYSua.join(' | ');
    const mauThuan = kiemTraMauThuanNhanDiem(res.diem, res.nhan, res.goiYSua);

    if (mauThuan) {
      thoaMan = false;
    }

    if (!thoaMan) {
      tatCaDat = false;
      console.error(
        `[ASSERT FAIL] ${tc.ten}: Điểm đạt ${res.diem}, yêu cầu ${yeuCau}, mâu thuẫn nhãn: ${mauThuan}`,
        res
      );
    } else {
      console.assert(
        thoaMan,
        `[ASSERT PASS] ${tc.ten}: Điểm đạt ${res.diem} (${yeuCau})`
      );
    }

    ketQua.push({
      id: tc.id,
      ten: tc.ten,
      diem: res.diem,
      nhan: res.nhan,
      yeuCau,
      thoaMan,
      cauGoiY,
      mauThuanVoiNhanDiem: mauThuan,
    });
  }

  // In bảng 6 phép kiểm định trực quan với 2 cột mới theo yêu cầu
  const bangHienThi = ketQua.map((item) => ({
    'Mã': item.id,
    'Bộ màu': item.ten,
    'Điểm & Nhãn': `${item.diem}/100 (${item.nhan})`,
    'Yêu cầu': item.yeuCau,
    'Câu gợi ý sinh ra': item.cauGoiY,
    'Mâu thuẫn nhãn điểm?': item.mauThuanVoiNhanDiem ? 'CÓ (LỖI)' : 'KHÔNG (CHUẨN)',
  }));

  if (typeof console !== 'undefined' && console.table) {
    console.log('\n=== BẢNG 6 PHÉP KIỂM ĐỊNH HÀI HOÀ MÀU SẮC (COLOR HARMONY) ===');
    console.table(bangHienThi);
  }

  return {
    ketQua,
    tatCaDat,
    thoiGianChayTbMs: Math.round(thoiGianChayTbMs * 10000) / 10000,
  };
}

// Chạy tự kiểm 1 lần khi ở môi trường phát triển
if (typeof window !== 'undefined' && (import.meta as any).env?.DEV) {
  const report = tuKiemColorHarmony();
  if (!report.tatCaDat) {
    console.warn('[COLOR HARMONY] Có bài kiểm tra chưa đạt yêu cầu ngưỡng!');
  }
}
