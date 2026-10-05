import { taoAi, aiSanSang } from './aiClient';
import { LookState, EventContext, Background } from '../types';
import { GARMENTS } from '../data/garments';
import { TRADITIONAL_COLORS } from '../data/palettes';
import { recordTryOnUsage } from './tryOnGuard';
import { store } from './store';
import { dungBoiCanhAnh, BoiCanhAnh } from './promptDong';

// =============================================================================
// 1. CẤU HÌNH API KEY VÀ KHỞI TẠO SDK @google/genai
// =============================================================================
// Khoá không còn được đọc ở đây. Xem lib/aiClient.ts: gọi thẳng khi có khoá lúc build (AI Studio, máy dev),
// gọi qua hàm trung gian api/gemini.ts khi chạy trên Vercel.
const ai = taoAi();

// =============================================================================
// 2. HỆ THỐNG ĐO ĐẠC TELEMETRY CHO BỘ THỬ TRANG PHỤC (CTRL+SHIFT+D)
// =============================================================================
export interface TryOnStats {
  soLuotGoiAnh: number;
  soLanThanhCong: number;
  soLanTrungCache: number;
  soLanLoi: number;
  soLanDuPhong: number;
  tongThoiGianChoMs: number;
  thoiGianChoTrungBinhMs: number;
  soLanTheoChatLuong: {
    nhanh: number;
    ky: number;
  };
  soLanTheoTangDuPhong: {
    tang1: number;
    tang2: number;
    tang3: number;
  };
}

const STATS_STORAGE_KEY = 'macviet_tryon_stats_v1';

function docStatsTuStorage(): TryOnStats {
  const khoiTao: TryOnStats = {
    soLuotGoiAnh: 0,
    soLanThanhCong: 0,
    soLanTrungCache: 0,
    soLanLoi: 0,
    soLanDuPhong: 0,
    tongThoiGianChoMs: 0,
    thoiGianChoTrungBinhMs: 0,
    soLanTheoChatLuong: {
      nhanh: 0,
      ky: 0,
    },
    soLanTheoTangDuPhong: {
      tang1: 0,
      tang2: 0,
      tang3: 0,
    },
  };

  if (typeof window === 'undefined') return khoiTao;
  try {
    const raw = localStorage.getItem(STATS_STORAGE_KEY);
    if (!raw) return khoiTao;
    return JSON.parse(raw);
  } catch {
    return khoiTao;
  }
}

export const tryOnStats: TryOnStats = docStatsTuStorage();

function luuStats(): void {
  if (typeof window === 'undefined') return;
  try {
    if (tryOnStats.soLuotGoiAnh > 0) {
      tryOnStats.thoiGianChoTrungBinhMs = Math.round(
        tryOnStats.tongThoiGianChoMs / tryOnStats.soLuotGoiAnh
      );
    }
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(tryOnStats));
  } catch {
    // bo qua loi quota localStorage
  }
}

// =============================================================================
// 3. QUẢN LÝ BỘ NHỚ ĐỆM INDEXEDDB (GIỚI HẠN 20 ẢNH GẦN NHẤT)
// =============================================================================
const DB_NAME = 'MacVietTryOnCacheDB';
const STORE_NAME = 'tryOnCache';
const DB_VERSION = 1;
const MAX_CACHE_ITEMS = 20;

export interface TryOnCacheRecord {
  key: string;
  anh: string;
  soLuot: number;
  timestamp: number;
}

function moIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB khong duoc ho tro tren trinh duyet nay'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e: any) => {
      const db = e.target.result as IDBDatabase;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function docCacheTryOn(key: string): Promise<TryOnCacheRecord | null> {
  try {
    const db = await moIndexedDB();
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);
      request.onsuccess = () => {
        const result = request.result as TryOnCacheRecord | undefined;
        resolve(result || null);
      };
      request.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function ghiCacheTryOn(
  key: string,
  anh: string,
  soLuot: number
): Promise<void> {
  try {
    const db = await moIndexedDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    // Luu ban ghi moi nhat
    store.put({
      key,
      anh,
      soLuot,
      timestamp: Date.now(),
    });

    // Gioi han toi da 20 anh gan nhat, xoa cu nhat neu vuot qua
    const countRequest = store.count();
    countRequest.onsuccess = () => {
      const tongSo = countRequest.result;
      if (tongSo > MAX_CACHE_ITEMS) {
        const index = store.index('timestamp');
        const cursorRequest = index.openCursor(null, 'next'); // sap xep tang dan thoi gian: cu nhat len dau
        let soLuongCanXoa = tongSo - MAX_CACHE_ITEMS;

        cursorRequest.onsuccess = (e: any) => {
          const cursor = e.target.result as IDBCursorWithValue | null;
          if (cursor && soLuongCanXoa > 0) {
            cursor.delete();
            soLuongCanXoa--;
            cursor.continue();
          }
        };
      }
    };
  } catch {
    // Khong chan luong neu ghi cache indexedDB gap su co
  }
}

export async function demSoLuongCacheTryOn(): Promise<number> {
  try {
    const db = await moIndexedDB();
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const countReq = store.count();
      countReq.onsuccess = () => resolve(countReq.result);
      countReq.onerror = () => resolve(0);
    });
  } catch {
    return 0;
  }
}

export async function xoaToanBoCacheTryOn(): Promise<void> {
  try {
    const db = await moIndexedDB();
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  } catch {
    // bo qua
  }
}

// =============================================================================
// 4. TIỆN ÍCH XỬ LÝ ẢNH, DẤU AI VÀ CHUYỂN ĐỔI SVG THÀNH RASTER BASE64
// =============================================================================

function boDauTiengViet(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .trim();
}

function taoHashKhoa(chuoi: string): string {
  let hash = 0;
  for (let i = 0; i < chuoi.length; i++) {
    const char = chuoi.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return 'tryon_' + Math.abs(hash).toString(36);
}

/**
 * Chuyen bat ky dinh dang dataURL (bao gom SVG) sang Raster PNG base64
 * phu hop voi Gemini Multimodal API.
 */
export async function chuyenDataUrlSangRasterPart(
  dataUrl: string
): Promise<{ data: string; mimeType: string }> {
  // Neu da la jpeg, png, webp
  const match = dataUrl.match(/^data:(image\/(jpeg|png|webp));base64,(.+)$/);
  if (match) {
    return {
      mimeType: match[1],
      data: match[3],
    };
  }

  // Neu la SVG dataURL hoac dinh dang khac: ve len Canvas de thanh raster PNG
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error('Khong co moi truong DOM canvas'));
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const goc = { w: img.width || 480, h: img.height || 600 };
      const tiLe = Math.min(1, 1024 / Math.max(goc.w, goc.h));
      canvas.width = Math.round(goc.w * tiLe);
      canvas.height = Math.round(goc.h * tiLe);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Khong khoi tao duoc context 2D'));
      }
      ctx.fillStyle = '#F2EDE3';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const pngUrl = canvas.toDataURL('image/png');
      const pngData = pngUrl.replace(/^data:image\/png;base64,/, '');
      resolve({
        mimeType: 'image/png',
        data: pngData,
      });
    };
    img.onerror = () => {
      // Du phong base64 gia lap neu khong the load
      resolve({
        mimeType: 'image/png',
        data: dataUrl.split(',')[1] || '',
      });
    };
    img.src = dataUrl;
  });
}

/**
 * Đóng dấu "ẢNH DO AI TẠO" vĩnh viễn vào canvas ảnh
 */
export async function dongDauAnhAI(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(dataUrl);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(dataUrl);

      // Ve anh goc
      ctx.drawImage(img, 0, 0);

      // Tinh kich thuoc dai nhan theo ti le khung hinh
      const fontSize = Math.max(12, Math.round(canvas.width * 0.024));
      const padX = Math.round(fontSize * 0.8);
      const padY = Math.round(fontSize * 0.4);
      const text = 'ẢNH DO AI TẠO';

      ctx.font = `${fontSize}px "JetBrains Mono", monospace`;
      const textWidth = ctx.measureText(text).width;

      const badgeW = textWidth + padX * 2;
      const badgeH = fontSize + padY * 2;
      const posX = canvas.width - badgeW - Math.round(canvas.width * 0.04);
      const posY = canvas.height - badgeH - Math.round(canvas.height * 0.04);

      // Dai mo nen toi #0D1826 ban trong suot
      ctx.fillStyle = 'rgba(13, 24, 38, 0.90)';
      ctx.fillRect(posX, posY, badgeW, badgeH);

      // Vien manh kim loai #C39A27
      ctx.strokeStyle = '#C39A27';
      ctx.lineWidth = Math.max(1, Math.round(fontSize * 0.08));
      ctx.strokeRect(posX, posY, badgeW, badgeH);

      // Chu mau nga #F2EDE3
      ctx.fillStyle = '#F2EDE3';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, posX + padX, posY + badgeH / 2);

      resolve(canvas.toDataURL('image/jpeg', 0.92));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}


