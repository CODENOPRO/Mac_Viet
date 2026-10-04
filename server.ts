import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const distPath = path.join(__dirname, 'dist');

// Cloud Run health check endpoint
app.get('/healthz', (_req, res) => {
  res.status(200).send('OK');
});

// Serve static assets from Vite build output
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// Single Page Application fallback: any unrecognized route serves index.html
app.get('*', (_req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).send('<!DOCTYPE html><html><body><h1>Đang khởi động Mặc Việt...</h1></body></html>');
  }
});

// In Cloud Run with AI Studio base image, Nginx listens on 8080 and proxies to 3000.
// If process.env.PORT is 8080, Nginx is already bound to 8080, so the Node server must listen on 3000.
// If process.env.PORT is any other port (e.g. custom or direct container without Nginx), use it.
const defaultPort = 3000;
const envPort = process.env.PORT ? Number(process.env.PORT) : defaultPort;
const initialPort = envPort === 8080 ? defaultPort : envPort;

function startServer(portToListen: number) {
  const server = app.listen(portToListen, '0.0.0.0', () => {
    console.log(`[Mặc Việt] Máy chủ sản xuất đang lắng nghe tại http://0.0.0.0:${portToListen}`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE' && portToListen !== defaultPort) {
      console.warn(`[Mặc Việt] Cổng ${portToListen} đã được sử dụng (ví dụ bởi Nginx proxy). Chuyển về cổng ${defaultPort}...`);
      startServer(defaultPort);
    } else {
      console.error('[Mặc Việt] Lỗi máy chủ:', err);
      process.exit(1);
    }
  });

  // Graceful shutdown
  const shutdown = () => {
    server.close(() => {
      process.exit(0);
    });
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer(initialPort);
