import { Type } from '@google/genai';
import { taoAi, aiSanSang } from './aiClient';
import { LookState, EventContext, Background } from '../types';
import { GARMENTS } from '../data/garments';
import { TRADITIONAL_COLORS } from '../data/palettes';
import { moTaBoiCanh } from '../data/backgrounds';
import { recordTryOnUsage } from './tryOnGuard';
import { store } from './store';
import { dungBoiCanhAnh, BoiCanhAnh } from './promptDong';
import { mauHaY, mauThuPhuc } from './mauLook';

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
      itemDescription: `${hienTai.haY?.ten || 'quần lụa ống rộng'}, color ${mauHaY(hienTai) || '#F2EDE3'}`,
    });
  }

  if (hienTai.thuPhuc?.id !== truocDo.thuPhuc?.id) {
    differences.push({
      layerKey: 'thuPhuc',
      layerName: 'headwear (thủ phục)',
      itemDescription: `${hienTai.thuPhuc?.ten || 'khăn vấn/khăn đóng'}, color ${mauThuPhuc(hienTai) || '#2C2A26'}`,
    });
  }

  if (hienTai.hai?.id !== truocDo.hai?.id) {
    differences.push({
      layerKey: 'hai',
      layerName: 'footwear (hài)',
      itemDescription: `${hienTai.hai?.ten || 'hài thêu cổ truyền'}`,
    });
  }

  // Đổi màu quần hoặc màu khăn mà giữ nguyên món: cũng là đổi đúng một lớp
  if (hienTai.haY && hienTai.haY.id === truocDo.haY?.id && mauHaY(hienTai) !== mauHaY(truocDo)) {
    differences.push({
      layerKey: 'haY',
      layerName: 'fabric color of the lower garment',
      itemDescription: `color ${mauHaY(hienTai)}`,
    });
  }

  if (hienTai.thuPhuc && hienTai.thuPhuc.id === truocDo.thuPhuc?.id && mauThuPhuc(hienTai) !== mauThuPhuc(truocDo)) {
    differences.push({
      layerKey: 'thuPhuc',
      layerName: 'fabric color of the headwear',
      itemDescription: `color ${mauThuPhuc(hienTai)}`,
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
// 6. CẮT KHUÔN MẶT ĐỂ GIỮ MẶT
// =============================================================================
// Model chữ dùng chung với gemini.ts, để tìm khung mặt và kiểm ảnh
const MODEL_CHU = 'gemini-3.8-flash';

export const THONG_BAO_ANH_KHONG_HOP_LE = 'Hãy dùng ảnh chỉ có một người, thấy rõ mặt.';

// Mỗi ảnh người dùng chỉ tìm mặt một lần. Đổi trang phục không gọi lại.
const boNhoMat = new Map<string, { hopLe: boolean; anhMat?: string }>();

function catTheoKhung(dataUrl: string, box: number[]): Promise<string | undefined> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(undefined);
    const img = new Image();
    img.onload = () => {
      const [ymin, xmin, ymax, xmax] = box.map((v) => Math.min(1000, Math.max(0, v)) / 1000);
      const w = (xmax - xmin) * img.width;
      const h = (ymax - ymin) * img.height;
      if (w < 8 || h < 8) return resolve(undefined);
      // Nới 40 phần trăm mỗi phía để lấy cả tóc và cằm
      const x0 = Math.max(0, xmin * img.width - w * 0.4);
      const y0 = Math.max(0, ymin * img.height - h * 0.4);
      const x1 = Math.min(img.width, xmax * img.width + w * 0.4);
      const y1 = Math.min(img.height, ymax * img.height + h * 0.4);
      const tiLe = Math.min(1, 512 / Math.max(x1 - x0, y1 - y0));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round((x1 - x0) * tiLe);
      canvas.height = Math.round((y1 - y0) * tiLe);
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(undefined);
      ctx.drawImage(img, x0, y0, x1 - x0, y1 - y0, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.92));
    };
    img.onerror = () => resolve(undefined);
    img.src = dataUrl;
  });
}

