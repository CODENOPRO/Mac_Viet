import { useSyncExternalStore } from 'react';
import {
  ScreenType,
  LookState,
  EventContext,
  LookCardData,
  Garment,
  Motif,
  HarmonyResult,
  CultureFlag,
  Region,
  UserContextSetup,
  StudioStep,
} from '../types';
import { EVENTS } from '../data/events';
import { GARMENTS } from '../data/garments';
import { REGIONS } from '../data/regions';
import { CULTURE_RULES } from '../data/cultureRules';
import { HISTORICAL_PALETTES } from '../data/palettes';

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
  tryOnBackgroundId: string;
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
  if (hash.startsWith('xuong-phoi') || hash.startsWith('studio')) return 'studio';
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

const initialContextSetup: UserContextSetup = {
  eventId: 'E01',
  regionId: 'R01',
  mucTrangTrong: 3,
  nhietDo: 24,
  thoiTietMua: false,
  vaiTro: 'khach_moi',
  phongCach: 'nguyen_ban',
  nganSach: 'thue',
  nguoiMac: 'khong_neu',
};

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
  selectedEvent: EVENTS[0], // E01: Tết và du xuân
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
  tryOnBackgroundId: 'BG2',
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

function syncHashWithLookState(look: LookState) {
  if (typeof window === 'undefined' || state.currentScreen !== 'studio') return;
  try {
    const compact = [
      look.thuongY?.id || 'none',
      look.haY?.id || 'none',
      look.thuPhuc?.id || 'none',
      look.hai?.id || 'none',
      look.hoaVan?.id || 'none',
      (look.mauChinh || '#16243A').replace('#', ''),
    ].join('.');
    const hash = `#xuong-phoi/${compact}`;
    window.history.replaceState(null, '', hash);
  } catch {
    // ignore
  }
}

const listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
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

  setTryOnBackgroundId(bgId: string) {
    state = { ...state, tryOnBackgroundId: bgId };
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
    state = { ...state, selectedEvent: event };
    emitChange();
  },

  setSelectedRegion(region: Region) {
    state = { ...state, selectedRegion: region };
    emitChange();
  },

  setContextSetup(partial: Partial<UserContextSetup>) {
    state = {
      ...state,
      contextSetup: { ...state.contextSetup, ...partial },
      // Bối cảnh đổi thì prompt ảnh đổi, nên ảnh đang có không còn khớp
      isTryOnStale: state.activeTryOnImage ? true : state.isTryOnStale,
    };
    emitChange();
  },

  setThuongY(garment: Garment | null) {
    const nextLook = { ...state.lookState, thuongY: garment };
    state = { ...state, lookState: nextLook };
    pushHistory(nextLook);
    emitChange();
  },

  setHaY(garment: Garment | null) {
    const nextLook = { ...state.lookState, haY: garment };
    state = { ...state, lookState: nextLook };
    pushHistory(nextLook);
    emitChange();
  },

  setThuPhuc(garment: Garment | null) {
    const nextLook = { ...state.lookState, thuPhuc: garment };
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
    if (!rule || !rule.viDu) return;

    let newEvent = state.selectedEvent;
    let newRegion = state.selectedRegion;

    if (rule.id === 'CR-01' || rule.id === 'CR-03' || rule.id === 'CR-04') {
      const cafe = EVENTS.find((e) => e.id === 'E07') || EVENTS.find((e) => e.mucTrangTrongYeuCau <= 3);
      if (cafe) newEvent = cafe;
    } else if (rule.id === 'CR-05' || rule.id === 'CR-07') {
      const damCuoi = EVENTS.find((e) => e.id === 'E03');
      if (damCuoi) newEvent = damCuoi;
    } else if (rule.id === 'CR-06') {
      const tet = EVENTS.find((e) => e.id === 'E01');
      if (tet) newEvent = tet;
    } else if (rule.id === 'CR-08' || rule.id === 'CR-16' || rule.id === 'CR-20') {
      const leChua = EVENTS.find((e) => e.id === 'E04');
      if (leChua) newEvent = leChua;
    } else if (rule.id === 'CR-10') {
      const namBo = REGIONS.find((r) => r.id === 'R03' || r.id === 'nam');
      if (namBo) newRegion = namBo;
    } else if (rule.id === 'CR-14') {
      const giaTien = EVENTS.find((e) => e.id === 'E05');
      if (giaTien) newEvent = giaTien;
    } else if (rule.id === 'CR-19') {
      const tayBac = REGIONS.find((r) => r.id === 'R04' || r.id === 'tay_bac');
      if (tayBac) newRegion = tayBac;
    }

    const nextLook = { ...rule.viDu };
    state = {
      ...state,
      currentScreen: 'studio',
      studioStep: 3,
      selectedEvent: newEvent,
      selectedRegion: newRegion,
      lookState: nextLook,
      isTryOnStale: true,
    };
    pushHistory(nextLook);
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', '#xuong-phoi');
    }
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
  pickRandomValidLook() {
    const safeTops = GARMENTS.filter((g) => g.lop === 'thuong_y' && g.id !== 'G06'); // Tránh Nhật bình E07
    const randomTop = safeTops[Math.floor(Math.random() * safeTops.length)] || null;
    const safeBottoms = GARMENTS.filter((g) => g.lop === 'ha_y');
    const randomBottom = safeBottoms[Math.floor(Math.random() * safeBottoms.length)] || null;
    const safeHeadwear = GARMENTS.filter((g) => g.lop === 'thu_phuc');
    const randomHead = safeHeadwear[Math.floor(Math.random() * safeHeadwear.length)] || null;
    const safeShoes = GARMENTS.filter((g) => g.lop === 'hai');
    const randomShoe = safeShoes[Math.floor(Math.random() * safeShoes.length)] || null;
    
    // Màu an toàn: Chàm, Nâu non, Ngà, The đen
    const safeColors = ['#16243A', '#6E5439', '#F2EDE3', '#2C2A26'];
    const randomColor = safeColors[Math.floor(Math.random() * safeColors.length)];

    const nextLook: LookState = {
      thuongY: randomTop,
      haY: randomBottom,
      thuPhuc: randomHead,
      hai: randomShoe,
      phuKien: [],
      hoaVan: null, // Không gắn M08 Rồng 5 móng
      mauChinh: randomColor,
      phuKienHienDai: false,
      nhietDo: state.contextSetup.nhietDo,
    };

    state = { ...state, lookState: nextLook };
    pushHistory(nextLook);
    emitChange();
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
    const newLookCard: LookCardData = {
      id: `look-${Date.now()}`,
      ten: ten.trim() || 'Bộ Phối Mặc Việt',
      ngayTao: new Date().toISOString().split('T')[0],
      eventContextId: state.selectedEvent.id,
      look: { ...state.lookState },
      ghiChu: ghiChu || state.selectedEvent.ten,
    };
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

  deleteFromLookbook(id: string) {
    const updated = state.lookbook.filter((item) => item.id !== id);
    state = {
      ...state,
      lookbook: updated,
    };
    persistUserLookbook(updated);
    emitChange();
  },

  evaluateHarmony(): HarmonyResult {
    const { lookState, selectedEvent, selectedRegion } = state;
    const canhBao: CultureFlag[] = [];

    // Kiểm tra tất cả 20 luật văn hóa
    for (const rule of CULTURE_RULES) {
      if (rule.kiemTra(lookState, selectedEvent, selectedRegion.id)) {
        let tenBangMauKhop: string | undefined;
        if (rule.id === 'CR-20') {
          // Tìm bảng màu khớp
          const currentColors = new Set<string>();
          if (lookState.mauChinh) currentColors.add(lookState.mauChinh.toUpperCase());
          if (lookState.thuongY?.mauTruyenThong) {
            lookState.thuongY.mauTruyenThong.forEach((c) => currentColors.add(c.toUpperCase()));
          }
          if (lookState.haY?.mauTruyenThong) {
            lookState.haY.mauTruyenThong.forEach((c) => currentColors.add(c.toUpperCase()));
          }
          for (const pal of HISTORICAL_PALETTES) {
            let matchCount = 0;
            for (const c of pal.mauSac) {
              if (currentColors.has(c.toUpperCase())) matchCount++;
            }
            if (matchCount >= 3) {
              tenBangMauKhop = pal.ten;
              break;
            }
          }
        }

        const cachSuaStr = Array.isArray(rule.cachSua) ? rule.cachSua[0]?.moTa || '' : (rule.cachSua as any) || '';
        canhBao.push({
          ruleId: rule.id,
          mucDo: rule.mucDo,
          mucDoChung: rule.mucDo,
          tieuDe: rule.mucDo === 'do' ? 'Cần cân nhắc' : rule.mucDo === 'xanh' ? 'Phối hợp lệ' : 'Hơi lệch bối cảnh',
          thongDiep: rule.id === 'CR-20' && tenBangMauKhop 
            ? `Bảng màu đang trùng với bảng màu lịch sử ${tenBangMauKhop}. Đây là một phối màu có gốc.`
            : rule.thongDiep,
          cachSua: cachSuaStr,
          sourceIds: rule.sourceIds || [],
          tenBangMauKhop,
          luatViPham: [{ rule, mucDoHienThi: rule.mucDo, isDowngraded: false }],
          tongSoLuatBan: 1,
        });
      }
    }

    // Đánh giá mức độ trang trọng
    const topLevel = lookState.thuongY?.mucTrangTrong ?? 1;
    const mucDoTrangTrongPhuHop = Math.abs(topLevel - selectedEvent.mucTrangTrongYeuCau) <= 1;

    // Đánh giá thống nhất vùng miền
    const regions = new Set<string>();
    if (lookState.thuongY) lookState.thuongY.vung.forEach((v) => regions.add(v));
    if (lookState.haY) lookState.haY.vung.forEach((v) => regions.add(v));
    if (lookState.thuPhuc) lookState.thuPhuc.vung.forEach((v) => regions.add(v));
    regions.delete('toan_quoc');
    const vungMienThongNhat = regions.size <= 1;

    // Tính điểm hài hòa (0 - 100)
    let diem = 100;
    for (const flag of canhBao) {
      if (flag.mucDo === 'do') diem -= 25;
      else if (flag.mucDo === 'vang') diem -= 10;
      else if (flag.mucDo === 'xanh') diem += 5; // cộng điểm thưởng bảng màu lịch sử
    }
    if (!mucDoTrangTrongPhuHop) diem -= 15;
    if (!vungMienThongNhat) diem -= 15;
    if (diem < 0) diem = 0;
    if (diem > 100) diem = 100;

    const goiY: string[] = [];
    if (canhBao.filter((c) => c.mucDo !== 'xanh').length === 0 && mucDoTrangTrongPhuHop && vungMienThongNhat) {
      goiY.push('Bộ trang phục đạt chuẩn mực văn hóa, trang nghiêm và hòa hợp với bối cảnh.');
    } else {
      for (const flag of canhBao) {
        if (flag.mucDo !== 'xanh') {
          goiY.push(flag.cachSua);
        }
      }
    }

    return {
      mucDoTrangTrongPhuHop,
      vungMienThongNhat,
      diemHaiHoa: diem,
      canhBao,
      goiY,
    };
  },
};

export function useStore(): AppStoreState {
  return useSyncExternalStore(store.subscribe, store.getState, store.getState);
}

// Lắng nghe nút back / forward của trình duyệt qua popstate & hashchange
if (typeof window !== 'undefined') {
  const syncScreenFromHash = () => {
    const screen = getScreenFromHash();
    if (state.currentScreen !== screen) {
      state = { ...state, currentScreen: screen };
      emitChange();
    }
  };
  window.addEventListener('popstate', syncScreenFromHash);
  window.addEventListener('hashchange', syncScreenFromHash);
}
