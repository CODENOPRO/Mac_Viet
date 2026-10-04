import { GoogleGenAI } from '@google/genai';
import { LookState, EventContext, Background } from '../types';
import { GARMENTS } from '../data/garments';
import { TRADITIONAL_COLORS } from '../data/palettes';
import { DEMO_RESPONSES } from '../data/demoResponses';
import { recordTryOnUsage } from './tryOnGuard';

// =============================================================================
// 1. CẤU HÌNH API KEY VÀ KHỞI TẠO SDK @google/genai
// =============================================================================
const getApiKey = (): string => {
  if (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY;
  }
  if (typeof window !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY) {
    return (import.meta as any).env.VITE_GEMINI_API_KEY;
  }
  return '';
};

const apiKey = getApiKey();
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

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
      canvas.width = img.width || 480;
      canvas.height = img.height || 600;
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
 * Đóng dấu "ANH DO AI TAO" vĩnh viễn vào canvas ảnh
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
      const text = 'ANH DO AI TAO';

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

/**
 * Tao ban ghep minh hoa lop phang du phong (Tang 3)
 */
export async function taoBanGhepLopPhang(
  look: LookState,
  background: Background
): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      return resolve(DEMO_RESPONSES.renderLook.imageUrl);
    }
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    if (!ctx) return resolve(DEMO_RESPONSES.renderLook.imageUrl);

    // Nen giay cu mau nga
    ctx.fillStyle = '#F2EDE3';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Khung vien thu cong
    ctx.strokeStyle = '#C39A27';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

    // Thong tin boi canh
    ctx.font = '12px "JetBrains Mono", monospace';
    ctx.fillStyle = '#6E5439';
    ctx.fillText(`BOI CANH: ${background.ten.toUpperCase()}`, 36, 54);

    // Tieu de look
    ctx.font = '24px "Fraunces", serif';
    ctx.fillStyle = '#2C2A26';
    ctx.fillText(look.thuongY?.ten || 'Trang phục cổ truyền', 36, 92);

    // Dựng khối minh họa phom áo
    const primaryColor = look.mauChinh || '#16243A';
    ctx.fillStyle = primaryColor;
    ctx.beginPath();
    ctx.moveTo(220, 160);
    ctx.lineTo(380, 160);
    ctx.lineTo(430, 560);
    ctx.lineTo(170, 560);
    ctx.closePath();
    ctx.fill();

    // Cổ áo viền kim loại
    ctx.strokeStyle = '#C39A27';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(250, 160);
    ctx.lineTo(340, 250);
    ctx.stroke();

    // 5 khuy ngũ thân
    ctx.fillStyle = '#C39A27';
    [180, 215, 250, 310, 370].forEach((y, i) => {
      ctx.beginPath();
      ctx.arc(340 - i * 4, y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Ha y (quan/vay)
    ctx.fillStyle = '#E8DEC8';
    ctx.fillRect(200, 560, 90, 160);
    ctx.fillRect(310, 560, 90, 160);

    // Thu phuc (khan/mu)
    ctx.fillStyle = '#2C2A26';
    ctx.beginPath();
    ctx.ellipse(300, 135, 65, 22, 0, 0, Math.PI * 2);
    ctx.fill();

    // Nhan minh hoa phang
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.fillStyle = '#6E5439';
    ctx.fillText('BAN MINH HOA LOP PHANG · DU PHONG TANG 3', 36, 755);

    resolve(canvas.toDataURL('image/jpeg', 0.9));
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
  }
): Promise<PromptBuilderResult> {
  const { anhNguoi, look, background, overrideBackgroundDescription } = opts;

  // Tim mau tieng Viet
  const mainColorObj = TRADITIONAL_COLORS.find(
    (c) => c.hex.toLowerCase() === (look.mauChinh || '#16243A').toLowerCase()
  );
  const tenMauTiengViet = mainColorObj?.ten || 'Chàm';
  const hexMau = look.mauChinh || '#16243A';

  // Thong tin thuong y
  const thuongYTen = look.thuongY?.ten || 'Áo ngũ thân tay chẽn';
  const thuongYTenKhongDau = boDauTiengViet(thuongYTen);
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

  // Anh 2: Thuong y
  let hasUpperImage = false;
  const thuongYRef =
    look.thuongY?.anh ||
    GARMENTS.find((g) => g.id === look.thuongY?.id)?.anh;
  if (thuongYRef) {
    const upperRaster = await chuyenDataUrlSangRasterPart(thuongYRef);
    imageParts.push({ inlineData: upperRaster });
    hasUpperImage = true;
  }

  // Anh 3: Thu phuc (neu co)
  let hasHeadwearImage = false;
  if (look.thuPhuc && imageParts.length < 4) {
    const thuPhucRef =
      look.thuPhuc.anh ||
      GARMENTS.find((g) => g.id === look.thuPhuc?.id)?.anh;
    if (thuPhucRef) {
      const headRaster = await chuyenDataUrlSangRasterPart(thuPhucRef);
      imageParts.push({ inlineData: headRaster });
      hasHeadwearImage = true;
    }
  }

  // Anh 4: Ha y (neu co va con cho)
  let hasLowerImage = false;
  let lowerImageIndex = 0;
  if (look.haY && imageParts.length < 4) {
    const haYRef =
      look.haY.anh ||
      GARMENTS.find((g) => g.id === look.haY?.id)?.anh;
    if (haYRef) {
      const lowerRaster = await chuyenDataUrlSangRasterPart(haYRef);
      imageParts.push({ inlineData: lowerRaster });
      hasLowerImage = true;
      lowerImageIndex = imageParts.length; // index 1-based trong prompt
    }
  }

  // Xay dung chuoi dau Image 1, Image 2...
  let headerImages = 'Image 1 is the person. Image 2 is the reference garment for the main robe.';
  if (hasHeadwearImage) {
    headerImages += ' Image 3 is the reference headwear.';
  }
  if (hasLowerImage) {
    headerImages += ` Image ${lowerImageIndex} is the reference garment for the lower garment.`;
  }

  const promptText =
    `${headerImages}\n\n` +
    `Task: dress the person in Image 1 in the traditional Vietnamese outfit described below. Keep Image 1's face, hairline, skin tone, body proportions, pose and camera angle EXACTLY as they are. Do not beautify, do not slim, do not change the face. If multiple people appear, dress only the person closest to the camera and leave the others unchanged.\n\n` +
    `Outfit:\n` +
    `- Main robe: ${thuongYTen} (${thuongYTenKhongDau}), color ${tenMauTiengViet} ${hexMau}, fabric ${thuongYChatLieu}. Follow the collar structure, front flap line and button placement shown in Image 2 precisely.\n` +
    `- Lower garment: ${haYTen}, color ${haYMau}, fabric ${haYChatLieu}.${hasLowerImage ? ` Follow the structure shown in Image ${lowerImageIndex} precisely.` : ''}\n` +
    `- Headwear: ${thuPhucTen}${hasHeadwearImage ? ', as shown in Image 3.' : `, color ${thuPhucMau}.`}\n\n` +
    `Background: ${moTaBackground}.\n\n` +
    `Photographic direction: waist-up to full-body framing matching Image 1, natural light from one side, realistic fabric weight and drape, visible weave texture, shallow depth of field on the background.\n\n` +
    `Hard constraints:\n` +
    `- No text, no logo, no watermark, no signature anywhere in the image.\n` +
    `- Do not add jewelry, patterns or garments that were not listed above.\n` +
    `- The collar must follow the reference image, not a generic East Asian collar.\n` +
    `- Keep the outfit consistent with a single historical family; do not mix decorative elements from other cultures.`;

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
    `${anhHashDauVao}_${garmentIds}_${opts.background.id}_${opts.chatLuong}`
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
  if (opts.anhTruoc && lastLookExecuted) {
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
  if (ai) {
    try {
      if (opts.chatLuong === 'ky') {
        // --- CHẾ ĐỘ KỸ, HAI LƯỢT ---
        // Lượt 1: Giữ nguyên nền gốc từ Image 1
        const luot1Data = await xayDungPromptVaAnh({
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
        const flatComposite = await taoBanGhepLopPhang(opts.look, opts.background);
        const stampedFlat = await dongDauAnhAI(flatComposite);
        tryOnStats.soLanTheoTangDuPhong.tang3++;
        tryOnStats.soLanDuPhong++;
        return {
          anh: stampedFlat,
          soLuot: 0,
          canhBao: ['Hôm nay đã dùng hết lượt dựng ảnh. Hệ thống chuyển sang bản ghép lớp phẳng.'],
        };
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 4. DỰ PHÒNG BA TẦNG THEO THỨ TỰ NGHIÊM NGẶT
  // ---------------------------------------------------------------------------

  // TẦNG 1: Thử lại 1 lần với prompt bỏ bối cảnh nền, giữ nguyên nền gốc
  if (ai) {
    try {
      tryOnStats.soLanTheoTangDuPhong.tang1++;
      const fallbackPromptData = await xayDungPromptVaAnh({
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
    canhBao.push(
      'Lần này hệ thống chưa dựng được ảnh. Bạn thử ảnh sáng hơn và nền đơn giản hơn, hoặc dùng người mẫu.'
    );

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

    const demoUrl = await dongDauAnhAI(DEMO_RESPONSES.renderLook.imageUrl);
    tryOnStats.tongThoiGianChoMs += Date.now() - startTime;
    luuStats();

    return {
      anh: demoUrl,
      soLuot: 0,
      canhBao,
    };
  } catch (tier2Err) {
    console.warn('[Tang 2 du phong khong thanh cong, tiep tuc xuong Tang 3]:', tier2Err);
  }

  // TẦNG 3: Hiện bản ghép lớp phẳng như cũ, kèm nút thử lại
  tryOnStats.soLanTheoTangDuPhong.tang3++;
  tryOnStats.soLanDuPhong++;

  const flatComposite = await taoBanGhepLopPhang(opts.look, opts.background);
  const stampedFlat = await dongDauAnhAI(flatComposite);

  canhBao.push(
    'Chưa thể sinh ảnh AI lúc này, đây là bản ghép minh họa lớp phẳng.'
  );

  tryOnStats.tongThoiGianChoMs += Date.now() - startTime;
  luuStats();

  return {
    anh: stampedFlat,
    soLuot: 0,
    canhBao,
  };
}