/**
 * Tìm khuôn mặt lớn nhất và cắt cận để gửi kèm làm ảnh giữ mặt.
 * hopLe = false khi không thấy mặt hoặc có hơn một người.
 * Nếu chính lời gọi tìm mặt bị lỗi thì vẫn cho dựng, chỉ là không có ảnh cận mặt.
 */
async function catKhuonMat(anhNguoi: string): Promise<{ hopLe: boolean; anhMat?: string }> {
  const khoa = taoHashKhoa(anhNguoi);
  const daCo = boNhoMat.get(khoa);
  if (daCo) return daCo;
  if (!ai) return { hopLe: true };

  try {
    const anh = await chuyenDataUrlSangRasterPart(anhNguoi);
    const res = await ai.models.generateContent({
      model: MODEL_CHU,
      contents: {
        parts: [
          { inlineData: anh },
          {
            text:
              'Count the people visible in this photo and find the largest human face. ' +
              'Return soNguoi (number of people) and box_2d as [ymin, xmin, ymax, xmax] normalised to 0-1000 for that face. ' +
              'If there is no clearly visible face, return an empty box_2d.',
          },
        ],
      },
      config: {
        temperature: 0,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            soNguoi: { type: Type.INTEGER },
            box_2d: { type: Type.ARRAY, items: { type: Type.NUMBER } },
          },
          required: ['soNguoi', 'box_2d'],
        },
      },
    });
    const du = JSON.parse(res.text || '{}') as { soNguoi?: number; box_2d?: number[] };
    let ketQua: { hopLe: boolean; anhMat?: string };
    if (du.soNguoi !== 1 || !Array.isArray(du.box_2d) || du.box_2d.length !== 4) {
      ketQua = { hopLe: false };
    } else {
      ketQua = { hopLe: true, anhMat: await catTheoKhung(anhNguoi, du.box_2d) };
    }
    boNhoMat.set(khoa, ketQua);
    return ketQua;
  } catch (err) {
    console.warn('[Tim khuon mat loi, dung tiep khong co anh can mat]:', err);
    return { hopLe: true };
  }
}

// =============================================================================
// 7. XÂY DỰNG PROMPT ẢNH
// =============================================================================

type AnhPart = { inlineData: { data: string; mimeType: string } };

interface PromptBuilderResult {
  promptText: string;
  imageParts: AnhPart[];
}

const NGUOI_MAU: Record<string, string> = {
  nam: 'a Vietnamese man in his twenties with natural features and short dark hair',
  nu: 'a Vietnamese woman in her twenties with natural features and long dark hair',
  khong_neu: 'a young Vietnamese adult with natural features and dark hair',
};