// =============================================================================
// 5. TRẠNG THÁI THEO DÕI LOOK LẦN TRƯỚC (CHO CHẾ ĐỘ ĐỔI NHANH MỘT MÓN)
// =============================================================================
let lastLookExecuted: LookState | null = null;

interface ChangedLayerInfo {
  layerKey: 'thuongY' | 'haY' | 'thuPhuc' | 'hai' | 'phuKien' | 'hoaVan' | 'mauChinh';
  layerName: string;
  itemDescription: string;
}

function phatHienDoiDungMotMon(
  hienTai: LookState,
  truocDo: LookState | null
): ChangedLayerInfo | null {
  if (!truocDo) return null;

  const differences: ChangedLayerInfo[] = [];

  if (hienTai.thuongY?.id !== truocDo.thuongY?.id) {
    differences.push({
      layerKey: 'thuongY',
      layerName: 'main robe (thượng y)',
      itemDescription: `${hienTai.thuongY?.ten || 'áo truyền thống'} (${boDauTiengViet(hienTai.thuongY?.ten || '')}), color ${hienTai.mauChinh || '#16243A'}, fabric ${(hienTai.thuongY?.chatLieuPhoBien || []).join(', ')}`,
    });
  }

  if (hienTai.haY?.id !== truocDo.haY?.id) {
    differences.push({
      layerKey: 'haY',
      layerName: 'lower garment (hạ y)',
      itemDescription: `${hienTai.haY?.ten || 'quần lụa ống rộng'}, color ${hienTai.haY?.mauTruyenThong?.[0] || '#F2EDE3'}`,
    });
  }

  if (hienTai.thuPhuc?.id !== truocDo.thuPhuc?.id) {
    differences.push({
      layerKey: 'thuPhuc',
      layerName: 'headwear (thủ phục)',
      itemDescription: `${hienTai.thuPhuc?.ten || 'khăn vấn/khăn đóng'}, color ${hienTai.thuPhuc?.mauTruyenThong?.[0] || '#2C2A26'}`,
    });
  }

  if (hienTai.hai?.id !== truocDo.hai?.id) {
    differences.push({
      layerKey: 'hai',
      layerName: 'footwear (hài)',
      itemDescription: `${hienTai.hai?.ten || 'hài thêu cổ truyền'}`,
    });
  }

  if (hienTai.mauChinh !== truocDo.mauChinh && hienTai.thuongY?.id === truocDo.thuongY?.id) {
    differences.push({
      layerKey: 'mauChinh',
      layerName: 'fabric color of the main robe',
      itemDescription: `color ${hienTai.mauChinh}`,
    });
  }

  if (hienTai.hoaVan?.id !== truocDo.hoaVan?.id) {
    differences.push({
      layerKey: 'hoaVan',
      layerName: 'embroidery motif',
      itemDescription: `motif ${hienTai.hoaVan?.ten || 'none'}`,
    });
  }

  if (differences.length === 1) {
    return differences[0];
  }

  return null;
}

// =============================================================================
// 6. XÂY DỰNG PROMPT THEO MẪU QUY CHUẨN CỦA ĐỀ BÀI
// =============================================================================

interface PromptBuilderResult {
  promptText: string;
  imageParts: Array<{ inlineData: { data: string; mimeType: string } }>;
  hasHeadwearImage: boolean;
  hasLowerImage: boolean;
}

