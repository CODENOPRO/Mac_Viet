/**
 * MẶC VIỆT · TRY-ON GUARD & WATERMARK ENGINE
 * Bộ kiểm định kỹ thuật & bảo vệ ranh giới văn hoá cho tính năng Mặc Thử
 */

// =============================================================================
// 1. QUẢN LÝ HẠN MỨC DỰNG ẢNH TRONG NGÀY (LƯU LOCALSTORAGE)
// =============================================================================

export interface DailyTryOnQuota {
  date: string; // YYYY-MM-DD
  countNhanh: number;
  countKy: number;
  totalCount: number;
}

const getTodayKey = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `macviet_tryon_quota_${year}-${month}-${day}`;
};

export const SOFT_QUOTA_THRESHOLD = 20; // Ngưỡng mềm trong ngày
export const KY_QUOTA_LIMIT = 2; // Chế độ Kỹ tính tối đa 2 lượt / ngày

export function getDailyQuota(): DailyTryOnQuota {
  const dateKey = getTodayKey();
  const defaultQuota: DailyTryOnQuota = {
    date: dateKey,
    countNhanh: 0,
    countKy: 0,
    totalCount: 0,
  };

  if (typeof window === 'undefined') return defaultQuota;
  try {
    const raw = localStorage.getItem(dateKey);
    if (!raw) return defaultQuota;
    return JSON.parse(raw);
  } catch {
    return defaultQuota;
  }
}

export function recordTryOnUsage(quality: 'nhanh' | 'ky'): DailyTryOnQuota {
  const dateKey = getTodayKey();
  const current = getDailyQuota();

  if (quality === 'ky') {
    current.countKy += 1;
  } else {
    current.countNhanh += 1;
  }
  current.totalCount = current.countNhanh + current.countKy;

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(dateKey, JSON.stringify(current));
    } catch {
      // Bỏ qua lỗi quota localStorage
    }
  }
  return current;
}

// =============================================================================
// 2. KIỂM TRA CHẤT LƯỢNG ẢNH ĐẦU VÀO TRÊN CANVAS (ĐỘ SÁNG VÀ KÍCH THƯỚC)
// =============================================================================

export interface ImageQualityCheck {
  width: number;
  height: number;
  avgLuminance: number; // 0..255
  isTooSmall: boolean;
  isTooDark: boolean;
  canProceed: boolean;
  warningMessage: string | null;
}

export async function checkImageQuality(dataUrl: string): Promise<ImageQualityCheck> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      return resolve({
        width: 800,
        height: 1000,
        avgLuminance: 120,
        isTooSmall: false,
        isTooDark: false,
        canProceed: true,
        warningMessage: null,
      });
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;

      // Kích thước quá nhỏ (dưới 320x400)
      const isTooSmall = width < 320 || height < 400;

      // Đo độ sáng trung bình qua canvas thu nhỏ (100x100 để tính nhanh)
      const sampleCanvas = document.createElement('canvas');
      sampleCanvas.width = 100;
      sampleCanvas.height = 100;
      const ctx = sampleCanvas.getContext('2d');

      let avgLuminance = 128;
      let isTooDark = false;

      if (ctx) {
        ctx.drawImage(img, 0, 0, 100, 100);
        try {
          const imageData = ctx.getImageData(0, 0, 100, 100);
          const data = imageData.data;
          let totalLuminance = 0;
          const pixelCount = data.length / 4;

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            // Công thức độ chói tiêu chuẩn sRGB: Y = 0.299*R + 0.587*G + 0.114*B
            totalLuminance += 0.299 * r + 0.587 * g + 0.114 * b;
          }
          avgLuminance = Math.round(totalLuminance / pixelCount);
          // Ngưỡng tối: dưới 42/255 là quá thiếu sáng
          isTooDark = avgLuminance < 42;
        } catch {
          // Bỏ qua lỗi CORS nếu có
        }
      }

      let warningMessage: string | null = null;
      if (isTooDark && isTooSmall) {
        warningMessage =
          'Ảnh chụp có vẻ hơi tối và kích thước nhỏ. AI có thể khó giữ nét các chi tiết tà áo và khuôn mặt.';
      } else if (isTooDark) {
        warningMessage =
          'Ảnh chụp thiếu sáng (độ sáng trung bình thấp). Bạn nên chụp nơi có ánh sáng tự nhiên để màu áo lên chuẩn nhất.';
      } else if (isTooSmall) {
        warningMessage =
          'Kích thước ảnh khá nhỏ. Chi tiết hoa văn và nếp vải có thể không sắc nét bằng ảnh rõ gốc.';
      }

      resolve({
        width,
        height,
        avgLuminance,
        isTooSmall,
        isTooDark,
        canProceed: true, // Vẫn cho phép gửi nếu người dùng muốn
        warningMessage,
      });
    };

    img.onerror = () => {
      resolve({
        width: 0,
        height: 0,
        avgLuminance: 128,
        isTooSmall: false,
        isTooDark: false,
        canProceed: true,
        warningMessage: null,
      });
    };

    img.src = dataUrl;
  });
}

// =============================================================================
// 3. ĐÓNG DẤU "ANH DO AI TAO" TRỰC TIẾP VÀO CANVAS (GÓC DƯỚI PHẢI)
// =============================================================================

