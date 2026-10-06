import { CULTURE_RULES } from '../data/cultureRules';
import { GARMENTS } from '../data/garments';
import { MOTIFS } from '../data/motifs';
import { EVENTS } from '../data/events';
import { timBo, BO_TRANG_PHUC } from '../data/boTrangPhuc';
import {
  LookState,
  EventContext,
  PhongCach,
  CultureFlag,
  ActiveRuleItem,
  CultureRule,
  NguoiMacGioiTinh,
  Garment,
} from '../types';

/**
 * TẦNG KIỂM TRA BỘ TRANG PHỤC VÀ GIỚI TÍNH TRUYỀN THỐNG (Chạy TRƯỚC 20 luật cũ)
 * BO-01: Hạ y khác bộ
 * BO-02: Thủ phục khác bộ
 * BO-03: Trang phục theo giới truyền thống
 * BO-04: Bộ chưa đủ món
 */
function kiemTraCacBoTrangPhuc(
  look: LookState,
  phongCach: PhongCach,
  nguoiMac: NguoiMacGioiTinh
): ActiveRuleItem[] {
  const activeBoRules: ActiveRuleItem[] = [];

  // =========================================================================
  // BO-01: Hạ y khác bộ
  // Điều kiện: hạ y đang chọn không nằm trong lớp haY của BẤT KỲ bộ nào chứa thượng y đang chọn.
  // Mức: ĐỎ khi phong cách là Nguyên bản hoặc Tối giản. VÀNG khi Remix phố hoặc Sân khấu.
  // =========================================================================
  if (look.thuongY && look.haY) {
    const cacBo = timBo(look.thuongY.id);
    if (cacBo.length > 0) {
      const isHaYHop = cacBo.some((b) => b.cacMonTheoLop.haY.includes(look.haY!.id));
      if (!isHaYHop) {
        const mucDoHienThi: 'do' | 'vang' =
          phongCach === 'nguyen_ban' || phongCach === 'toi_gian' ? 'do' : 'vang';
        const goiYHaYId = cacBo[0].cacMonTheoLop.haY[0] || 'G10';
        const monGoiY = GARMENTS.find((g) => g.id === goiYHaYId) || null;

        let thongDiep = '';
        if (look.haY.id === 'G11') {
          thongDiep = `Váy đụp thuộc bộ tứ thân Bắc Bộ, đi cùng áo tứ thân và yếm. ${look.thuongY.ten} theo truyền thống mặc với quần ống rộng.`;
        } else {
          thongDiep = `${look.haY.ten} không thuộc cùng hệ trang phục với ${look.thuongY.ten}. Theo truyền thống, ${look.thuongY.ten} mặc với ${monGoiY?.ten || 'quần lụa ống rộng'}.`;
        }

        const bo01Rule: CultureRule = {
          id: 'BO-01',
          ten: 'Hạ y khác bộ',
          dieuKien: 'Hạ y đang chọn không nằm trong lớp hạ y của bất kỳ bộ nào chứa thượng y đang chọn',
          kiemTra: () => true,
          mucDo: mucDoHienThi,
          thongDiep,
          cachSua: [
            {
              moTa: `Đổi hạ y sang ${monGoiY?.ten || 'quần lụa ống rộng'}`,
              apDung: (l: LookState) => ({
                ...l,
                haY: monGoiY || l.haY,
              }),
            },
          ],
          sourceIds: cacBo[0].sourceIds,
          doChacChan: 'da_xac_lap',
          phanLoaiLoi: 'dien_che',
          viDu: null,
          apDung: (l: LookState) => ({
            ...l,
            haY: monGoiY || l.haY,
          }),
        };

        activeBoRules.push({
          rule: bo01Rule,
          mucDoHienThi,
          isDowngraded: mucDoHienThi === 'vang' && (phongCach === 'remix_pho' || phongCach === 'san_khau'),
        });
      }
    }
  }

  // =========================================================================
  // BO-02: Thủ phục khác bộ
  // Điều kiện: thủ phục đang chọn không nằm trong lớp thuPhuc của bộ nào chứa thượng y.
  // Mức: VÀNG.
  // =========================================================================
  if (look.thuongY && look.thuPhuc) {
    const cacBo = timBo(look.thuongY.id);
    if (cacBo.length > 0) {
      const isThuPhucHop = cacBo.some((b) => b.cacMonTheoLop.thuPhuc.includes(look.thuPhuc!.id));
      if (!isThuPhucHop) {
        const mucDoHienThi: 'vang' = 'vang';
        const danhSachGoiY = cacBo[0].cacMonTheoLop.thuPhuc;
        const monGoiY = danhSachGoiY.length > 0 ? GARMENTS.find((g) => g.id === danhSachGoiY[0]) : null;

        let thongDiep = `${look.thuPhuc.ten} không thuộc cùng hệ trang phục với ${look.thuongY.ten}.`;
        if (danhSachGoiY.length > 0) {
          const tenGoiY = danhSachGoiY
            .map((id) => GARMENTS.find((g) => g.id === id)?.ten)
            .filter(Boolean)
            .join(' hoặc ');
          thongDiep += ` Theo truyền thống, ${look.thuongY.ten} thường đi cùng ${tenGoiY}.`;
        } else {
          thongDiep += ` Theo truyền thống, ${look.thuongY.ten} thường mặc mộc mạc và không bắt buộc đội khăn trang trọng.`;
        }

        const bo02Rule: CultureRule = {
          id: 'BO-02',
          ten: 'Thủ phục khác bộ',
          dieuKien: 'Thủ phục đang chọn không nằm trong lớp thủ phục của bộ nào chứa thượng y',
          kiemTra: () => true,
          mucDo: 'vang',
          thongDiep,
          cachSua: [
            {
              moTa: monGoiY ? `Đổi thủ phục sang ${monGoiY.ten}` : 'Bỏ khăn / để đầu trần',
              apDung: (l: LookState) => ({
                ...l,
                thuPhuc: monGoiY || null,
              }),
            },
          ],
          sourceIds: cacBo[0].sourceIds,
          doChacChan: 'da_xac_lap',
          phanLoaiLoi: 'dien_che',
          viDu: null,
          apDung: (l: LookState) => ({
            ...l,
            thuPhuc: monGoiY || null,
          }),
        };

        activeBoRules.push({
          rule: bo02Rule,
          mucDoHienThi,
          isDowngraded: false,
        });
      }
    }
  }

  // =========================================================================
  // BO-03: Trang phục theo giới truyền thống
  // Điều kiện: người dùng đã khai Nam hoặc Nữ, và có ít nhất một món đang chọn mà gioiTinh của món đó là giới còn lại.
  // Mức: ĐỎ khi phong cách là Nguyên bản hoặc Tối giản. VÀNG khi Remix phố. Chỉ là thông tin khi Sân khấu.
  // =========================================================================
  if (nguoiMac === 'nam' || nguoiMac === 'nu') {
    const targetOpposite = nguoiMac === 'nam' ? 'nu' : 'nam';
    const allSelected = [
      look.thuongY,
      look.haY,
      look.thuPhuc,
      look.hai,
      ...(look.phuKien || []),
    ].filter((g): g is Garment => Boolean(g));

    const itemsOpposite = allSelected.filter((g) => g.gioiTinh === targetOpposite);
    if (itemsOpposite.length > 0) {
      let mucDoHienThi: 'do' | 'vang' | 'thong_tin' = 'do';
      let isDowngraded = false;
      if (phongCach === 'nguyen_ban' || phongCach === 'toi_gian') {
        mucDoHienThi = 'do';
      } else if (phongCach === 'remix_pho') {
        mucDoHienThi = 'vang';
      } else if (phongCach === 'san_khau') {
        mucDoHienThi = 'thong_tin';
        isDowngraded = true;
      }

      const primaryItem = itemsOpposite[0];
      let thongDiep = '';
      if (primaryItem.id === 'G11' && nguoiMac === 'nam') {
        thongDiep = 'Theo truyền thống, váy đụp là trang phục của phụ nữ Bắc Bộ. Nếu bạn muốn một bộ đúng nguyên bản cho nam, có thể thay bằng quần lụa ống rộng.';
      } else {
        const phaiStr = primaryItem.gioiTinh === 'nu' ? 'phụ nữ' : 'nam giới';
        const nguoiMacStr = nguoiMac === 'nam' ? 'nam' : 'nữ';
        thongDiep = `Theo truyền thống, ${primaryItem.ten} là trang phục của ${phaiStr}. Nếu bạn muốn một bộ đúng nguyên bản cho ${nguoiMacStr}, có thể thay bằng món trang phục phù hợp.`;
      }

      const bo03Rule: CultureRule = {
        id: 'BO-03',
        ten: 'Trang phục theo giới truyền thống',
        dieuKien: 'Có món trang phục đang chọn mang giới tính truyền thống khác với giới đã khai',
        kiemTra: () => true,
        mucDo: mucDoHienThi === 'thong_tin' ? 'vang' : mucDoHienThi,
        thongDiep,
        cachSua: [
          {
            moTa: `Thay món khác giới bằng trang phục phù hợp cho ${nguoiMac === 'nam' ? 'nam' : 'nữ'}`,
            apDung: (l: LookState) => {
              let updated = { ...l };
              for (const item of itemsOpposite) {
                if (item.lop === 'ha_y') {
                  updated = { ...updated, haY: GARMENTS.find((g) => g.id === 'G10') || null };
                } else if (item.lop === 'thuong_y') {
                  updated = { ...updated, thuongY: GARMENTS.find((g) => g.id === 'G04') || null };
                } else if (item.lop === 'thu_phuc') {
                  updated = { ...updated, thuPhuc: GARMENTS.find((g) => g.id === (nguoiMac === 'nam' ? 'G13' : 'G12')) || null };
                } else if (item.lop === 'phu_kien') {
                  updated = { ...updated, phuKien: (updated.phuKien || []).filter((p) => p.id !== item.id) };
                }
              }
              return updated;
            },
          },
        ],
        sourceIds: ['S01', 'S05'],
        doChacChan: 'da_xac_lap',
        phanLoaiLoi: 'dien_che',
        viDu: null,
      };

      activeBoRules.push({
        rule: bo03Rule,
        mucDoHienThi,
        isDowngraded,
      });
    }
  }

  // =========================================================================
  // BO-04: Bộ chưa đủ món
  // Điều kiện: bộ tương ứng có món phụ kiện bắt buộc mà người dùng chưa chọn, ví dụ áo tứ thân mà chưa có yếm.
  // Mức: VÀNG.
  // =========================================================================
  if (look.thuongY) {
    const cacBo = timBo(look.thuongY.id);
    const boCoMonBatBuoc = cacBo.find((b) => b.cacMonTheoLop.phuKienBatBuoc && b.cacMonTheoLop.phuKienBatBuoc.length > 0);
    if (boCoMonBatBuoc && boCoMonBatBuoc.cacMonTheoLop.phuKienBatBuoc) {
      const monThieu = boCoMonBatBuoc.cacMonTheoLop.phuKienBatBuoc.find(
        (reqId) => !look.phuKien?.some((p) => p.id === reqId)
      );

      if (monThieu) {
        const monGarment = GARMENTS.find((g) => g.id === monThieu);
        const thongDiep = `Bộ ${boCoMonBatBuoc.ten} theo truyền thống mặc ngoài ${monGarment?.ten || 'yếm'} để giữ nét e ấp, kín đáo và hoàn thiện cấu trúc trang phục.`;

        const bo04Rule: CultureRule = {
          id: 'BO-04',
          ten: 'Bộ chưa đủ món',
          dieuKien: 'Bộ trang phục tương ứng có món phụ kiện bắt buộc chưa được chọn',
          kiemTra: () => true,
          mucDo: 'vang',
          thongDiep,
          cachSua: [
            {
              moTa: `Thêm ${monGarment?.ten || 'món còn thiếu'} vào bộ đồ`,
              apDung: (l: LookState) => {
                if (!monGarment) return l;
                return {
                  ...l,
                  phuKien: [...(l.phuKien || []), monGarment],
                };
              },
            },
          ],
          sourceIds: boCoMonBatBuoc.sourceIds,
          doChacChan: 'da_xac_lap',
          phanLoaiLoi: 'dien_che',
          viDu: null,
        };

        activeBoRules.push({
          rule: bo04Rule,
          mucDoHienThi: 'vang',
          isDowngraded: false,
        });
      }
    }
  }

  return activeBoRules;
}