async function xayDungPromptVaAnh(
  opts: {
    anhNguoi: string;
    look: LookState;
    boiCanh: EventContext;
    background: Background;
    overrideBackgroundDescription?: string;
    boiCanhAnh?: BoiCanhAnh;
  }
): Promise<PromptBuilderResult> {
  const { anhNguoi, look, background, overrideBackgroundDescription, boiCanhAnh } = opts;

  // Tim mau tieng Viet
  const mainColorObj = TRADITIONAL_COLORS.find(
    (c) => c.hex.toLowerCase() === (look.mauChinh || '#16243A').toLowerCase()
  );
  const tenMauTiengViet = mainColorObj?.ten || 'Chàm';
  const hexMau = look.mauChinh || '#16243A';

  // Thong tin thuong y
  const thuongYTen = look.thuongY?.ten || 'Áo ngũ thân tay chẽn';
  const thuongYChatLieu =
    look.thuongY?.chatLieuPhoBien?.join(', ') || 'lụa tơ tằm, the dệt truyền thống';

  // Thong tin ha y
  const haYTen = look.haY?.ten || 'Quần lụa ống rộng';
  const haYMau = look.haY?.mauTruyenThong?.[0] || '#F2EDE3 (trắng ngà)';
  const haYChatLieu = look.haY?.chatLieuPhoBien?.join(', ') || 'lụa mềm';

  // Thong tin thu phuc
  const thuPhucTen = look.thuPhuc?.ten || 'Khăn vấn';
  const thuPhucMau = look.thuPhuc?.mauTruyenThong?.[0] || '#2C2A26 (đen)';

  // Boi canh
  const moTaBackground =
    overrideBackgroundDescription !== undefined
      ? overrideBackgroundDescription
      : background.moTaChoAI;

  // Chuan bi cac anh tham chieu toi da 4 anh:
  // Anh 1: nguoi dung
  // Anh 2: thuong y
  // Anh 3: thu phuc (neu co)
  // Anh 4: ha y (neu co va con cho)
  const imageParts: Array<{ inlineData: { data: string; mimeType: string } }> = [];

  // Anh 1: Nguoi dung
  const personRaster = await chuyenDataUrlSangRasterPart(anhNguoi);
  imageParts.push({ inlineData: personRaster });

  // Chỉ gửi ảnh chụp hiện vật thật làm tham chiếu. Hình vẽ minh hoạ khiến model chép theo nét vẽ.
  const thamChieu = (id?: string) => GARMENTS.find((g) => g.id === id)?.anhThamChieuThat;
  const moTa = (id?: string) => GARMENTS.find((g) => g.id === id)?.moTaHinhAnh;
  const ghiChuAnh: string[] = ['Image 1 is the person.'];

  let hasHeadwearImage = false;
  let hasLowerImage = false;
  const themThamChieu = async (src: string | undefined, vaiTro: string) => {
    if (!src || imageParts.length >= 4) return false;
    imageParts.push({ inlineData: await chuyenDataUrlSangRasterPart(src) });
    ghiChuAnh.push(`Image ${imageParts.length} is a museum photo of the real ${vaiTro}; follow its construction exactly.`);
    return true;
  };
  await themThamChieu(thamChieu(look.thuongY?.id), 'main garment');
  hasHeadwearImage = await themThamChieu(thamChieu(look.thuPhuc?.id), 'headwear');
  hasLowerImage = await themThamChieu(thamChieu(look.haY?.id), 'lower garment');

  const dong = (nhan: string, ten: string | undefined, id: string | undefined, them = '') =>
    ten ? `- ${nhan}: ${moTa(id) || ten}.${them}
` : '';

  const promptText =
    `Editorial fashion lookbook photograph of a person wearing traditional Vietnamese clothing, shot in a professional photo studio.

` +
    `${ghiChuAnh.join(' ')}
` +
    `Keep the person in Image 1 recognisably the same individual: same face, hairline, skin tone and body proportions. Do not beautify, do not slim, do not change facial structure. If several people appear, use only the one closest to the camera.

` +
    `THE OUTFIT, render every item exactly as described:
` +
    dong('Main garment', thuongYTen, look.thuongY?.id, ` Colour: ${tenMauTiengViet}, hex ${hexMau}. Fabric: ${boiCanhAnh?.chatLieu || thuongYChatLieu}, with visible weave. Finishing: ${boiCanhAnh?.hoanThien || 'neat, well-pressed'}.`) +
    dong('Lower garment', look.haY?.ten, look.haY?.id, ` Colour: ${haYMau}. Fabric: ${haYChatLieu}.`) +
    dong('Headwear', look.thuPhuc?.ten, look.thuPhuc?.id, hasHeadwearImage ? '' : ` Colour: ${thuPhucMau}.`) +
    dong('Footwear', look.hai?.ten, look.hai?.id) +
    (boiCanhAnh?.dangMay ? `- Fit: ${boiCanhAnh.dangMay}.
` : '') +
    `
BACKGROUND: ${moTaBackground}.

` +
    (boiCanhAnh ? `MOOD AND EXPRESSION: ${boiCanhAnh.khongKhi}.

` : '') +
    `POSE AND FRAMING: full-length portrait, subject centred, ${boiCanhAnh?.dangDung || 'standing upright, feet together, hands clasped in front at the waist, looking at the camera'}. Vertical portrait orientation.

` +
    `LIGHT: ${boiCanhAnh?.anhSang || 'one large soft key light from the front-left, gentle shadows, low contrast, no harsh flash'}.

` +
    `STYLE: ${boiCanhAnh ? boiCanhAnh.huongNgheThuat + '; ' : ''}high-end editorial lookbook, natural skin texture, realistic fabric drape and folds, true-to-life colours, sharp focus on the clothing.

` +
    `STRICT RULES:
` +
    `- Only one person in the image.
` +
    `- No text, letters, logos, watermarks or signatures anywhere.
` +
    `- Do not add jewellery, accessories, patterns or garments that are not listed above.
` +
    `- This is Vietnamese clothing. Do not render it as Chinese hanfu, Korean hanbok or Japanese kimono; follow the construction described, not a generic East Asian robe.
` +
    `- Colours must match the hex values given.`;

  return {
    promptText,
    imageParts,
    hasHeadwearImage,
    hasLowerImage,
  };
}

