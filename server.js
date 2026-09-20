/**
 * Zero-dependency local server for WARP-AGENT Visualizer Studio
 * Features live side-by-side battle: TypeSafe AI jev-1.13.0 vs Google Gemini 2.5 Flash
 */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { REAL_WORLD_MISSIONS } from './src/real-world-suite.js';
import { evaluateWithGemini } from './src/gemini-client.js';

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

  // SSE Live Battle Endpoint (Jev 1.13.0 vs Gemini 2.5 Flash)
  if (url.pathname === '/api/live-battle') {
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

    // Evaluate each item side-by-side
    for (let i = 0; i < total; i++) {
      const item = mission.items[i];

      // Fire both calls simultaneously
      const jevPromise = (async () => {
        const t0 = Date.now();
        const evalRes = await mission.evaluate(item);
        const latency = Date.now() - t0;
        res.write(`data: ${JSON.stringify({
          type: 'jev',
          step: i + 1,
          total,
          input: item.input,
          summary: evalRes.summary,
          choice: evalRes.choice,
          confidence: evalRes.confidence,
          latencyMs: latency,
          model: 'jev-1.13.0',
          elapsedMs: Date.now() - sessionStart
        })}\n\n`);
      })();

      const geminiPromise = (async () => {
        const geminiRes = await evaluateWithGemini(item, missionKey);
        res.write(`data: ${JSON.stringify({
          type: 'gemini',
          step: i + 1,
          total,
          input: item.input,
          summary: geminiRes.summary,
          latencyMs: geminiRes.latencyMs,
          totalTokens: geminiRes.totalTokens,
          cost: geminiRes.cost,
          model: 'gemini-2.5-flash',
          elapsedMs: Date.now() - sessionStart
        })}\n\n`);
      })();

      // Wait for both to complete before moving to next item
      await Promise.all([jevPromise, geminiPromise]);
    }

    res.write(`event: complete\ndata: ${JSON.stringify({
      mission: mission.title,
      total,
      totalElapsedSec: ((Date.now() - sessionStart) / 1000).toFixed(2),
      jevModel: 'jev-1.13.0',
      geminiModel: 'gemini-2.5-flash'
    })}\n\n`);

    res.end();
    return;
  }

  // Static File Serving with Cache-Control: no-cache
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
  console.log(`🧠 Left Panel: \x1b[33mGoogle Gemini 2.5 Flash (LIVE)\x1b[0m`);
  console.log(`⚡ Right Panel: \x1b[32mTypeSafe AI jev-1.13.0 (LIVE)\x1b[0m`);
  console.log(`⚔️ Live Battle Endpoint: /api/live-battle`);
});