async function xayDungPromptVaAnh(opts: {
  anhNguoi?: string;
  anhMat?: string;
  look: LookState;
  moTaCanh: string;
  overrideBackgroundDescription?: string;
  boiCanhAnh?: BoiCanhAnh;
  nguoiMac?: string;
}): Promise<PromptBuilderResult> {
  const { anhNguoi, anhMat, look, moTaCanh, overrideBackgroundDescription, boiCanhAnh } = opts;

  const mainColorObj = TRADITIONAL_COLORS.find(
    (c) => c.hex.toLowerCase() === (look.mauChinh || '#16243A').toLowerCase()
  );
  const tenMauTiengViet = mainColorObj?.ten || 'Chàm';
  const hexMau = look.mauChinh || '#16243A';
  const thuongYTen = look.thuongY?.ten || 'Áo ngũ thân tay chẽn';
  const thuongYChatLieu =
    look.thuongY?.chatLieuPhoBien?.join(', ') || 'lụa tơ tằm, the dệt truyền thống';
  // Màu quần, màu khăn là màu người dùng chọn trong màu truyền thống của món (lib/mauLook.ts)
  const tenMau = (hex?: string) => (hex ? `${TRADITIONAL_COLORS.find((c) => c.hex.toLowerCase() === hex.toLowerCase())?.ten || ''} hex ${hex}`.trim() : '');
  const haYMau = tenMau(mauHaY(look)) || 'Ngà hex #F2EDE3';
  const haYChatLieu = look.haY?.chatLieuPhoBien?.join(', ') || 'lụa mềm';
  const thuPhucMau = tenMau(mauThuPhuc(look)) || 'The đen hex #2C2A26';

  // Thứ tự ảnh, tối đa 4: người dùng, cận mặt, thượng y, thủ phục. Còn chỗ mới thêm hạ y.
  const imageParts: AnhPart[] = [];
  if (anhNguoi) imageParts.push({ inlineData: await chuyenDataUrlSangRasterPart(anhNguoi) });
  if (anhNguoi && anhMat) imageParts.push({ inlineData: await chuyenDataUrlSangRasterPart(anhMat) });

  // Chỉ gửi ảnh chụp hiện vật thật làm tham chiếu. Hình vẽ minh hoạ khiến model chép theo nét vẽ.
  const thamChieu = (id?: string) => GARMENTS.find((g) => g.id === id)?.anhThamChieuThat;
  const moTa = (id?: string) => GARMENTS.find((g) => g.id === id)?.moTaHinhAnh;
  const themThamChieu = async (src: string | undefined) => {
    if (!src || imageParts.length >= 4) return 0;
    imageParts.push({ inlineData: await chuyenDataUrlSangRasterPart(src) });
    return imageParts.length;
  };
  const soAnhAo = await themThamChieu(thamChieu(look.thuongY?.id));
  const soAnhKhan = await themThamChieu(thamChieu(look.thuPhuc?.id));
  const soAnhHaY = await themThamChieu(thamChieu(look.haY?.id));
  const ghiAnh = (so: number, mon: string) =>
    so ? ` Image ${so} is a museum photo of this ${mon}: follow its collar, closure and sleeve construction exactly; use it only for the clothing, never for the face, pose or background.` : '';

  const khoiNguoi = anhNguoi
    ? `IDENTITY, HIGHEST PRIORITY. Image 1 is a real person${anhMat ? " and Image 2 is a close-up of the same person's face" : ''}. ` +
      `The output must show this exact individual, instantly recognisable to someone who knows them. ` +
      `Copy from ${anhMat ? 'Images 1 and 2' : 'Image 1'}: face shape, jawline, eye shape and spacing, eyelids, eyebrows, nose, lips, ears, skin tone, skin texture, moles and marks, age, hairline and hair colour, glasses if worn. ` +
      `Do not beautify, slim, smooth, whiten or age the face. Do not add makeup. Keep a natural, calm expression. ` +
      `Only the clothing, pose, setting and light change. If several people appear in Image 1, use only the one closest to the camera.`
    : `SUBJECT: ${NGUOI_MAU[opts.nguoiMac || ''] || NGUOI_MAU.khong_neu}, calm composed expression, no heavy makeup.`;

  const dong = (nhan: string, ten: string | undefined, id: string | undefined, them = '') =>
    ten ? `- ${nhan}: ${moTa(id) || ten}.${them}\n` : '';

  const promptText =
    `${khoiNguoi}\n\n` +
    `A real on-location photograph of this person wearing traditional Vietnamese clothing, at the place described under SETTING.\n\n` +
    `THE OUTFIT, render every item exactly as described:\n` +
    dong(
      'Main garment',
      thuongYTen,
      look.thuongY?.id,
      ` Colour: ${tenMauTiengViet}, hex ${hexMau}. Fabric: ${boiCanhAnh?.chatLieu || thuongYChatLieu}, real fabric weight, visible weave, natural creases. Finishing: ${boiCanhAnh?.hoanThien || 'neat, well-pressed'}.${ghiAnh(soAnhAo, 'garment')}`
    ) +
    dong('Lower garment', look.haY?.ten, look.haY?.id, ` Colour: ${haYMau}. Fabric: ${haYChatLieu}.${ghiAnh(soAnhHaY, 'lower garment')}`) +
    dong('Headwear', look.thuPhuc?.ten, look.thuPhuc?.id, ` Colour: ${thuPhucMau}.${ghiAnh(soAnhKhan, 'headwear')}`) +
    dong('Footwear', look.hai?.ten, look.hai?.id) +
    (look.hoaVan?.ten
      ? `- Pattern: small ${look.hoaVan.ten} (${boDauTiengViet(look.hoaVan.ten)}) motifs, sparse, woven into the fabric, not printed large.\n`
      : '') +
    (boiCanhAnh?.dangMay ? `- Fit: ${boiCanhAnh.dangMay}.\n` : '') +
    `\nSETTING: ${overrideBackgroundDescription ?? moTaCanh}\n\n` +
    (boiCanhAnh ? `MOOD AND EXPRESSION: ${boiCanhAnh.khongKhi}.\n\n` : '') +
    `FRAMING AND POSE: full-length shot, the entire body visible from the top of the head or headwear down to the feet and shoes, nothing cropped. ` +
    `The person fills about 80 to 85 percent of the frame height so the face stays large and clear. ` +
    `${boiCanhAnh?.dangDung || 'standing upright, feet together, hands clasped in front at the waist, looking at the camera'}. Vertical 3:4.\n\n` +
    `LIGHT: ${boiCanhAnh?.anhSang || 'natural available light of the location, gentle shadows, no flash'}.\n\n` +
    `PHOTOGRAPHY: shot on a full-frame camera with a 50mm lens at f/2.8, camera at chest height. The person is in sharp focus, the background is naturally out of focus. ` +
    `The light on the person matches the scene light in direction and colour. Feet stand firmly on the ground with a soft contact shadow. ` +
    `Natural, slightly muted colour grading, real skin texture with visible pores.` +
    (boiCanhAnh ? ` Styling: ${boiCanhAnh.huongNgheThuat}.` : '') +
    `\n\nSTRICT RULES:\n` +
    `- Only one person in the image. No other people, not even in the background.\n` +
    `- No studio backdrop, no plain paper background, no seamless backdrop.\n` +
    `- No text, letters, logos, watermarks or signatures anywhere.\n` +
    `- Do not add jewellery, accessories or garments that are not listed above.\n` +
    `- This is Vietnamese clothing. Do not render it as Chinese hanfu, Korean hanbok or Japanese kimono.\n` +
    `- Colours must match the hex values given.\n` +
    `- Not a painting, not a 3D render, not an illustration. No HDR look, no oversaturation, no glow, no airbrushed skin, no plastic-looking fabric.`;

  return { promptText, imageParts };
}