// =============================================================================
// 7. GỌI GEMINI IMAGE MODEL VÀ TRÍCH XUẤT ẢNH TRẢ VỀ
// =============================================================================
async function goiGeminiSinhAnh(
  imageParts: Array<{ inlineData: { data: string; mimeType: string } }>,
  promptText: string,
  modelName: 'gemini-3.1-flash-lite-image' | 'gemini-3.1-flash-image' = 'gemini-3.1-flash-lite-image'
): Promise<string> {
  if (!ai) {
    throw new Error('Chua cau hinh GEMINI_API_KEY');
  }

  const parts: any[] = [
    ...imageParts,
    { text: promptText },
  ];

  const response = await ai.models.generateContent({
    model: modelName,
    contents: {
      parts,
    },
  });

  const candidates = response.candidates;
  if (!candidates || candidates.length === 0) {
    throw new Error('Model khong tra ve ung vien nao');
  }

  const returnedParts = candidates[0]?.content?.parts || [];
  for (const part of returnedParts) {
    if (part.inlineData && part.inlineData.data) {
      const mime = part.inlineData.mimeType || 'image/png';
      return `data:${mime};base64,${part.inlineData.data}`;
    }
  }

  throw new Error('Phan hoi tu model khong chua du lieu hinh anh');
}

// =============================================================================
// 8. HÀM CHÍNH macThu()
// Khi không có ảnh thật, macThu trả anh rỗng. Giao diện hiện biển chú thích bộ đồ, không vẽ hình thay thế.
export const THONG_BAO_CHUA_CO_MAY_DUNG =
  'Bản chạy này chưa kết nối máy dựng ảnh, nên chưa có ảnh mặc thử. Bộ đồ vẫn được kiểm tra đầy đủ theo luật văn hoá.';
