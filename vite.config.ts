import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(() => {
  // Vercel tự đặt biến VERCEL=1 khi build. Trên Vercel tuyệt đối không nhúng khoá vào mã trình duyệt:
  // khoá GEMINI_API_KEY chỉ được đọc ở hàm trung gian api/gemini.ts phía máy chủ.
  const laVercel = Boolean(process.env.VERCEL);
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(laVercel ? '' : process.env.GEMINI_API_KEY || ''),
      __GEMINI_QUA_PROXY__: JSON.stringify(laVercel),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
