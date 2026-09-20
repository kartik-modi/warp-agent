/**
 * Zero-dependency local server for WARP-AGENT Visualizer Studio
 * Powered by live TypeSafe AI Jev System 1 model (jev-1.13.0)
 */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { REAL_WORLD_MISSIONS } from './src/real-world-suite.js';

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

  // SSE Real-World Live Stream Endpoint
  if (url.pathname === '/api/real-stream') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    const missionKey = url.searchParams.get('mission') || 'terminal_security';
    const mission = REAL_WORLD_MISSIONS[missionKey] || REAL_WORLD_MISSIONS.terminal_security;
    const total = mission.items.length;
    const sessionStart = Date.now();
    let totalLatency = 0;

    for (let i = 0; i < total; i++) {
      const item = mission.items[i];
      const itemStart = Date.now();
      try {
        const evalResult = await mission.evaluate(item);
        const latency = Date.now() - itemStart;
        totalLatency += latency;

        const payload = {
          step: i + 1,
          total,
          input: item.input,
          desc: item.desc,
          summary: evalResult.summary,
          choice: evalResult.choice,
          confidence: evalResult.confidence,
          model: evalResult.model || 'jev-1.13.0',
          latencyMs: latency,
          sessionElapsedMs: Date.now() - sessionStart
        };

        res.write(`data: ${JSON.stringify(payload)}\n\n`);
      } catch (err) {
        res.write(`data: ${JSON.stringify({
          step: i + 1,
          total,
          input: item.input,
          summary: `API Error: ${err.message}`,
          latencyMs: Date.now() - itemStart,
          error: true
        })}\n\n`);
      }
    }

    const avgLatency = (totalLatency / total).toFixed(0);
    const totalElapsed = ((Date.now() - sessionStart) / 1000).toFixed(2);
    res.write(`event: complete\ndata: ${JSON.stringify({
      mission: mission.title,
      total,
      totalElapsedSec: totalElapsed,
      avgLatencyMs: avgLatency,
      model: 'jev-1.13.0'
    })}\n\n`);

    res.end();
    return;
  }

  // Static File Serving with Cache-Control: no-cache for instant live updates
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

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  const studioUrl = `http://localhost:${PORT}`;
  console.log(`\n⚡ WARP-AGENT Visualizer Studio live at: \x1b[36m${studioUrl}\x1b[0m`);
  console.log(`🧠 Connected to LIVE TypeSafe AI model: \x1b[32mjev-1.13.0\x1b[0m`);
  console.log(`🧪 Real-world test suite ready at: /api/real-stream`);
});