//
// =============================================================================
export async function macThu(opts: {
  anhNguoi: string; // dataURL, da nen san
  look: LookState;
  boiCanh: EventContext;
  background: Background;
  chatLuong: 'nhanh' | 'ky';
  anhTruoc?: string; // ket qua lan truoc, dung khi chi doi mot mon
}): Promise<{ anh: string; soLuot: number; canhBao: string[] }> {
  const startTime = Date.now();
  const canhBao: string[] = [];

  // Prompt động: lấy các lựa chọn ở bước bối cảnh để quyết định không khí, chất vải, dáng may, ánh sáng
  const ctxBoiCanh = store.getState().contextSetup;
  const boiCanhAnh = dungBoiCanhAnh(ctxBoiCanh, opts.boiCanh, opts.look);

  // 1. Tinh toan khoa bo nho dem IndexedDB
  const garmentIds = [
    opts.look.thuongY?.id || 'none',
    opts.look.haY?.id || 'none',
    opts.look.thuPhuc?.id || 'none',
    opts.look.hai?.id || 'none',
    opts.look.hoaVan?.id || 'none',
    opts.look.mauChinh || 'none',
  ].join('_');

  const anhHashDauVao = taoHashKhoa(opts.anhNguoi.slice(0, 300));
  const cacheKey = taoHashKhoa(
    `${anhHashDauVao}_${garmentIds}_${opts.background.id}_${opts.chatLuong}_${JSON.stringify(ctxBoiCanh)}`
  );

  // Kiem tra cache IndexedDB
  const banGhiCache = await docCacheTryOn(cacheKey);
  if (banGhiCache && banGhiCache.anh) {
    tryOnStats.soLanTrungCache++;
    luuStats();
    return {
      anh: banGhiCache.anh,
      soLuot: banGhiCache.soLuot,
      canhBao: [],
    };
  }

  // Không có máy dựng ảnh (chạy local chưa có khoá Gemini): nói thẳng, không trả ảnh giả, không trừ lượt
  if (!ai || !(await aiSanSang())) {
    return { anh: '', soLuot: 0, canhBao: [THONG_BAO_CHUA_CO_MAY_DUNG] };
  }

  // Có ảnh người dùng thì dựng trên ảnh đó; không có thì dựng trên người mẫu do AI tạo (tầng 2)
  const coAnhNguoi = Boolean(opts.anhNguoi);

  // Cap nhat dem telemetry va quota ngay
  recordTryOnUsage(opts.chatLuong);
  tryOnStats.soLuotGoiAnh++;
  if (opts.chatLuong === 'ky') {
    tryOnStats.soLanTheoChatLuong.ky++;
  } else {
    tryOnStats.soLanTheoChatLuong.nhanh++;
  }

  // ---------------------------------------------------------------------------
  // 2. CHẾ ĐỘ ĐỔI NHANH MỘT MÓN (KHI CÓ anhTruoc VÀ CHỈ 1 LỚP THAY ĐỔI)
  // ---------------------------------------------------------------------------
  if (coAnhNguoi && opts.anhTruoc && lastLookExecuted) {
    const singleChange = phatHienDoiDungMotMon(opts.look, lastLookExecuted);
    if (singleChange && ai) {
      try {
        const anhTruocRaster = await chuyenDataUrlSangRasterPart(opts.anhTruoc);
        const quickPrompt =
          `Image 1 is the person dressed in traditional Vietnamese clothing.\n` +
          `Task: Change only the ${singleChange.layerName} to ${singleChange.itemDescription}. Keep everything else in the image identical.\n` +
          `Hard constraints:\n` +
          `- No text, no logo, no watermark, no signature.\n` +
          `- Do not add jewelry, patterns or garments that were not listed.`;

        const quickRes = await goiGeminiSinhAnh(
          [{ inlineData: anhTruocRaster }],
          quickPrompt,
          'gemini-3.1-flash-lite-image'
        );

        const stamped = await dongDauAnhAI(quickRes);
        lastLookExecuted = { ...opts.look };
        await ghiCacheTryOn(cacheKey, stamped, 1);

        tryOnStats.soLanThanhCong++;
        tryOnStats.tongThoiGianChoMs += Date.now() - startTime;
        luuStats();

        return {
          anh: stamped,
          soLuot: 1,
          canhBao: [],
        };
      } catch (err) {
        console.warn('[Che do doi nhanh mot mon khong thanh cong, chuyen sang che do day du]:', err);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 3. LUỒNG THI HÀNH TIÊU CHUẨN (NHANH HOẶC KỸ)
  // ---------------------------------------------------------------------------
  if (ai && coAnhNguoi) {
    try {
      if (opts.chatLuong === 'ky') {
        // --- CHẾ ĐỘ KỸ, HAI LƯỢT ---
        // Lượt 1: Giữ nguyên nền gốc từ Image 1
        const luot1Data = await xayDungPromptVaAnh({
          boiCanhAnh,
          anhNguoi: opts.anhNguoi,
          look: opts.look,
          boiCanh: opts.boiCanh,
          background: opts.background,
          overrideBackgroundDescription: 'Keep the original background from Image 1 unchanged.',
        });

        const turn1ImageRaw = await goiGeminiSinhAnh(
          luot1Data.imageParts,
          luot1Data.promptText,
          'gemini-3.1-flash-image'
        );

        // Lượt 2: Thay thế nền bằng mô tả bối cảnh
        const turn1Raster = await chuyenDataUrlSangRasterPart(turn1ImageRaw);
        const luot2Prompt =
          `Replace only the background of this image with ${opts.background.moTaChoAI}. ` +
          `Keep the person and the clothing pixel-identical. ` +
          `Match the light direction and color temperature of the new background onto the subject subtly.`;

        let finalRawImage = turn1ImageRaw;
        let soLuotThucTe = 2;

        try {
          finalRawImage = await goiGeminiSinhAnh(
            [{ inlineData: turn1Raster }],
            luot2Prompt,
            'gemini-3.1-flash-image'
          );
        } catch (turn2Err) {
          console.warn('[Luot 2 ky bi loi, giu nguyen ket qua luot 1]:', turn2Err);
          soLuotThucTe = 1;
        }

        const finalStamped = await dongDauAnhAI(finalRawImage);
        lastLookExecuted = { ...opts.look };
        await ghiCacheTryOn(cacheKey, finalStamped, soLuotThucTe);

        tryOnStats.soLanThanhCong++;
        tryOnStats.tongThoiGianChoMs += Date.now() - startTime;
        luuStats();

        return {
          anh: finalStamped,
          soLuot: soLuotThucTe,
          canhBao: [],
        };
      } else {
        // --- CHẾ ĐỘ NHANH, MỘT LƯỢT ---
        const quickData = await xayDungPromptVaAnh({
          boiCanhAnh,
          anhNguoi: opts.anhNguoi,
          look: opts.look,
          boiCanh: opts.boiCanh,
          background: opts.background,
        });

        const resultImageRaw = await goiGeminiSinhAnh(
          quickData.imageParts,
          quickData.promptText,
          'gemini-3.1-flash-lite-image'
        );

        const stamped = await dongDauAnhAI(resultImageRaw);
        lastLookExecuted = { ...opts.look };
        await ghiCacheTryOn(cacheKey, stamped, 1);

        tryOnStats.soLanThanhCong++;
        tryOnStats.tongThoiGianChoMs += Date.now() - startTime;
        luuStats();

        return {
          anh: stamped,
          soLuot: 1,
          canhBao: [],
        };
      }
    } catch (apiError: any) {
      console.warn('[Gemini API TryOn loi, khoi dong co che du phong 3 tang]:', apiError);
      tryOnStats.soLanLoi++;

      const errMsg = String(apiError?.message || apiError || '').toLowerCase();
      // Tình huống f: Mạng rớt giữa lúc dựng -> ném lỗi để giao diện huỷ sạch, giữ ảnh cũ, hiện nút thử lại
      if (
        (typeof navigator !== 'undefined' && !navigator.onLine) ||
        errMsg.includes('network') ||
        errMsg.includes('fetch') ||
        errMsg.includes('aborted') ||
        errMsg.includes('failed to fetch') ||
        errMsg.includes('connection')
      ) {
        throw new Error('NETWORK_DISCONNECTED');
      }

      // Tình huống c: Hết hạn mức -> nói thẳng và chuyển sang bản ghép lớp phẳng
      if (
        errMsg.includes('429') ||
        errMsg.includes('resource_exhausted') ||
        errMsg.includes('quota')
      ) {
        tryOnStats.soLanTheoTangDuPhong.tang3++;
        tryOnStats.soLanDuPhong++;
        return {
          anh: '',
          soLuot: 0,
          canhBao: ['Hôm nay đã dùng hết lượt dựng ảnh. Bộ đồ vẫn được kiểm tra đầy đủ, mai bạn dựng ảnh lại nhé.'],
        };
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 4. DỰ PHÒNG BA TẦNG THEO THỨ TỰ NGHIÊM NGẶT
  // ---------------------------------------------------------------------------

  // TẦNG 1: Thử lại 1 lần với prompt bỏ bối cảnh nền, giữ nguyên nền gốc
  if (ai && coAnhNguoi) {
    try {
      tryOnStats.soLanTheoTangDuPhong.tang1++;
      const fallbackPromptData = await xayDungPromptVaAnh({
          boiCanhAnh,
        anhNguoi: opts.anhNguoi,
        look: opts.look,
        boiCanh: opts.boiCanh,
        background: opts.background,
        overrideBackgroundDescription: 'Keep the original background from Image 1 unchanged.',
      });

      const retryRes = await goiGeminiSinhAnh(
        fallbackPromptData.imageParts,
        fallbackPromptData.promptText,
        'gemini-3.1-flash-lite-image'
      );

      const stamped = await dongDauAnhAI(retryRes);
      lastLookExecuted = { ...opts.look };
      await ghiCacheTryOn(cacheKey, stamped, 1);

      tryOnStats.soLanThanhCong++;
      tryOnStats.tongThoiGianChoMs += Date.now() - startTime;
      luuStats();

      return {
        anh: stamped,
        soLuot: 1,
        canhBao: ['Đã tự động giữ nguyên nền gốc do bối cảnh nền quá phức tạp.'],
      };
    } catch (tier1Err) {
      console.warn('[Tang 1 du phong khong thanh cong, tiep tuc xuong Tang 2]:', tier1Err);
    }
  }

  // TẦNG 2: Dựng ảnh trên dáng người tham chiếu trung tính (A00)
  try {
    tryOnStats.soLanTheoTangDuPhong.tang2++;
    tryOnStats.soLanDuPhong++;

    const avatarMoTaChoAI =
      'người Việt Nam trẻ tuổi, dáng chuẩn mực cân đối, đứng thẳng đoan trang, biểu cảm điềm tĩnh. Ràng buộc: ảnh nửa người trở lên, nền trơn theo không gian văn hoá đã chọn, ánh sáng tự nhiên bên, không chữ trong ảnh, không logo, không watermark.';

    // Tình huống a: Model từ chối dựng ảnh có người
    if (coAnhNguoi) {
      canhBao.push(
        'Lần này hệ thống chưa dựng được ảnh. Bạn thử ảnh sáng hơn và nền đơn giản hơn, hoặc dùng người mẫu.'
      );
    }

    // Neu co API, thu sinh tren avatar persona; neu khong co, dung mau pre-rendered tuong thich
    if (ai) {
      try {
        const avatarPrompt =
          `Portrait photograph of an avatar model wearing authentic traditional Vietnamese clothing:\n` +
          `- Model: ${avatarMoTaChoAI}\n` +
          `- Main robe: ${opts.look.thuongY?.ten || 'Áo ngũ thân tay chẽn'}, color ${opts.look.mauChinh || '#16243A'}\n` +
          `- Lower garment: ${opts.look.haY?.ten || 'Quần lụa ống rộng'}\n` +
          `- Headwear: ${opts.look.thuPhuc?.ten || 'Khăn vấn'}\n` +
          `- Background: ${opts.background.moTaChoAI}\n` +
          `- Direction: waist-up to full-body framing, soft side light, no text, no logo, no watermark.`;

        const avatarRes = await goiGeminiSinhAnh(
          [],
          avatarPrompt,
          'gemini-3.1-flash-lite-image'
        );

        const stampedAvatar = await dongDauAnhAI(avatarRes);
        await ghiCacheTryOn(cacheKey, stampedAvatar, 1);

        tryOnStats.tongThoiGianChoMs += Date.now() - startTime;
        luuStats();

        return {
          anh: stampedAvatar,
          soLuot: 1,
          canhBao,
        };
      } catch (avatarGenErr) {
        console.warn('[Tao tren avatar mau khong thanh cong, dung mau DEMO]:', avatarGenErr);
      }
    }

    // Không dựng được cả trên người mẫu: không trả ảnh giả
    tryOnStats.tongThoiGianChoMs += Date.now() - startTime;
    luuStats();

    return {
      anh: '',
      soLuot: 0,
      canhBao: canhBao.length > 0 ? canhBao : ['Lần này hệ thống chưa dựng được ảnh người mẫu. Bạn bấm mặc thử lại sau ít phút.'],
    };
  } catch (tier2Err) {
    console.warn('[Tang 2 du phong khong thanh cong, tiep tuc xuong Tang 3]:', tier2Err);
  }

  // TẦNG 3: Không còn cách dựng ảnh thật. Không vẽ ảnh thay thế, chỉ báo và giữ nút thử lại.
  tryOnStats.soLanTheoTangDuPhong.tang3++;
  tryOnStats.soLanDuPhong++;
  tryOnStats.tongThoiGianChoMs += Date.now() - startTime;
  luuStats();

  return {
    anh: '',
    soLuot: 0,
    canhBao: ['Lần này hệ thống chưa dựng được ảnh. Bộ đồ vẫn được kiểm tra đầy đủ, bạn bấm mặc thử lại sau ít phút.'],
  };
}
