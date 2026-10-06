import { useSyncExternalStore } from 'react';
import {
  ScreenType,
  LookState,
  EventContext,
  LookCardData,
  Garment,
  Motif,
  Region,
  UserContextSetup,
  StudioStep,
} from '../types';
import { EVENTS } from '../data/events';
import { chuanHoaBoiCanh, boiCanhHieuLuc } from '../data/boiCanhSuKien';
import { MOTIFS } from '../data/motifs';
import { luuAnhLook, docAnhLook, xoaAnhLook } from './anhLookbook';
import { GARMENTS } from '../data/garments';
import { REGIONS } from '../data/regions';
import { CULTURE_RULES, LUAT_CHO_DU_LIEU } from '../data/cultureRules';
import { BO_TRANG_PHUC } from '../data/boTrangPhuc';
import { kiemTraVanHoa } from './cultureGuard';
import { maHoaLook, giaiMaLook, TIEN_TO_LINK } from './lienKetChiaSe';

export interface AppStoreState {
  currentScreen: ScreenType;
  selectedEvent: EventContext;
  selectedRegion: Region;
  contextSetup: UserContextSetup;
  lookState: LookState;
  lookbook: LookCardData[];
  demoMode: boolean;
  studioStep: StudioStep;
  geminiStatus: 'ready' | 'cached' | 'fallback';
  userPhoto: string | null;
  activeTryOnImage: string | null;
  tryOnHistory: string[];
  tryOnQuality: 'nhanh' | 'ky';
  isTryOnStale: boolean;
  lastTriedLook: LookState | null;
}

const isDemo = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('demo') === '1';

// Dọn sạch khoá localStorage cũ của chế độ lớp học nếu còn lưu
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('macviet_classroom_mode');
  } catch {
    // ignore
  }
}

// Đọc màn hình từ URL hash
const getScreenFromHash = (): ScreenType => {
  if (typeof window === 'undefined') return 'landing';
  const hash = window.location.hash.replace('#', '');
  if (hash.startsWith('xuong-phoi') || hash.startsWith('studio') || hash.startsWith('look=')) return 'studio';
  if (hash.startsWith('lookbook')) return 'lookbook';
  if (hash.startsWith('cu-nghe') || hash.startsWith('cu_nghe')) return 'cu_nghe';
  if (hash.startsWith('luat-van-hoa') || hash.startsWith('culture-rules') || hash.startsWith('culture_rules')) return 'culture_rules';
  return 'landing';
};

const getHashFromScreen = (screen: ScreenType): string => {
  switch (screen) {
    case 'studio': return '#xuong-phoi';
    case 'lookbook': return '#lookbook';
    case 'cu_nghe': return '#cu-nghe';
    case 'culture_rules': return '#luat-van-hoa';
    default: return '';
  }
};

// Giá trị ban đầu mặc định chuẩn xác theo seed data: Áo ngũ thân tay chẽn G04, Quần lụa ống rộng G10, Khăn vấn G12
const initialLookState: LookState = {
  thuongY: GARMENTS.find((g) => g.id === 'G04') || null, // Áo ngũ thân tay chẽn
  haY: GARMENTS.find((g) => g.id === 'G10') || null,     // Quần lụa ống rộng
  thuPhuc: GARMENTS.find((g) => g.id === 'G12') || null, // Khăn vấn
  hai: GARMENTS.find((g) => g.id === 'G15') || null,     // Hài thêu
  phuKien: [],
  hoaVan: null,
  mauChinh: '#16243A', // Chàm
  phuKienHienDai: false,
  nhietDo: 24,
  isEthnicMinoritySingle: false,
  hasEthnicEmbroideryOnVietTop: false,
  isGopChungTayBac: false,
};

const initialContextSetup: UserContextSetup = chuanHoaBoiCanh({
  eventId: 'E01',
  regionId: 'R01',
  mucTrangTrong: 3,
  nhietDo: 24,
  thoiTietMua: false,
  vaiTro: 'di_chuc_tet',
  phongCach: 'nguyen_ban',
  nguoiMac: 'khong_neu',
});