/**
 * ENGINE CỤC BỘ CULTURE GUARD
 * 1. Chạy tầng kiểm tra bộ trang phục (BO-01 đến BO-04) TRƯỚC 20 luật cũ.
 * 2. Chạy 20 luật văn hóa truyền thống (CR-01 đến CR-20).
 * 3. Phân tầng cảnh báo đỏ/vàng/xanh, xử lý hạ cấp phong cách sân khấu.
 */
export function kiemTraVanHoa(
  look: LookState,
  boiCanh?: EventContext,
  phongCach: PhongCach = 'nguyen_ban',
  regionId?: string,
  nguoiMac?: NguoiMacGioiTinh
): CultureFlag {
  const userGender = nguoiMac || look.nguoiMac || 'khong_neu';
  const cacLuatBan: ActiveRuleItem[] = [];

  // TẦNG 1: Chạy 4 luật bộ trang phục TRƯỚC 20 luật cũ
  const boRulesFired = kiemTraCacBoTrangPhuc(look, phongCach, userGender);
  cacLuatBan.push(...boRulesFired);

  // TẦNG 2: Chạy 20 luật văn hóa truyền thống
  for (const rule of CULTURE_RULES) {
    const isTriggered = rule.kiemTra(look, boiCanh, regionId);
    if (isTriggered) {
      let mucDoHienThi: 'do' | 'vang' | 'xanh' | 'thong_tin' = rule.mucDo;
      let isDowngraded = false;

      // Điều chỉnh theo phong cách cá nhân:
      // Nếu người dùng chọn "Sân khấu", các luật mức 'vang' liên quan tới lệch vùng
      // hoặc lệch thời kỳ hạ xuống mức thông tin.
      // Luật mức 'do' KHÔNG BAO GIỜ được hạ cấp.
      if (phongCach === 'san_khau') {
        const isLechVungHoacThoiKy =
          rule.phanLoaiLoi === 'lech_vung' || rule.phanLoaiLoi === 'lech_thoi_ky';
        if (rule.mucDo === 'vang' && isLechVungHoacThoiKy) {
          mucDoHienThi = 'thong_tin';
          isDowngraded = true;
        }
      }

      cacLuatBan.push({
        rule,
        mucDoHienThi,
        isDowngraded,
      });
    }
  }

  // Xác định cờ chung:
  // - Nếu có ít nhất 1 luật mức 'do' -> ĐỎ
  // - Nếu có luật 'vang' (chưa hạ cấp) -> VÀNG
  // - Không luật nào hoặc chỉ có 'thong_tin' -> XANH
  const coLuatDo = cacLuatBan.some((item) => item.mucDoHienThi === 'do');
  const coLuatVang = cacLuatBan.some((item) => item.mucDoHienThi === 'vang');

  let mucDoChung: 'do' | 'vang' | 'xanh' = 'xanh';
  let tieuDe = 'CHƯA PHÁT HIỆN ĐIỂM LỆCH';

  if (coLuatDo) {
    mucDoChung = 'do';
    tieuDe = 'Cần cân nhắc';
  } else if (coLuatVang) {
    mucDoChung = 'vang';
    tieuDe = 'Hơi lệch bối cảnh';
  } else {
    mucDoChung = 'xanh';
    tieuDe = 'CHƯA PHÁT HIỆN ĐIỂM LỆCH';
  }

  // Sắp xếp ưu tiên: mức đỏ trước -> mức vàng -> mức thông tin -> mức xanh
  const uuTienMucDo: Record<string, number> = { do: 0, vang: 1, thong_tin: 2, xanh: 3 };
  const danhSachSapXep = [...cacLuatBan].sort(
    (a, b) => uuTienMucDo[a.mucDoHienThi] - uuTienMucDo[b.mucDoHienThi]
  );

  // Tối đa 3 luật nổi bật nhất
  const top3Luat = danhSachSapXep.slice(0, 3);

  // Soạn thông điệp đại diện
  let thongDiep = '';
  if (top3Luat.length > 0 && (coLuatDo || coLuatVang)) {
    thongDiep = top3Luat[0].rule.thongDiep;
  } else if (boRulesFired.length === 0 && cacLuatBan.length === 0) {
    // Không có bất kỳ luật nào bắn (kể cả BO-01 đến BO-04)
    thongDiep = 'Các món trong bộ thuộc cùng một hệ trang phục và hợp với bối cảnh bạn chọn.';
  } else {
    thongDiep = 'Chưa phát hiện điểm lệch theo bộ luật hiện có.';
  }

  return {
    mucDo: mucDoChung,
    mucDoChung,
    tieuDe,
    thongDiep,
    luatViPham: top3Luat,
    tongSoLuatBan: cacLuatBan.length,
    soLuatDo: cacLuatBan.filter((l) => l.mucDoHienThi === 'do').length,
    soLuatVang: cacLuatBan.filter((l) => l.mucDoHienThi === 'vang').length,
    ruleId: top3Luat[0]?.rule.id || '',
    cachSua: top3Luat[0]?.rule.cachSua[0]?.moTa || '',
    sourceIds: top3Luat[0]?.rule.sourceIds || [],
  };
}

