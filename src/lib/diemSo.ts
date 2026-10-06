import { CultureFlag, LookState } from '../types';
import { ColorInputItem } from './colorHarmony';
import { mauThuongY, mauHaY, mauThuPhuc, mauHai } from './mauLook';

// Một chỗ duy nhất tính điểm, dùng chung cho màn phối đồ, Look Card và màn so sánh,
// để cùng một bộ đồ không ra ba con số khác nhau. Mỗi điểm đều có công thức nói được thành lời.

/** Màu thật của bộ đồ, đúng trọng số từng lớp. Chỉ tính phụ kiện khi người dùng thật sự chọn. */
export function mauThucTeCuaLook(look: LookState): ColorInputItem[] {
  const ds: ColorInputItem[] = [];
  const them = (hex: string | undefined, trongSo: number, lop: string) => {
    if (hex) ds.push({ hex, trongSo, lop });
  };
  them(mauThuongY(look) || '#16243A', 0.5, 'thuong_y');
  them(mauHaY(look), 0.25, 'ha_y');
  them(mauThuPhuc(look), 0.1, 'thu_phuc');
  them(mauHai(look), 0.05, 'hai');
  them(look.phuKien?.[0]?.mauTruyenThong?.[0], 0.1, 'phu_kien');
  return ds;
}

export const MO_TA_DIEM_BOI_CANH = 'Đúng mức dịp yêu cầu: 100. Mỗi bậc thiếu trừ 25, mỗi bậc thừa trừ 10.';
export const MO_TA_DIEM_VAN_HOA = 'Bắt đầu 100. Mỗi luật đỏ trừ 30, mỗi luật vàng trừ 10.';

/**
 * Điểm hợp bối cảnh: so mức trang trọng của áo với mức dịp yêu cầu.
 * Thiếu trang trọng bị trừ nặng hơn thừa, vì mặc xuề xoà ở dịp lễ là thất lễ, còn mặc chỉn chu hơn
 * một chút thì không. Mặc quá lễ phục cho dịp đời thường đã có luật CR-21 riêng.
 */
export function diemHopBoiCanh(look: LookState, mucYeuCau: number): { diem: number; chenh: number } {
  const mucAo = look.thuongY?.mucTrangTrong ?? 3;
  const chenh = mucAo - mucYeuCau;
  const diem = chenh >= 0 ? 100 - 10 * chenh : 100 - 25 * -chenh;
  return { diem: Math.max(0, diem), chenh };
}

/** Điểm văn hoá: trừ theo số luật đỏ, vàng đang bật (luật đã hạ xuống mức thông tin không trừ). */
export function diemVanHoa(ketQua: CultureFlag): number {
  const soDo = ketQua.soLuatDo ?? (ketQua.mucDoChung === 'do' ? 1 : 0);
  const soVang = ketQua.soLuatVang ?? (ketQua.mucDoChung === 'vang' ? 1 : 0);
  return Math.max(0, 100 - 30 * soDo - 10 * soVang);
}

/**
 * Kết luận so sánh khi không gọi được Gemini: chỉ nói điều suy ra được từ ba điểm số,
 * không gán cờ "an toàn" cho bộ đang bị cờ đỏ, không bịa lý do kiểu dáng.
 */
export function ketLuanSoSanh(
  looks: { ten: string; scoreMau: number; scoreBoiCanh: number; scoreVanHoa: number }[]
): { lookTotNhat: string; lyDo: string; khiNaoChonCaiKia: string } {
  if (looks.length === 0) {
    return { lookTotNhat: 'Chưa có phương án', lyDo: 'Chưa có phương án nào để so sánh.', khiNaoChonCaiKia: 'Hãy chọn ít nhất 2 phương án.' };
  }
  const tong = (l: (typeof looks)[number]) => l.scoreMau + l.scoreBoiCanh + l.scoreVanHoa;
  const sapXep = [...looks].sort((a, b) => tong(b) - tong(a));
  const best = sapXep[0];
  const lyDo = `${best.ten} có tổng điểm cao nhất: hài hoà màu ${best.scoreMau}/100, hợp bối cảnh ${best.scoreBoiCanh}/100, văn hoá ${best.scoreVanHoa}/100.`;
  if (sapXep.length < 2) return { lookTotNhat: best.ten, lyDo, khiNaoChonCaiKia: 'Chỉ có một phương án.' };

  const nhi = sapXep[1];
  const chiSo: { ten: string; khoa: 'scoreMau' | 'scoreBoiCanh' | 'scoreVanHoa' }[] = [
    { ten: 'hài hoà màu', khoa: 'scoreMau' },
    { ten: 'hợp bối cảnh', khoa: 'scoreBoiCanh' },
    { ten: 'văn hoá', khoa: 'scoreVanHoa' },
  ];
  const hon = chiSo.find((c) => nhi[c.khoa] > best[c.khoa]);
  const khiNaoChonCaiKia = hon
    ? `Chọn ${nhi.ten} nếu bạn coi trọng ${hon.ten} hơn: ${nhi.ten} được ${nhi[hon.khoa]}/100, còn ${best.ten} được ${best[hon.khoa]}/100.`
    : `${nhi.ten} không cao hơn ở chỉ số nào; chỉ nên chọn nếu bạn thích kiểu dáng của nó hơn.`;
  return { lookTotNhat: best.ten, lyDo, khiNaoChonCaiKia };
}

// Áo nhiều lớp, thân dài, tay thụng; áo mỏng một lớp. Theo cấu trúc mô tả trong garments.ts.
const AO_DAY = ['G01', 'G02', 'G05', 'G06'];
const AO_MONG = ['G08', 'G09'];

/** Nhận xét thời tiết cho một bộ: đọc nhiệt độ người dùng nhập, không gán cứng theo kiểu áo. */
export function nhanXetThoiTiet(look: LookState, nhietDo: number): string {
  const ao = look.thuongY?.id || '';
  if (nhietDo > 32 && AO_DAY.includes(ao)) return `Nóng: áo nhiều lớp, dễ ngột ngạt ở ${nhietDo}°C`;
  if (nhietDo < 18 && AO_MONG.includes(ao)) return `Lạnh: áo mỏng một lớp, nên mặc thêm lớp trong ở ${nhietDo}°C`;
  return `Hợp ${nhietDo}°C`;
}