// =============================================================================
// 8. GỌI GEMINI IMAGE MODEL VÀ TRÍCH XUẤT ẢNH TRẢ VỀ
// =============================================================================
type ModelAnh = 'gemini-3.1-flash-lite-image' | 'gemini-3.1-flash-image';

async function goiGeminiSinhAnh(
  imageParts: AnhPart[],
  promptText: string,
  modelName: ModelAnh = 'gemini-3.1-flash-lite-image'
): Promise<string> {
  if (!ai) {
    throw new Error('Chua cau hinh GEMINI_API_KEY');
  }

  const goi = (coTiLe: boolean) =>
    ai.models.generateContent({
      model: modelName,
      contents: { parts: [...imageParts, { text: promptText }] },
      ...(coTiLe ? { config: { imageConfig: { aspectRatio: '3:4' } } } : {}),
    });

  let response: Awaited<ReturnType<typeof goi>>;
  try {
    response = await goi(true);
  } catch (err: any) {
    // Model không nhận tham số tỉ lệ khung: bỏ đi, prompt vẫn ghi Vertical 3:4
    const msg = String(err?.message || err || '').toLowerCase();
    if (!msg.includes('aspect') && !msg.includes('imageconfig') && !msg.includes('image_config')) throw err;
    response = await goi(false);
  }

  const returnedParts = response.candidates?.[0]?.content?.parts || [];
  for (const part of returnedParts) {
    if (part.inlineData && part.inlineData.data) {
      const mime = part.inlineData.mimeType || 'image/png';
      return `data:${mime};base64,${part.inlineData.data}`;
    }
  }

  throw new Error('Phan hoi tu model khong chua du lieu hinh anh');
}