// Quản lý bộ sưu tập cá nhân trong localStorage - TUYỆT ĐỐI KHÔNG GIEO LOOK MẪU
const USER_LOOKBOOK_STORAGE_KEY = 'macviet_user_lookbook';

function loadUserLookbook(): LookCardData[] {
  if (typeof window === 'undefined') return [];
  try {
    // Dọn sạch mọi khoá look mẫu cũ nếu có
    localStorage.removeItem('macviet_lookbook');
    const raw = localStorage.getItem(USER_LOOKBOOK_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Chỉ tải các look do người dùng tạo, loại bỏ mọi id look mẫu
      return parsed.filter(
        (item) => item && typeof item.id === 'string' && !item.id.startsWith('look-demo-') && !item.id.startsWith('look-sample-')
      );
    }
  } catch {
    // Bỏ qua lỗi truy cập storage
  }
  return [];
}

function persistUserLookbook(looks: LookCardData[]) {
  if (typeof window === 'undefined') return;
  try {
    // Chỉ lưu các look của người dùng vào localStorage
    const userOnly = looks.filter(
      (item) => item && typeof item.id === 'string' && !item.id.startsWith('look-demo-') && !item.id.startsWith('look-sample-')
    );
    localStorage.setItem(USER_LOOKBOOK_STORAGE_KEY, JSON.stringify(userOnly));
  } catch {
    // Bỏ qua lỗi quota storage
  }
}

let state: AppStoreState = {
  currentScreen: getScreenFromHash(),
  // Bối cảnh hiệu lực: dịp kèm vai, mức trang trọng tính theo vai
  selectedEvent: boiCanhHieuLuc(initialContextSetup.eventId, initialContextSetup.vaiTro),
  selectedRegion: REGIONS[0], // R01: Bắc Bộ
  contextSetup: initialContextSetup,
  lookState: initialLookState,
  lookbook: loadUserLookbook(),
  demoMode: isDemo,
  studioStep: 1,
  geminiStatus: 'ready',
  userPhoto: isDemo
    ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=768&q=80'
    : null,
  activeTryOnImage: null,
  tryOnHistory: [],
  tryOnQuality: 'nhanh',
  isTryOnStale: false,
  lastTriedLook: null,
};

// Lịch sử 20 bước hoàn tác (Undo / Redo)
let historyStack: LookState[] = [initialLookState];
let historyIndex = 0;

function pushHistory(newLook: LookState) {
  // Cắt phần redo phía sau nếu người dùng thực hiện thao tác mới
  historyStack = historyStack.slice(0, historyIndex + 1);
  historyStack.push(newLook);
  if (historyStack.length > 20) {
    historyStack.shift();
  } else {
    historyIndex++;
  }
  syncHashWithLookState(newLook);
  // Đánh dấu ảnh mặc thử cũ so với lựa chọn mới
  if (state.activeTryOnImage) {
    state.isTryOnStale = true;
  }
}

// Thanh địa chỉ luôn mang link chia sẻ của bộ đang phối, cùng dạng với nút Chia sẻ (#look=...),
// nên chép thẳng địa chỉ trang cũng mở ra đúng bộ đồ và đúng bối cảnh.
function syncHashWithLookState(look: LookState) {
  if (typeof window === 'undefined' || state.currentScreen !== 'studio') return;
  try {
    window.history.replaceState(null, '', `#${TIEN_TO_LINK}${encodeURIComponent(maHoaLook(look, state.contextSetup))}`);
  } catch {
    // ignore
  }
}

/** Mở bộ đồ từ link chia sẻ: đặt món, màu và bối cảnh, vào thẳng bước phối đồ. */
function apDungLienKet(hash: string): boolean {
  const ketQua = giaiMaLook(hash);
  if (!ketQua) return false;
  const ctxHopLe = Object.fromEntries(
    Object.entries(ketQua.ctx).filter(([, v]) => v !== undefined && v !== null && v !== '')
  ) as Partial<UserContextSetup>;
  state = {
    ...state,
    ...voiBoiCanh(ctxHopLe),
    lookState: ketQua.look,
    currentScreen: 'studio',
    studioStep: 3,
    activeTryOnImage: null,
    lastTriedLook: null,
    isTryOnStale: false,
  };
  historyStack = [ketQua.look];
  historyIndex = 0;
  return true;
}

const listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

/**
 * Một nguồn sự thật cho bối cảnh: contextSetup.
 * selectedEvent (bối cảnh hiệu lực) và selectedRegion luôn suy ra từ nó, không đặt riêng,
 * để màn chọn bối cảnh, luật văn hoá, gợi ý và ảnh mặc thử không bao giờ lệch nhau.
 */
function voiBoiCanh(partial: Partial<UserContextSetup>) {
  const contextSetup = chuanHoaBoiCanh({ ...state.contextSetup, ...partial });
  return {
    contextSetup,
    selectedEvent: boiCanhHieuLuc(contextSetup.eventId, contextSetup.vaiTro),
    selectedRegion: REGIONS.find((r) => r.id === contextSetup.regionId) || state.selectedRegion,
  };
}

export const store = {
  getState(): AppStoreState {
    return state;
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  setScreen(screen: ScreenType) {
    state = { ...state, currentScreen: screen };
    if (typeof window !== 'undefined') {
      const hash = getHashFromScreen(screen);
      if (window.location.hash !== hash) {
        window.history.pushState(null, '', hash || window.location.pathname);
      }
    }
    syncHashWithLookState(state.lookState);
    emitChange();
  },

  setStudioStep(step: StudioStep) {
    state = { ...state, studioStep: step };
    emitChange();
  },

  setUserPhoto(photo: string | null) {
    state = { ...state, userPhoto: photo, activeTryOnImage: null, isTryOnStale: false };
    emitChange();
  },

  setActiveTryOnImage(img: string | null) {
    state = { ...state, activeTryOnImage: img, isTryOnStale: false };
    emitChange();
  },

  addToTryOnHistory(img: string) {
    const nextHistory = [img, ...state.tryOnHistory.filter((i) => i !== img)].slice(0, 6);
    state = { ...state, tryOnHistory: nextHistory };
    emitChange();
  },

  setTryOnQuality(quality: 'nhanh' | 'ky') {
    state = { ...state, tryOnQuality: quality };
    emitChange();
  },

  setIsTryOnStale(isStale: boolean) {
    state = { ...state, isTryOnStale: isStale };
    emitChange();
  },

  setLastTriedLook(look: LookState | null) {
    state = { ...state, lastTriedLook: look ? { ...look } : null };
    emitChange();
  },

  setGeminiStatus(status: 'ready' | 'cached' | 'fallback') {
    state = { ...state, geminiStatus: status };
    emitChange();
  },

  setSelectedEvent(event: EventContext) {
    state = { ...state, ...voiBoiCanh({ eventId: event.id }) };
    emitChange();
  },

  setSelectedRegion(region: Region) {
    state = { ...state, ...voiBoiCanh({ regionId: region.id }) };
    emitChange();
  },

  setContextSetup(partial: Partial<UserContextSetup>) {
    state = {
      ...state,
      // Dịp là gốc: vai trò, mức trang trọng, phong cách luôn được đưa về tổ hợp hợp với dịp
      ...voiBoiCanh(partial),
      // Nhiệt độ của look (luật CR-15 đọc) luôn theo nhiệt độ đang nhập ở bước bối cảnh
      lookState: partial.nhietDo !== undefined ? { ...state.lookState, nhietDo: partial.nhietDo } : state.lookState,
      // Bối cảnh đổi thì prompt ảnh đổi, nên ảnh đang có không còn khớp
      isTryOnStale: state.activeTryOnImage ? true : state.isTryOnStale,
    };
    syncHashWithLookState(state.lookState);
    emitChange();
  },

  setThuongY(garment: Garment | null) {
    const nextLook = { ...state.lookState, thuongY: garment };
    state = { ...state, lookState: nextLook };
    pushHistory(nextLook);
    emitChange();
  },

  setHaY(garment: Garment | null) {
    // Màu quần đang chọn không có trong màu truyền thống của món mới thì về màu mặc định của món
    const giuMau = garment && state.lookState.mauHaY && garment.mauTruyenThong.includes(state.lookState.mauHaY);
    const nextLook = { ...state.lookState, haY: garment, mauHaY: giuMau ? state.lookState.mauHaY : undefined };
    state = { ...state, lookState: nextLook };
    pushHistory(nextLook);
    emitChange();
  },

  setThuPhuc(garment: Garment | null) {
    const giuMau =
      garment && state.lookState.mauThuPhuc && garment.mauTruyenThong.includes(state.lookState.mauThuPhuc);
    const nextLook = { ...state.lookState, thuPhuc: garment, mauThuPhuc: giuMau ? state.lookState.mauThuPhuc : undefined };
    state = { ...state, lookState: nextLook };
    pushHistory(nextLook);
    emitChange();
  },

  setHai(garment: Garment | null) {
    const nextLook = { ...state.lookState, hai: garment };
    state = { ...state, lookState: nextLook };
    pushHistory(nextLook);
    emitChange();
  },

  setHoaVan(motif: Motif | null) {
    const nextLook = { ...state.lookState, hoaVan: motif };
    state = { ...state, lookState: nextLook };
    pushHistory(nextLook);
    emitChange();
  },

  setMauChinh(hex: string) {
    const nextLook = { ...state.lookState, mauChinh: hex };
    state = { ...state, lookState: nextLook };
    pushHistory(nextLook);
    emitChange();
  },

  /** Màu quần, màu khăn: chỉ nhận màu nằm trong màu truyền thống của món đang chọn */
  setMauHaY(hex: string) {
    if (!state.lookState.haY?.mauTruyenThong.includes(hex)) return;
    const nextLook = { ...state.lookState, mauHaY: hex };
    state = { ...state, lookState: nextLook };
    pushHistory(nextLook);
    emitChange();
  },

  setMauThuPhuc(hex: string) {
    if (!state.lookState.thuPhuc?.mauTruyenThong.includes(hex)) return;
    const nextLook = { ...state.lookState, mauThuPhuc: hex };
    state = { ...state, lookState: nextLook };
    pushHistory(nextLook);
    emitChange();
  },

  /**
   * Áp một bảng màu di sản cho cả bộ: màu đầu cho áo; quần và khăn nhận màu của bảng nếu màu đó
   * có trong màu truyền thống của món, không thì giữ nguyên. Trả về số lớp đã đổi màu.
   */
  apBangMau(mauSac: string[]): number {
    const look = state.lookState;
    const cungMau = (a: string, b: string) => a.toUpperCase() === b.toUpperCase();
    const timTrongMon = (mon: Garment | null | undefined) =>
      mon ? mauSac.slice(1).find((m) => mon.mauTruyenThong.some((x) => cungMau(x, m))) : undefined;
    const mauQuan = timTrongMon(look.haY);
    const mauKhan = timTrongMon(look.thuPhuc);
    const nextLook: LookState = {
      ...look,
      mauChinh: mauSac[0] || look.mauChinh,
      mauHaY: mauQuan ? look.haY!.mauTruyenThong.find((x) => cungMau(x, mauQuan)) : look.mauHaY,
      mauThuPhuc: mauKhan ? look.thuPhuc!.mauTruyenThong.find((x) => cungMau(x, mauKhan)) : look.mauThuPhuc,
    };
    state = { ...state, lookState: nextLook };
    pushHistory(nextLook);
    emitChange();
    return 1 + (mauQuan ? 1 : 0) + (mauKhan ? 1 : 0);
  },

  setPhuKienHienDai(val: boolean) {
    const nextLook = { ...state.lookState, phuKienHienDai: val };
    state = { ...state, lookState: nextLook };
    pushHistory(nextLook);
    emitChange();
  },

  setLookState(look: LookState) {
    state = { ...state, lookState: look };
    pushHistory(look);
    syncHashWithLookState(look);
    emitChange();
  },

  applyRuleExample(ruleId: string) {
    const rule = CULTURE_RULES.find((r) => r.id === ruleId);
    if (!rule || !rule.viDu || LUAT_CHO_DU_LIEU.includes(rule.id)) return;

    // Mỗi ví dụ dựng trong một bối cảnh cố định, không kế thừa dịp hay vùng của ví dụ xem trước đó,
    // để luật đang xem luôn bật và không lẫn luật khác do bối cảnh cũ còn sót.
    // Vai lấy vai mặc định của dịp; phong cách về Nguyên bản để luật chạy đủ mức.
    const BOI_CANH_VI_DU: Record<string, { eventId: string; regionId?: string }> = {
      'CR-05': { eventId: 'E03' },
      'CR-06': { eventId: 'E01' },
      'CR-07': { eventId: 'E03' },
      'CR-08': { eventId: 'E04' },
      'CR-09': { eventId: 'E07', regionId: 'R03' },
      'CR-10': { eventId: 'E07', regionId: 'R03' },
      'CR-13': { eventId: 'E01' }, // luật áp ngoài dạo phố và biểu diễn
      'CR-14': { eventId: 'E05' },
      'CR-15': { eventId: 'E03' },
      'CR-16': { eventId: 'E05' }, // người chủ lễ
      'CR-20': { eventId: 'E04' },
    };
    const bc = BOI_CANH_VI_DU[rule.id] || { eventId: 'E07' };

    const nhietDo = rule.viDu.nhietDo ?? 24;
    const nextLook = { ...rule.viDu, nhietDo };
    state = {
      ...state,
      currentScreen: 'studio',
      studioStep: 3,
      // Đổi qua voiBoiCanh để màn bối cảnh, luật và ảnh cùng thấy đúng dịp, vùng của ví dụ
      ...voiBoiCanh({
        eventId: bc.eventId,
        regionId: bc.regionId || 'R01',
        vaiTro: undefined,
        phongCach: 'nguyen_ban',
        nhietDo,
      }),
      lookState: nextLook,
      isTryOnStale: true,
    };
    pushHistory(nextLook);
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', '#xuong-phoi');
    }
    syncHashWithLookState(nextLook);
    emitChange();
  },

  undo() {
    if (historyIndex > 0) {
      historyIndex--;
      const prevLook = historyStack[historyIndex];
      state = { ...state, lookState: prevLook };
      syncHashWithLookState(prevLook);
      emitChange();
    }
  },

  redo() {
    if (historyIndex < historyStack.length - 1) {
      historyIndex++;
      const nextLook = historyStack[historyIndex];
      state = { ...state, lookState: nextLook };
      syncHashWithLookState(nextLook);
      emitChange();
    }
  },

  canUndo(): boolean {
    return historyIndex > 0;
  },

  canRedo(): boolean {
    return historyIndex < historyStack.length - 1;
  },

  // Ngẫu nhiên hợp lệ: Bốc ngẫu nhiên nhưng chỉ trong số các món không vi phạm luật mức đỏ
  /**
   * Phối ngẫu nhiên nhưng đúng văn hoá: chỉ bốc trong các bộ trang phục có sẵn trong dữ liệu,
   * lọc theo giới đã khai, chọn màu trong màu truyền thống của từng món, rồi chạy Culture Guard
   * với đúng bối cảnh đang chọn. Chỉ nhận bộ không có cờ đỏ, ưu tiên bộ xanh.
   * Trả false nếu không tìm được bộ nào hợp, khi đó giữ nguyên bộ đang phối.
   */
  pickRandomValidLook(): boolean {
    const ctx = state.contextSetup;
    const dip = state.selectedEvent;
    const hopGioi = (gioi: string) => ctx.nguoiMac === 'khong_neu' || gioi === 'ca_hai' || gioi === ctx.nguoiMac;
    const bocMot = <T,>(ds: T[]): T | undefined => ds[Math.floor(Math.random() * ds.length)];
    const timMon = (id?: string) => (id ? GARMENTS.find((g) => g.id === id) || null : null);

    const cacBo = BO_TRANG_PHUC.filter((bo) => hopGioi(bo.gioiTinh));
    let boVang: LookState | null = null;
    for (let lan = 0; lan < 60; lan++) {
      const bo = bocMot(cacBo);
      if (!bo) break;
      const ao = timMon(bocMot(bo.cacMonTheoLop.thuongY.filter((id) => hopGioi(timMon(id)?.gioiTinh || 'ca_hai'))));
      if (!ao) continue;
      // Áo lệch quá xa mức trang trọng dịp yêu cầu thì bỏ, khỏi phải chờ luật báo
      if (Math.abs(ao.mucTrangTrong - dip.mucTrangTrongYeuCau) > 1) continue;
      const quan = timMon(bocMot(bo.cacMonTheoLop.haY));
      const khan = timMon(bocMot(bo.cacMonTheoLop.thuPhuc.filter((id) => hopGioi(timMon(id)?.gioiTinh || 'ca_hai'))));
      const hai = timMon(bocMot(bo.cacMonTheoLop.hai));
      const look: LookState = {
        thuongY: ao,
        haY: quan,
        thuPhuc: khan,
        hai,
        phuKien: (bo.cacMonTheoLop.phuKienBatBuoc || []).map((id) => timMon(id)).filter((g): g is Garment => Boolean(g)),
        hoaVan: null,
        mauChinh: bocMot(ao.mauTruyenThong) || '#16243A',
        mauHaY: quan ? bocMot(quan.mauTruyenThong) : undefined,
        mauThuPhuc: khan ? bocMot(khan.mauTruyenThong) : undefined,
        phuKienHienDai: false,
        nhietDo: ctx.nhietDo,
        isEthnicMinoritySingle: false,
        hasEthnicEmbroideryOnVietTop: false,
        isGopChungTayBac: false,
      };
      const ketQua = kiemTraVanHoa(look, dip, ctx.phongCach, ctx.regionId, ctx.nguoiMac).mucDoChung;
      if (ketQua === 'xanh') {
        boVang = look;
        break;
      }
      if (ketQua === 'vang' && !boVang) boVang = look;
    }
    if (!boVang) return false;

    state = { ...state, lookState: boVang };
    pushHistory(boVang);
    emitChange();
    return true;
  },

  setNhietDo(temp: number) {
    state = {
      ...state,
      lookState: { ...state.lookState, nhietDo: temp },
    };
    emitChange();
  },

  applyAutoFix(ruleId: string) {
    const rule = CULTURE_RULES.find((r) => r.id === ruleId);
    if (rule?.apDung) {
      state = {
        ...state,
        lookState: rule.apDung(state.lookState),
      };
      emitChange();
    }
  },

  resetLook() {
    state = {
      ...state,
      lookState: initialLookState,
    };
    emitChange();
  },

  saveToLookbook(ten: string, ghiChu?: string) {
    // Ảnh mặc thử chỉ lưu kèm khi còn khớp với bộ đồ (chưa đổi món sau lần mặc thử)
    const anh = state.activeTryOnImage && !state.isTryOnStale ? state.activeTryOnImage : null;
    const newLookCard: LookCardData = {
      id: `look-${Date.now()}`,
      ten: ten.trim() || 'Bộ Phối Mặc Việt',
      ngayTao: new Date().toISOString().split('T')[0],
      eventContextId: state.selectedEvent.id,
      vaiTro: state.contextSetup.vaiTro,
      boiCanh: { ...state.contextSetup },
      look: { ...state.lookState },
      ghiChu: ghiChu || state.selectedEvent.ten,
      coAnh: Boolean(anh),
    };
    if (anh) void luuAnhLook(newLookCard.id, anh);
    const updated = [newLookCard, ...state.lookbook];
    state = {
      ...state,
      lookbook: updated,
    };
    persistUserLookbook(updated);
    emitChange();
  },

  copySampleToLookbook(sampleLook: LookCardData) {
    const newCopy: LookCardData = {
      id: `look-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ten: `${sampleLook.ten} (Bản sao)`,
      ngayTao: new Date().toISOString().split('T')[0],
      eventContextId: sampleLook.eventContextId,
      look: { ...sampleLook.look },
      ghiChu: sampleLook.ghiChu,
    };
    const updated = [newCopy, ...state.lookbook];
    state = {
      ...state,
      lookbook: updated,
    };
    persistUserLookbook(updated);
    emitChange();
  },

  /**
   * Mở lại một bộ đã lưu: khôi phục đủ sáu lớp, màu, dịp, và gắn lại ảnh mặc thử cũ nếu có,
   * để app không gọi Gemini dựng ảnh mới. Món đồ được đọc lại theo id từ dữ liệu hiện tại.
   */
  moLaiLook(item: LookCardData) {
    const timAo = (g?: Garment | null) => (g ? GARMENTS.find((x) => x.id === g.id) || g : null);
    const look: LookState = {
      ...item.look,
      nhietDo: item.boiCanh?.nhietDo ?? state.contextSetup.nhietDo,
      thuongY: timAo(item.look.thuongY),
      haY: timAo(item.look.haY),
      thuPhuc: timAo(item.look.thuPhuc),
      hai: timAo(item.look.hai),
      phuKien: (item.look.phuKien || []).map((g) => timAo(g)).filter((g): g is Garment => Boolean(g)),
      hoaVan: item.look.hoaVan ? MOTIFS.find((m) => m.id === item.look.hoaVan?.id) || item.look.hoaVan : null,
    };
    const dip = EVENTS.find((e) => e.id === item.eventContextId) || state.selectedEvent;
    state = {
      ...state,
      lookState: look,
      // Mở lại đúng dịp và vai lúc lưu; bản lưu cũ chưa có vai thì về vai mặc định của dịp
      // Mở lại đúng bối cảnh lúc lưu (dịp, vai, vùng, phong cách, giới, thời tiết). Bản lưu cũ chỉ có dịp
      // thì giữ phần còn lại như đang chọn, vai về mặc định của dịp.
      ...voiBoiCanh(
        item.boiCanh
          ? { ...item.boiCanh }
          : { eventId: dip.id, vaiTro: item.vaiTro ?? (dip.id === state.contextSetup.eventId ? state.contextSetup.vaiTro : undefined) }
      ),
      activeTryOnImage: null,
      lastTriedLook: null,
      isTryOnStale: false,
      studioStep: 3,
    };
    pushHistory(look);
    store.setScreen('studio');

    if (item.coAnh) {
      void docAnhLook(item.id).then((anh) => {
        // Chỉ gắn ảnh nếu người dùng chưa đổi sang bộ khác trong lúc chờ đọc
        if (!anh || state.lookState !== look) return;
        state = {
          ...state,
          activeTryOnImage: anh,
          lastTriedLook: { ...look },
          isTryOnStale: false,
          tryOnHistory: [anh, ...state.tryOnHistory.filter((i) => i !== anh)].slice(0, 6),
        };
        emitChange();
      });
    }
  },

  deleteFromLookbook(id: string) {
    void xoaAnhLook(id);
    const updated = state.lookbook.filter((item) => item.id !== id);
    state = {
      ...state,
      lookbook: updated,
    };
    persistUserLookbook(updated);
    emitChange();
  },

};

export function useStore(): AppStoreState {
  return useSyncExternalStore(store.subscribe, store.getState, store.getState);
}

// Lắng nghe nút back / forward của trình duyệt qua popstate & hashchange
if (typeof window !== 'undefined') {
  // Mở trang bằng link chia sẻ: dựng lại bộ đồ và bối cảnh trước khi app vẽ lần đầu
  if (window.location.hash.startsWith('#' + TIEN_TO_LINK)) apDungLienKet(window.location.hash);

  const syncScreenFromHash = () => {
    // Dán link chia sẻ khác vào cùng tab: mở bộ đồ đó
    const hienTai = '#' + TIEN_TO_LINK + encodeURIComponent(maHoaLook(state.lookState, state.contextSetup));
    if (window.location.hash.startsWith('#' + TIEN_TO_LINK) && window.location.hash !== hienTai) {
      if (apDungLienKet(window.location.hash)) {
        emitChange();
        return;
      }
    }
    const screen = getScreenFromHash();
    if (state.currentScreen !== screen) {
      state = { ...state, currentScreen: screen };
      emitChange();
    }
  };
  window.addEventListener('popstate', syncScreenFromHash);
  window.addEventListener('hashchange', syncScreenFromHash);
}
