/**
 * Live Google Gemini 2.5 Flash Client for WARP-AGENT Comparative Battle
 */
import './env.js';
import https from 'https';

const GEMINI_KEY = process.env.GEMINI_API_KEY;

export async function evaluateWithGemini(item, missionType = 'terminal_security') {
  const start = Date.now();
  let prompt = `You are a security auditor. Evaluate this command: "${item.input}". Explain in 1 short sentence why it is safe, warning, or critical, and declare ALLOW, CONFIRM, or BLOCK.`;

  if (missionType === 'sports_arbitrage') {
    prompt = `You are a sports betting analyst. Evaluate in-play match state: "${item.input}". Explain in 1 short sentence the win probability and market volatility.`;
  } else if (missionType === 'compiler_healer') {
    prompt = `You are a TypeScript compiler expert. Evaluate diagnostic: "${item.input}". Explain in 1 short sentence the AST fix needed.`;
  }

  const payload = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      maxOutputTokens: 60,
      temperature: 0.1
    }
  });

  return new Promise((resolve) => {
    if (!GEMINI_KEY) {
      return resolve({
        summary: 'GEMINI_API_KEY not configured in .env',
        latencyMs: 0,
        totalTokens: 0,
        cost: '$0.0000',
        model: 'gemini-2.5-flash (no key)'
      });
    }

    const req = https.request(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: 10000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const elapsed = Date.now() - start;
          const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'Analysis completed';
          const tokens = parsed.usageMetadata?.totalTokenCount || 45;
          const cost = ((tokens / 1000000) * 0.10).toFixed(6);

          resolve({
            summary: text.replace(/\n+/g, ' ').slice(0, 95),
            latencyMs: elapsed,
            totalTokens: tokens,
            cost: `$${cost}`,
            model: 'gemini-2.5-flash'
          });
        } catch (e) {
          resolve({
            summary: 'Error parsing Gemini response',
            latencyMs: Date.now() - start,
            totalTokens: 0,
            cost: '$0.0000',
            model: 'gemini-2.5-flash'
          });
        }
      });
    });

    req.on('error', (err) => {
      resolve({
        summary: `Network error: ${err.message}`,
        latencyMs: Date.now() - start,
        totalTokens: 0,
        cost: '$0.0000',
        model: 'gemini-2.5-flash'
      });
    });

    req.write(payload);
    req.end();
  });
}
