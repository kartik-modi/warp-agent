/**
 * Zero-dependency local server for WARP-AGENT Visualizer Studio
 */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { WarpSpeedrunEngine } from './src/speedrun-engine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.join(__dirname, 'public');
const PORT = process.env.PORT || 3333;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // SSE Speedrun Stream Endpoint
  if (url.pathname === '/api/stream') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    const task = url.searchParams.get('task') || "Isolate & repair race condition in 20 microservices";
    const engine = new WarpSpeedrunEngine({
      totalSteps: 48,
      onStep: (data) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      }
    });

    const summary = await engine.run(task);
    res.write(`event: complete\ndata: ${JSON.stringify(summary)}\n\n`);
    res.end();
    return;
  }

  // Static File Serving
  let filePath = path.join(PUBLIC_DIR, url.pathname === '/' ? 'index.html' : url.pathname);
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('404 Not Found');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  const studioUrl = `http://localhost:${PORT}`;
  console.log(`\n⚡ WARP-AGENT Visualizer Studio live at: \x1b[36m${studioUrl}\x1b[0m`);
  console.log(`🎥 Ready for screen recording with floating webcam & audio visualizer.`);

  // Auto-open in default browser on macOS
  if (process.platform === 'darwin') {
    exec(`open "${studioUrl}"`);
  }
});
