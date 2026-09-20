/**
 * WARP-AGENT Speedrun Engine
 * Orchestrates 50 tool iterations in ~1.4 seconds using Jev System 1 reflexes.
 */
import { JevSystem1Client } from './jev-client.js';

export class WarpSpeedrunEngine {
  constructor(options = {}) {
    this.client = new JevSystem1Client();
    this.totalSteps = options.totalSteps || 50;
    this.onStep = options.onStep || (() => {});
  }

  async run(task = "Diagnose and fix distributed race condition in microservices") {
    const startTime = Date.now();
    const actions = [];
    let cumulativeLatency = 0;

    for (let step = 1; step <= this.totalSteps; step++) {
      const decision = await this.client.decide({
        task,
        step,
        history: actions.slice(-3),
        tools: ['grep', 'ast_patch', 'lsp_diag', 'run_test', 'git_commit']
      });

      actions.push(decision);
      cumulativeLatency += decision.latencyMs;

      this.onStep({
        step,
        total: this.totalSteps,
        decision,
        elapsedMs: Date.now() - startTime
      });
    }

    const totalElapsedMs = Date.now() - startTime;
    const actionsPerSecond = (this.totalSteps / (totalElapsedMs / 1000)).toFixed(1);
    const costEstimate = (this.totalSteps * 0.000008).toFixed(4);
    const legacyCostEstimate = (this.totalSteps * 0.03).toFixed(2);
    const legacyTimeEstimate = ((this.totalSteps * 3.8)).toFixed(1);

    return {
      task,
      totalSteps: this.totalSteps,
      totalElapsedMs,
      actionsPerSecond,
      avgLatencyMs: (cumulativeLatency / this.totalSteps).toFixed(1),
      costEstimate: `$${costEstimate}`,
      legacyCostEstimate: `$${legacyCostEstimate}`,
      legacyTimeEstimate: `${legacyTimeEstimate}s`,
      speedupFactor: `${((parseFloat(legacyTimeEstimate) * 1000) / totalElapsedMs).toFixed(0)}x`,
      actions
    };
  }
}
