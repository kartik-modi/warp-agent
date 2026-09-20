#!/usr/bin/env node

/**
 * WARP-AGENT CLI Entry Point
 * ⚡ The world's first 60-FPS autonomous coding agent.
 */
import { WarpSpeedrunEngine } from '../src/speedrun-engine.js';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);
const isUi = args.includes('--ui') || args.includes('studio') || args.includes('--studio');
const isTest = args.includes('--test');
const taskArg = args.filter(a => !a.startsWith('-')).join(' ') || "Isolate & repair race condition in 20 microservices";

if (isUi) {
  console.log('\n🚀 Launching WARP-AGENT Visualizer Studio...');
  const serverScript = path.resolve(__dirname, '../server.js');
  const child = spawn(process.execPath, [serverScript], { stdio: 'inherit' });
  child.on('close', code => process.exit(code));
} else {
  runCliSpeedrun(taskArg, isTest);
}

async function runCliSpeedrun(task, isTestMode) {
  console.log('\x1b[36m%s\x1b[0m', `
  ⚡ ══════════════════════════════════════════════════════════════ ⚡
     W A R P - A G E N T :  6 0 - F P S   A U T O N O M O U S   A G E N T
     Powered by TypeSafe AI Jev System 1 Decision Reflexes
  ⚡ ══════════════════════════════════════════════════════════════ ⚡
  `);

  console.log(`\x1b[33m🎯 TASK:\x1b[0m ${task}`);
  console.log(`\x1b[90m⚡ System 1 Subconscious Decision Engine: INITIALIZED (Target: <35ms/action)\x1b[0m\n`);

  const steps = isTestMode ? 10 : 48;
  const engine = new WarpSpeedrunEngine({
    totalSteps: steps,
    onStep: ({ step, total, decision, elapsedMs }) => {
      const barWidth = 24;
      const filled = Math.round((step / total) * barWidth);
      const bar = '█'.repeat(filled) + '░'.repeat(barWidth - filled);
      const ms = (elapsedMs / 1000).toFixed(3);

      const actionColor = step % 2 === 0 ? '\x1b[32m' : '\x1b[34m';
      process.stdout.write(
        `\r [${bar}] ${step}/${total} | \x1b[35mT+${ms}s\x1b[0m | ${actionColor}${decision.action.padEnd(26)}\x1b[0m -> \x1b[90m${decision.target.padEnd(28)}\x1b[0m (${decision.latencyMs}ms)`
      );
    }
  });

  const result = await engine.run(task);

  console.log('\n\n\x1b[32m%s\x1b[0m', `  ✨ SPEEDRUN FINISHED IN ${(result.totalElapsedMs / 1000).toFixed(3)}s!`);
  console.log('  ─────────────────────────────────────────────────────────');
  console.log(`  ⚡ Actions Executed:       \x1b[1m${result.totalSteps} operations\x1b[0m`);
  console.log(`  🏎️ Action Velocity:        \x1b[32m${result.actionsPerSecond} actions/second (~60 FPS)\x1b[0m`);
  console.log(`  ⏱️ Avg System 1 Latency:   \x1b[36m${result.avgLatencyMs}ms / decision\x1b[0m`);
  console.log(`  💰 Jev Agent Run Cost:     \x1b[32m${result.costEstimate}\x1b[0m`);
  console.log(`  🐌 Legacy LLM Agent Time:  \x1b[31m${result.legacyTimeEstimate}\x1b[0m (Estimated: Claude 3.5 Sonnet / Devin)`);
  console.log(`  💸 Legacy LLM Agent Cost:  \x1b[31m${result.legacyCostEstimate}\x1b[0m`);
  console.log(`  🚀 Net Speedup:            \x1b[1m\x1b[32m${result.speedupFactor} FASTER\x1b[0m`);
  console.log('  ─────────────────────────────────────────────────────────');
  console.log('\x1b[90m  Run with --ui to open the broadcast-ready Visualizer Studio for screen recording.\x1b[0m\n');
}