// =============================================================================
// 9. KIỂM ẢNH SAU KHI DỰNG, DỰNG LẠI ĐÚNG MỘT LẦN NẾU SAI
// =============================================================================
interface KetQuaKiem {
  thuongY: { khop: boolean; nhinThay: string };
  mauChinh: { khop: boolean; mauNhinThay: string };
  khuonMat?: { cungNguoi: boolean; khacBiet: string };
  toanThan: boolean;
  boiCanh: { khop: boolean; nhinThay: string };
  laStudio: boolean;
  soNguoi: number;
  coChuHoacLogo: boolean;
  diemKhop: number;
}

/** Phần kết quả kiểm hiện cho người dùng dưới ảnh */
export interface KiemTraAnh {
  soKhop: number;
  tongSo: number;
  matLech: boolean;
  chiTiet: { ten: string; khop: boolean; nhinThay?: string }[];
}

const camCo = (nhinThay: string) => ({
  type: Type.OBJECT,
  properties: { khop: { type: Type.BOOLEAN }, [nhinThay]: { type: Type.STRING } },
  required: ['khop', nhinThay],
});

async function kiemAnh(anh: string, anhMat: string | undefined, look: LookState, moTaCanh: string): Promise<KetQuaKiem | null> {
  if (!ai) return null;
  try {
    const parts: any[] = [{ inlineData: await chuyenDataUrlSangRasterPart(anh) }];
    if (anhMat) parts.push({ inlineData: await chuyenDataUrlSangRasterPart(anhMat) });
    const ao = look.thuongY ? GARMENTS.find((g) => g.id === look.thuongY?.id)?.moTaHinhAnh || look.thuongY.ten : 'none';
    parts.push({
      text:
        `The first image was generated by an AI.${anhMat ? ' The second image is the reference face photo of the real person.' : ''}\n` +
        `Compare the first image with this specification and be strict:\n` +
        `- Main garment: ${ao}\n- Main colour: hex ${look.mauChinh || '#16243A'}\n- Setting: ${moTaCanh}\n` +
        (anhMat
          ? `Compare the face in the generated image with the reference face photo. Answer khuonMat.cungNguoi=false if a stranger could reasonably think it is a different person.\n`
          : '') +
        `toanThan is true only if both the top of the head and the feet are visible. laStudio is true if the background is a plain, seamless or studio backdrop. ` +
        `A narrow sleeve does not match a wide sleeve, a cross collar does not match a standing collar, a different colour family does not match. ` +
        `diemKhop is an overall match score from 0 to 100. Write the nhinThay fields briefly in Vietnamese.`,
    });

    const properties: Record<string, any> = {
      thuongY: camCo('nhinThay'),
      mauChinh: camCo('mauNhinThay'),
      toanThan: { type: Type.BOOLEAN },
      boiCanh: camCo('nhinThay'),
      laStudio: { type: Type.BOOLEAN },
      soNguoi: { type: Type.INTEGER },
      coChuHoacLogo: { type: Type.BOOLEAN },
      diemKhop: { type: Type.INTEGER },
    };
    if (anhMat) {
      properties.khuonMat = {
        type: Type.OBJECT,
        properties: { cungNguoi: { type: Type.BOOLEAN }, khacBiet: { type: Type.STRING } },
        required: ['cungNguoi', 'khacBiet'],
      };
    }

    const res = await ai.models.generateContent({
      model: MODEL_CHU,
      contents: { parts },
      config: {
        temperature: 0,
        responseMimeType: 'application/json',
        responseSchema: { type: Type.OBJECT, properties, required: Object.keys(properties) },
      },
    });
    return JSON.parse(res.text || 'null') as KetQuaKiem | null;
  } catch (err) {
    console.warn('[Kiem anh loi, giu ket qua dung]:', err);
    return null;
  }
}