export function applyWatermarkToCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  // Kích thước chữ theo tỉ lệ khung hình
  const fontSize = Math.max(11, Math.min(16, Math.round(width * 0.024)));
  const padX = Math.round(fontSize * 0.85);
  const padY = Math.round(fontSize * 0.45);
  const text = 'ANH DO AI TAO';

  ctx.save();
  ctx.font = `${fontSize}px "JetBrains Mono", monospace`;
  const textMetrics = ctx.measureText(text);
  const textWidth = textMetrics.width;

  const badgeW = textWidth + padX * 2;
  const badgeH = fontSize + padY * 2;

  // ĐẶT Ở GÓC DƯỚI PHẢI (BOTTOM-RIGHT) CÁCH LỀ 4%
  const marginX = Math.round(width * 0.04);
  const marginY = Math.round(height * 0.04);
  const posX = width - badgeW - marginX;
  const posY = height - badgeH - marginY;

  // Dải mờ nền tối #0D1826 bán trong suốt (alpha 0.88)
  ctx.fillStyle = 'rgba(13, 24, 38, 0.88)';
  ctx.fillRect(posX, posY, badgeW, badgeH);

  // Viền kim loại mảnh #C39A27
  ctx.strokeStyle = '#C39A27';
  ctx.lineWidth = Math.max(1, Math.round(fontSize * 0.08));
  ctx.strokeRect(posX, posY, badgeW, badgeH);

  // Chữ ngà #F2EDE3 đanh gọn
  ctx.fillStyle = '#F2EDE3';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText(text, posX + padX, posY + badgeH / 2);

  ctx.restore();
}

/**
 * Xuất file ảnh với dấu watermark chắc chắn trước khi tải về
 */
export async function exportStampedImage(
  dataUrl: string,
  fileName: string = 'mac-viet-look.jpg'
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return resolve();

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Khong the khoi tao canvas 2D'));
      }

      // Vẽ ảnh
      ctx.drawImage(img, 0, 0);

      // Đóng dấu góc dưới phải
      applyWatermarkToCanvas(ctx, canvas.width, canvas.height);

      // Tải về
      canvas.toBlob(
        (blob) => {
          if (!blob) return resolve();
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          resolve();
        },
        'image/jpeg',
        0.95
      );
    };

    img.onerror = () => reject(new Error('Khong the load anh de dong dau'));
    img.src = dataUrl;
  });
}

/**
 * Xuất Poster Look Card hoàn chỉnh với dấu watermark góc dưới phải trực tiếp trên canvas
 */
export async function exportLookCardPoster(opts: {
  tenLook: string;
  caption: string;
  imageDataUrl: string;
  sixLayersText: string;
  mauChinh: string;
  suKien: string;
  scoreMau: number;
}): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return resolve();

    const posterW = 900;
    const posterH = 1200;
    const canvas = document.createElement('canvas');
    canvas.width = posterW;
    canvas.height = posterH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return reject(new Error('Khong the tao canvas'));

    // 1. Nền ngà #F2EDE3
    ctx.fillStyle = '#F2EDE3';
    ctx.fillRect(0, 0, posterW, posterH);

    // 2. Khung viền kép kim loại & chàm
    ctx.strokeStyle = '#16243A';
    ctx.lineWidth = 6;
    ctx.strokeRect(30, 30, posterW - 60, posterH - 60);

    ctx.strokeStyle = '#C39A27';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(38, 38, posterW - 76, posterH - 76);

    // 3. Header
    ctx.fillStyle = '#A8322A';
    ctx.font = '14px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('MAC VIET · VIETNAMESE ATTIRE ARCHIVE', posterW / 2, 85);

    ctx.fillStyle = '#16243A';
    ctx.font = 'normal 42px "Fraunces", Georgia, serif';
    ctx.fillText(opts.tenLook, posterW / 2, 140);

    ctx.fillStyle = '#6E5439';
    ctx.font = 'italic 16px "Be Vietnam Pro", sans-serif';
    ctx.fillText(`"${opts.caption}"`, posterW / 2, 180);

    // 4. Vẽ ảnh trang phục ở giữa
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const imgW = 480;
      const imgH = 640;
      const imgX = (posterW - imgW) / 2;
      const imgY = 220;

      // Khung viền ảnh
      ctx.strokeStyle = '#C39A27';
      ctx.lineWidth = 2;
      ctx.strokeRect(imgX - 2, imgY - 2, imgW + 4, imgH + 4);

      // Ảnh
      ctx.drawImage(img, imgX, imgY, imgW, imgH);

      // 5. Thông tin chi tiết bên dưới
      ctx.fillStyle = '#2C2A26';
      ctx.font = '14px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(opts.sixLayersText, posterW / 2, 920);

      // Ba thẻ thông số
      const tagY = 970;
      ctx.font = '13px "JetBrains Mono", monospace';
      ctx.fillStyle = '#6E5439';
      ctx.fillText(
        `MÀU CHÍNH: ${opts.mauChinh}  |  HÀI HOÀ: ${opts.scoreMau}/100  |  BỐI CẢNH: ${opts.suKien}`,
        posterW / 2,
        tagY
      );

      // Lời kết trang trọng
      ctx.fillStyle = '#A8322A';
      ctx.font = '12px "Be Vietnam Pro", sans-serif';
      ctx.fillText('Bản in đối soát khảo cứu y phục truyền thống Việt Nam', posterW / 2, 1080);

      // 6. ĐÓNG DẤU "ANH DO AI TAO" TRỰC TIẾP VÀO GÓC DƯỚI PHẢI CANVAS POSTER (MỤC 4)
      applyWatermarkToCanvas(ctx, posterW, posterH);

      // Xuất file
      canvas.toBlob(
        (blob) => {
          if (!blob) return resolve();
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `mac-viet-poster-${opts.tenLook.toLowerCase().replace(/\s+/g, '-')}.jpg`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          resolve();
        },
        'image/jpeg',
        0.95
      );
    };

    img.onerror = () => {
      // Nếu load ảnh lỗi thì vẫn đóng dấu và xuất poster
      applyWatermarkToCanvas(ctx, posterW, posterH);
      resolve();
    };

    img.src = opts.imageDataUrl;
  });
}