/** Các luật xét màu áo; dùng để báo trước ở tab màu, trước khi người dùng chọn */
const LUAT_MAU = ['CR-04', 'CR-05', 'CR-06', 'CR-07'];

/** Những luật màu sẽ bật nếu đổi màu áo sang hex, với đúng bộ đồ và bối cảnh đang chọn */
export function luatMauKhiChon(
  look: LookState,
  hex: string,
  boiCanh?: EventContext,
  regionId?: string
): CultureRule[] {
  const thu = { ...look, mauChinh: hex };
  return CULTURE_RULES.filter((r) => LUAT_MAU.includes(r.id) && r.kiemTra(thu, boiCanh, regionId));
}

export interface GuardTestItem {
  stt: number;
  toHop: string;
  ketQuaMongDoi: string;
  ketQuaThat: string;
  dat: boolean;
  chiTiet: string;
}

/**
 * TỰ KIỂM ĐỊNH BẮT BUỘC 7 TỔ HỢP BỘ TRANG PHỤC VÀ GIỚI TÍNH CÙNG 8 BẪY CULTURE GUARD
 */
export function tuKiemCultureGuard(): {
  ketQua: GuardTestItem[];
  tatCaDat: boolean;
  tongSoLuat: number;
} {
  const ketQua: GuardTestItem[] = [];
  let tatCaDat = true;

  // Lấy các thực thể tham chiếu
  const aoNguThan = GARMENTS.find((g) => g.id === 'G04') || null;
  const vayDup = GARMENTS.find((g) => g.id === 'G11') || null;
  const khanVan = GARMENTS.find((g) => g.id === 'G12') || null;
  const aoTuThan = GARMENTS.find((g) => g.id === 'G03') || null;
  const yem = GARMENTS.find((g) => g.id === 'G16') || null;
  const quanLua = GARMENTS.find((g) => g.id === 'G10') || null;
  const khanDong = GARMENTS.find((g) => g.id === 'G13') || null;
  const aoBaBa = GARMENTS.find((g) => g.id === 'G09') || null;
  const aoTac = GARMENTS.find((g) => g.id === 'G05') || null;

  // ---------------------------------------------------------------------------
  // 7 TỔ HỢP BẮT BUỘC THEO YÊU CẦU MỤC 7
  // ---------------------------------------------------------------------------

  // a. Áo ngũ thân, váy đụp, khăn vấn, người mặc Nam, phong cách Nguyên bản: phải ra ĐỎ, có BO-01 và BO-03
  const tA_Look: LookState = { thuongY: aoNguThan, haY: vayDup, thuPhuc: khanVan };
  const tA_Res = kiemTraVanHoa(tA_Look, undefined, 'nguyen_ban', undefined, 'nam');
  const tA_HasBO01 = tA_Res.luatViPham.some((l) => l.rule.id === 'BO-01');
  const tA_HasBO03 = tA_Res.luatViPham.some((l) => l.rule.id === 'BO-03');
  const tA_Pass = tA_Res.mucDoChung === 'do' && tA_HasBO01 && tA_HasBO03;
  if (!tA_Pass) tatCaDat = false;
  ketQua.push({
    stt: 1,
    toHop: 'a. Áo ngũ thân, váy đụp, khăn vấn, người mặc Nam, Nguyên bản',
    ketQuaMongDoi: 'ĐỎ (có BO-01 và BO-03)',
    ketQuaThat: `${tA_Res.mucDoChung.toUpperCase()} (${tA_Res.luatViPham.map((l) => l.rule.id).join(', ')})`,
    dat: tA_Pass,
    chiTiet: 'Hạ y khác bộ (BO-01) và trang phục khác giới (BO-03) đều bị chặn mức ĐỎ.',
  });

  // b. Cùng tổ hợp a nhưng người mặc Không muốn nêu: phải ra ĐỎ, có BO-01, KHÔNG có BO-03
  const tB_Res = kiemTraVanHoa(tA_Look, undefined, 'nguyen_ban', undefined, 'khong_neu');
  const tB_HasBO01 = tB_Res.luatViPham.some((l) => l.rule.id === 'BO-01');
  const tB_HasBO03 = tB_Res.luatViPham.some((l) => l.rule.id === 'BO-03');
  const tB_Pass = tB_Res.mucDoChung === 'do' && tB_HasBO01 && !tB_HasBO03;
  if (!tB_Pass) tatCaDat = false;
  ketQua.push({
    stt: 2,
    toHop: 'b. Áo ngũ thân, váy đụp, khăn vấn, Không muốn nêu, Nguyên bản',
    ketQuaMongDoi: 'ĐỎ (có BO-01, KHÔNG có BO-03)',
    ketQuaThat: `${tB_Res.mucDoChung.toUpperCase()} (${tB_Res.luatViPham.map((l) => l.rule.id).join(', ')})`,
    dat: tB_Pass,
    chiTiet: 'Khi không khai giới tính, bỏ qua BO-03, chỉ giữ BO-01 mức ĐỎ.',
  });

  // c. Cùng tổ hợp a nhưng phong cách Sân khấu: phải ra VÀNG
  const tC_Res = kiemTraVanHoa(tA_Look, undefined, 'san_khau', undefined, 'nam');
  const tC_Pass = tC_Res.mucDoChung === 'vang';
  if (!tC_Pass) tatCaDat = false;
  ketQua.push({
    stt: 3,
    toHop: 'c. Áo ngũ thân, váy đụp, khăn vấn, người mặc Nam, Sân khấu',
    ketQuaMongDoi: 'VÀNG (BO-01 hạ mức vàng, BO-03 hạ mức thông tin)',
    ketQuaThat: `${tC_Res.mucDoChung.toUpperCase()} (${tC_Res.luatViPham.map((l) => `${l.rule.id}:${l.mucDoHienThi}`).join(', ')})`,
    dat: tC_Pass,
    chiTiet: 'Phong cách Sân khấu nới luật: BO-01 về VÀNG, BO-03 về THÔNG TIN -> Cờ chung VÀNG.',
  });

  // d. Áo tứ thân, váy đụp, khăn vấn, yếm, người mặc Nữ: phải ra CHƯA PHÁT HIỆN ĐIỂM LỆCH
  const tD_Look: LookState = {
    thuongY: aoTuThan,
    haY: vayDup,
    thuPhuc: khanVan,
    phuKien: [yem!],
  };
  const tD_Res = kiemTraVanHoa(tD_Look, undefined, 'nguyen_ban', undefined, 'nu');
  const tD_Pass = tD_Res.mucDoChung === 'xanh' && tD_Res.tieuDe === 'CHƯA PHÁT HIỆN ĐIỂM LỆCH';
  if (!tD_Pass) tatCaDat = false;
  ketQua.push({
    stt: 4,
    toHop: 'd. Áo tứ thân, váy đụp, khăn vấn, yếm, người mặc Nữ',
    ketQuaMongDoi: 'CHƯA PHÁT HIỆN ĐIỂM LỆCH (XANH)',
    ketQuaThat: `${tD_Res.tieuDe} (${tD_Res.mucDoChung.toUpperCase()})`,
    dat: tD_Pass,
    chiTiet: 'Bộ tứ thân Bắc Bộ chuẩn mực đầy đủ yếm, váy đụp, khăn vấn cho nữ.',
  });

  // e. Áo tứ thân, váy đụp, KHÔNG có yếm: phải ra VÀNG, có BO-04
  const tE_Look: LookState = {
    thuongY: aoTuThan,
    haY: vayDup,
    phuKien: [],
  };
  const tE_Res = kiemTraVanHoa(tE_Look, undefined, 'nguyen_ban');
  const tE_HasBO04 = tE_Res.luatViPham.some((l) => l.rule.id === 'BO-04');
  const tE_Pass = tE_Res.mucDoChung === 'vang' && tE_HasBO04;
  if (!tE_Pass) tatCaDat = false;
  ketQua.push({
    stt: 5,
    toHop: 'e. Áo tứ thân, váy đụp, KHÔNG có yếm',
    ketQuaMongDoi: 'VÀNG (có BO-04)',
    ketQuaThat: `${tE_Res.mucDoChung.toUpperCase()} (${tE_Res.luatViPham.map((l) => l.rule.id).join(', ')})`,
    dat: tE_Pass,
    chiTiet: 'Áo tứ thân thiếu yếm đào bắt buộc, cảnh báo BO-04 mức VÀNG.',
  });

  // f. Áo tấc, quần lụa ống rộng, khăn đóng, người mặc Nam: phải ra CHƯA PHÁT HIỆN ĐIỂM LỆCH
  const tF_Look: LookState = {
    thuongY: aoTac,
    haY: quanLua,
    thuPhuc: khanDong,
  };
  const tF_Res = kiemTraVanHoa(tF_Look, undefined, 'nguyen_ban', undefined, 'nam');
  const tF_Pass = tF_Res.mucDoChung === 'xanh' && tF_Res.tieuDe === 'CHƯA PHÁT HIỆN ĐIỂM LỆCH';
  if (!tF_Pass) tatCaDat = false;
  ketQua.push({
    stt: 6,
    toHop: 'f. Áo tấc, quần lụa ống rộng, khăn đóng, người mặc Nam',
    ketQuaMongDoi: 'CHƯA PHÁT HIỆN ĐIỂM LỆCH (XANH)',
    ketQuaThat: `${tF_Res.tieuDe} (${tF_Res.mucDoChung.toUpperCase()})`,
    dat: tF_Pass,
    chiTiet: 'Áo tấc nam giới chỉnh tề cùng quần ống rộng và khăn đóng truyền thống.',
  });

  // g. Áo bà ba, quần lụa ống rộng, khăn đóng: phải có BO-02
  const tG_Look: LookState = {
    thuongY: aoBaBa,
    haY: quanLua,
    thuPhuc: khanDong,
  };
  const tG_Res = kiemTraVanHoa(tG_Look, undefined, 'nguyen_ban');
  const tG_HasBO02 = tG_Res.luatViPham.some((l) => l.rule.id === 'BO-02');
  const tG_Pass = tG_HasBO02;
  if (!tG_Pass) tatCaDat = false;
  ketQua.push({
    stt: 7,
    toHop: 'g. Áo bà ba, quần lụa ống rộng, khăn đóng',
    ketQuaMongDoi: 'CÓ BO-02 (Thủ phục khác bộ)',
    ketQuaThat: `${tG_Res.mucDoChung.toUpperCase()} (${tG_Res.luatViPham.map((l) => l.rule.id).join(', ')})`,
    dat: tG_Pass,
    chiTiet: 'Áo bà ba không đi cùng khăn đóng lễ nghi triều đình, bắn BO-02.',
  });

  for (const item of ketQua) {
    console.assert(
      item.dat,
      `[CULTURE GUARD FAIL] ${item.toHop}: Thực tế ${item.ketQuaThat} != Mong đợi ${item.ketQuaMongDoi}`
    );
  }

  return {
    ketQua,
    tatCaDat,
    tongSoLuat: CULTURE_RULES.length + 4,
  };
}

// Chạy tự kiểm 1 lần khi ở môi trường phát triển
if (typeof window !== 'undefined' && (import.meta as any).env?.DEV) {
  const report = tuKiemCultureGuard();
  if (!report.tatCaDat) {
    console.warn('[CULTURE GUARD] Có kiểm thử bẫy chưa đạt yêu cầu!');
  }
}