function lietKeLoi(k: KetQuaKiem): string[] {
  const loi: string[] = [];
  if (k.khuonMat && !k.khuonMat.cungNguoi) loi.push(`the face does not match the reference person (${k.khuonMat.khacBiet})`);
  if (!k.toanThan) loi.push('the body is cropped; show the whole person from the top of the head to the feet');
  if (k.laStudio) loi.push('the background is a studio backdrop; place the person in the real location described under SETTING');
  if (!k.boiCanh.khop) loi.push(`the setting is wrong (seen: ${k.boiCanh.nhinThay})`);
  if (!k.thuongY.khop) loi.push(`the main garment is wrong (seen: ${k.thuongY.nhinThay})`);
  if (!k.mauChinh.khop) loi.push(`the main colour is wrong (seen: ${k.mauChinh.mauNhinThay})`);
  if (k.soNguoi !== 1) loi.push(`there are ${k.soNguoi} people; there must be exactly one`);
  if (k.coChuHoacLogo) loi.push('there is text or a logo; remove it');
  if (loi.length === 0 && k.diemKhop < 70) loi.push('the outfit does not follow the specification closely enough');
  return loi;
}

function choNguoiDung(k: KetQuaKiem | null): KiemTraAnh | undefined {
  if (!k) return undefined;
  const chiTiet = [
    { ten: 'Thượng y', khop: k.thuongY.khop, nhinThay: k.thuongY.nhinThay },
    { ten: 'Màu chính', khop: k.mauChinh.khop, nhinThay: k.mauChinh.mauNhinThay },
    { ten: 'Toàn thân', khop: k.toanThan },
    { ten: 'Bối cảnh', khop: k.boiCanh.khop && !k.laStudio, nhinThay: k.boiCanh.nhinThay },
  ];
  if (k.khuonMat) chiTiet.push({ ten: 'Khuôn mặt', khop: k.khuonMat.cungNguoi, nhinThay: k.khuonMat.khacBiet });
  return {
    soKhop: chiTiet.filter((c) => c.khop).length,
    tongSo: chiTiet.length,
    matLech: Boolean(k.khuonMat && !k.khuonMat.cungNguoi),
    chiTiet,
  };
}

/** Dựng, kiểm, sai thì dựng lại đúng một lần với danh sách lỗi cụ thể. */
async function dungVaKiem(
  imageParts: AnhPart[],
  promptText: string,
  model: ModelAnh,
  kiem: { anhMat?: string; look: LookState; moTaCanh: string; chatLuong: 'nhanh' | 'ky' }
): Promise<{ anh: string; soLuot: number; kiemTra?: KiemTraAnh }> {
  const lan1 = await goiGeminiSinhAnh(imageParts, promptText, model);
  const kq1 = await kiemAnh(lan1, kiem.anhMat, kiem.look, kiem.moTaCanh);
  const loi = kq1 ? lietKeLoi(kq1) : [];
  if (loi.length === 0) return { anh: lan1, soLuot: 1, kiemTra: choNguoiDung(kq1) };

  const moDau =
    `PREVIOUS ATTEMPT WAS WRONG. Fix these specific problems: ${loi.join('; ')}.` +
    (kq1?.khuonMat && !kq1.khuonMat.cungNguoi ? ' The face changed. Copy the face from Image 2 exactly, feature by feature.' : '') +
    ` All other instructions still apply.\n\n`;
  try {
    // Lượt dựng lại do hệ thống tự kiểm, không trừ vào hạn mức của người dùng
    tryOnStats.soLuotGoiAnh++;
    const lan2 = await goiGeminiSinhAnh(imageParts, moDau + promptText, model);
    const kq2 = await kiemAnh(lan2, kiem.anhMat, kiem.look, kiem.moTaCanh);
    return { anh: lan2, soLuot: 2, kiemTra: choNguoiDung(kq2 || kq1) };
  } catch (err) {
    console.warn('[Dung lai loi, giu ket qua lan 1]:', err);
    return { anh: lan1, soLuot: 1, kiemTra: choNguoiDung(kq1) };
  }
}

// =============================================================================
// 10. HÀM CHÍNH macThu()
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
}): Promise<{ anh: string; soLuot: number; canhBao: string[]; kiemTra?: KiemTraAnh }> {
  const startTime = Date.now();
  const canhBao: string[] = [];

  // Prompt động: lấy các lựa chọn ở bước bối cảnh để quyết định không khí, chất vải, dáng may, ánh sáng
  const ctxBoiCanh = store.getState().contextSetup;
  const boiCanhAnh = dungBoiCanhAnh(ctxBoiCanh, opts.boiCanh, opts.look);
  // Cảnh chụp: không gian của dịp ghép với vùng miền và thời tiết đang chọn
  const moTaCanh = moTaBoiCanh(opts.background, ctxBoiCanh.regionId, {
    mua: ctxBoiCanh.thoiTietMua,
    nhietDo: ctxBoiCanh.nhietDo,
  });

  // 1. Tinh toan khoa bo nho dem IndexedDB
  const garmentIds = [
    opts.look.thuongY?.id || 'none',
    opts.look.haY?.id || 'none',
    opts.look.thuPhuc?.id || 'none',
    opts.look.hai?.id || 'none',
    opts.look.hoaVan?.id || 'none',
    opts.look.mauChinh || 'none',
    mauHaY(opts.look) || 'none',
    mauThuPhuc(opts.look) || 'none',
  ].join('_');

  // Băm cả ảnh. Phần đầu dataURL của mọi ảnh JPEG gần như giống nhau, băm mỗi phần đầu sẽ lẫn ảnh người này sang người khác.
  const anhHashDauVao = taoHashKhoa(opts.anhNguoi);
  const cacheKey = taoHashKhoa(
    `v2_${anhHashDauVao}_${garmentIds}_${opts.background.id}_${opts.chatLuong}_${JSON.stringify(ctxBoiCanh)}`
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

  // Ảnh người dùng phải có đúng một người, thấy rõ mặt. Cắt cận mặt để giữ mặt.
  let anhMat: string | undefined;
  if (coAnhNguoi) {
    const mat = await catKhuonMat(opts.anhNguoi);
    if (!mat.hopLe) {
      return { anh: '', soLuot: 0, canhBao: [THONG_BAO_ANH_KHONG_HOP_LE] };
    }
    anhMat = mat.anhMat;
  }
  const thongTinKiem = { anhMat, look: opts.look, moTaCanh, chatLuong: opts.chatLuong };

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
          `Task: Change only the ${singleChange.layerName} to ${singleChange.itemDescription}. Keep everything else in the image identical: the face, the full-length framing and the background.\n` +
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

  const ketThuc = async (kq: { anh: string; soLuot: number; kiemTra?: KiemTraAnh }) => {
    const stamped = await dongDauAnhAI(kq.anh);
    lastLookExecuted = { ...opts.look };
    await ghiCacheTryOn(cacheKey, stamped, kq.soLuot);
    tryOnStats.soLanThanhCong++;
    tryOnStats.tongThoiGianChoMs += Date.now() - startTime;
    luuStats();
    return { anh: stamped, soLuot: kq.soLuot, canhBao: [] as string[], kiemTra: kq.kiemTra };
  };

  // ---------------------------------------------------------------------------
  // 3. LUỒNG THI HÀNH TIÊU CHUẨN (NHANH HOẶC KỸ)
  // ---------------------------------------------------------------------------
  if (ai && coAnhNguoi) {
    try {
      if (opts.chatLuong === 'ky') {
        // --- CHẾ ĐỘ KỸ, HAI LƯỢT ---
        // Lượt 1: mặc đồ, giữ nguyên nền gốc từ Image 1
        const luot1Data = await xayDungPromptVaAnh({
          boiCanhAnh,
          anhNguoi: opts.anhNguoi,
          anhMat,
          look: opts.look,
          moTaCanh,
          overrideBackgroundDescription: 'Keep the original background from Image 1 unchanged.',
        });

        const turn1ImageRaw = await goiGeminiSinhAnh(
          luot1Data.imageParts,
          luot1Data.promptText,
          'gemini-3.1-flash-image'
        );

        // Lượt 2: đưa người vào cảnh thật của dịp và vùng, kiểm rồi dựng lại một lần nếu sai
        const turn1Raster = await chuyenDataUrlSangRasterPart(turn1ImageRaw);
        const parts2: AnhPart[] = [{ inlineData: turn1Raster }];
        if (anhMat) parts2.push({ inlineData: await chuyenDataUrlSangRasterPart(anhMat) });
        const luot2Prompt =
          `Image 1 is a photo of a person in traditional Vietnamese clothing.${anhMat ? " Image 2 is a close-up of the same person's face." : ''}\n` +
          `Place this person in a real location. SETTING: ${moTaCanh}\n` +
          `Keep the face exactly the same as ${anhMat ? 'Image 2' : 'Image 1'}, and keep the clothing exactly as in Image 1. ` +
          `Full-length shot: the whole body from the top of the head or headwear to the feet and shoes, nothing cropped, the person filling about 80 to 85 percent of the frame height. Vertical 3:4. ` +
          `Shot on a 50mm lens at f/2.8, background naturally out of focus, the light on the person matching the scene light, feet on the ground with a soft contact shadow. ` +
          `Only one person. No studio backdrop. No text or logos. Not a painting or 3D render.`;

        try {
          const kq = await dungVaKiem(parts2, luot2Prompt, 'gemini-3.1-flash-image', thongTinKiem);
          return await ketThuc({ ...kq, soLuot: kq.soLuot + 1 });
        } catch (turn2Err) {
          console.warn('[Luot 2 ky bi loi, giu nguyen ket qua luot 1]:', turn2Err);
          return await ketThuc({ anh: turn1ImageRaw, soLuot: 1 });
        }
      } else {
        // --- CHẾ ĐỘ NHANH, MỘT LƯỢT, CÓ KIỂM VÀ DỰNG LẠI MỘT LẦN ---
        const quickData = await xayDungPromptVaAnh({
          boiCanhAnh,
          anhNguoi: opts.anhNguoi,
          anhMat,
          look: opts.look,
          moTaCanh,
        });

        const kq = await dungVaKiem(quickData.imageParts, quickData.promptText, 'gemini-3.1-flash-lite-image', thongTinKiem);
        return await ketThuc(kq);
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

      // Tình huống c: Hết hạn mức -> nói thẳng
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
        anhMat,
        look: opts.look,
        moTaCanh,
        overrideBackgroundDescription: 'Keep the original background from Image 1 unchanged.',
      });

      const retryRes = await goiGeminiSinhAnh(
        fallbackPromptData.imageParts,
        fallbackPromptData.promptText,
        'gemini-3.1-flash-lite-image'
      );

      const kq = await ketThuc({ anh: retryRes, soLuot: 1 });
      return { ...kq, canhBao: ['Đã tự động giữ nguyên nền gốc do bối cảnh nền quá phức tạp.'] };
    } catch (tier1Err) {
      console.warn('[Tang 1 du phong khong thanh cong, tiep tuc xuong Tang 2]:', tier1Err);
    }
  }

  // TẦNG 2: Dựng ảnh trên người mẫu do AI tạo, cùng cảnh, cùng luật toàn thân và độ thật
  try {
    tryOnStats.soLanTheoTangDuPhong.tang2++;
    tryOnStats.soLanDuPhong++;

    // Tình huống a: Model từ chối dựng ảnh có người
    if (coAnhNguoi) {
      canhBao.push(
        'Lần này hệ thống chưa dựng được ảnh. Bạn thử ảnh sáng hơn và nền đơn giản hơn, hoặc dùng người mẫu.'
      );
    }

    if (ai) {
      try {
        const avatarData = await xayDungPromptVaAnh({
          boiCanhAnh,
          look: opts.look,
          moTaCanh,
          nguoiMac: ctxBoiCanh.nguoiMac,
        });
        const kq = await dungVaKiem(avatarData.imageParts, avatarData.promptText, 'gemini-3.1-flash-lite-image', {
          ...thongTinKiem,
          anhMat: undefined,
        });
        const stampedAvatar = await dongDauAnhAI(kq.anh);
        await ghiCacheTryOn(cacheKey, stampedAvatar, kq.soLuot);

        tryOnStats.tongThoiGianChoMs += Date.now() - startTime;
        luuStats();

        return {
          anh: stampedAvatar,
          soLuot: kq.soLuot,
          canhBao,
          kiemTra: kq.kiemTra,
        };
      } catch (avatarGenErr) {
        console.warn('[Tao tren nguoi mau khong thanh cong]:', avatarGenErr);
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
