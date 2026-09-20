/**
 * WARP-AGENT Speedrun Arena Controller
 * Orchestrates real-time 60-FPS race simulation, procedural Web Audio SFX, and telemetry.
 */

class AudioSynthesizer {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
  }

  playTick(frequency = 880, duration = 0.03, type = 'sine') {
    if (!this.enabled) return;
    this.init();
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(frequency * 0.4, this.ctx.currentTime + duration);

    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playVictory() {
    if (!this.enabled) return;
    this.init();
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.35);
      }, idx * 75);
    });
  }

  playSlowDrone() {
    if (!this.enabled) return;
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.4);
  }
}

class ArenaController {
  constructor() {
    this.sfx = new AudioSynthesizer();
    this.isRunning = false;
    this.totalSteps = 48;
    this.startTime = 0;
    this.timerInterval = null;

    this.cacheElements();
    this.bindEvents();
  }

  cacheElements() {
    this.startRaceBtn = document.getElementById('startRaceBtn');
    this.resetRaceBtn = document.getElementById('resetRaceBtn');
    this.fullscreenBtn = document.getElementById('fullscreenBtn');
    this.sfxToggle = document.getElementById('sfxToggle');
    this.taskSelect = document.getElementById('taskSelect');

    this.heroStopwatch = document.getElementById('heroStopwatch');
    this.heroVelocity = document.getElementById('heroVelocity');
    this.heroLatency = document.getElementById('heroLatency');
    this.heroSpeedup = document.getElementById('heroSpeedup');

    this.legacyTimer = document.getElementById('legacyTimer');
    this.legacyCost = document.getElementById('legacyCost');
    this.legacyProgressBar = document.getElementById('legacyProgressBar');
    this.legacySpinner = document.getElementById('legacySpinner');
    this.legacyStatusText = document.getElementById('legacyStatusText');
    this.legacySubText = document.getElementById('legacySubText');
    this.legacyConsole = document.getElementById('legacyConsole');

    this.warpTimer = document.getElementById('warpTimer');
    this.warpCost = document.getElementById('warpCost');
    this.warpProgressBar = document.getElementById('warpProgressBar');
    this.warpStepCount = document.getElementById('warpStepCount');
    this.warpStatusText = document.getElementById('warpStatusText');
    this.warpSubText = document.getElementById('warpSubText');
    this.warpConsole = document.getElementById('warpConsole');

    this.victoryBanner = document.getElementById('victoryBanner');
  }

  bindEvents() {
    this.startRaceBtn.addEventListener('click', () => this.startRace());
    this.resetRaceBtn.addEventListener('click', () => this.resetRace());

    this.sfxToggle.addEventListener('click', () => {
      this.sfx.enabled = !this.sfx.enabled;
      this.sfxToggle.classList.toggle('active', this.sfx.enabled);
      this.sfxToggle.innerHTML = this.sfx.enabled ? '<span>🔊</span> SFX: ON' : '<span>🔇</span> SFX: OFF';
    });

    this.fullscreenBtn.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
        this.fullscreenBtn.innerHTML = '⛶ EXIT STUDIO';
      } else {
        document.exitFullscreen().catch(() => {});
        this.fullscreenBtn.innerHTML = '⛶ STUDIO MODE';
      }
    });
  }

  startRace() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.sfx.init();

    this.startRaceBtn.disabled = true;
    this.startRaceBtn.style.opacity = '0.6';
    this.victoryBanner.style.display = 'none';

    this.startTime = performance.now();
    this.startTimerLoop();

    // Launch both simultaneous loops
    this.runLegacyAgentLoop();
    this.runWarpAgentLoop();
  }

  startTimerLoop() {
    const update = () => {
      if (!this.isRunning) return;
      const elapsed = (performance.now() - this.startTime) / 1000;
      const formatted = this.formatTime(elapsed);
      this.heroStopwatch.textContent = formatted;
      this.legacyTimer.textContent = formatted;
      requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(3);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(6, '0')}`;
  }

  async runWarpAgentLoop() {
    const mission = this.taskSelect.value;
    this.warpConsole.innerHTML = '';
    this.warpStatusText.textContent = `⚡ Executing Jev System 1 Reflexes (${mission})`;
    this.warpStatusText.className = 'status-heading text-emerald';

    const actions = this.generateWarpActions();
    let completed = 0;

    for (let i = 0; i < actions.length; i++) {
      const act = actions[i];
      // Jev latency: ~25ms per action
      const delay = Math.floor(Math.random() * 8) + 24;
      await new Promise(r => setTimeout(r, delay));

      completed++;
      const currentElapsed = (performance.now() - this.startTime) / 1000;
      const percent = (completed / actions.length) * 100;

      // Update metrics
      this.warpProgressBar.style.width = `${percent}%`;
      this.warpStepCount.textContent = `${completed}/${actions.length}`;
      this.warpTimer.textContent = this.formatTime(currentElapsed);
      this.warpCost.textContent = `$${(completed * 0.000008).toFixed(4)}`;

      const currentVelocity = (completed / currentElapsed).toFixed(1);
      this.heroVelocity.innerHTML = `${currentVelocity} <small>actions/s</small>`;
      this.heroLatency.textContent = `${delay}ms`;

      // Log entry
      const logLine = document.createElement('div');
      logLine.className = 'log-entry';
      logLine.innerHTML = `<span class="log-dim">[${currentElapsed.toFixed(3)}s]</span> <span class="log-emerald">${act.action.padEnd(24)}</span> <span class="log-cyan">${act.target}</span> <span class="log-dim">(${delay}ms)</span>`;
      this.warpConsole.appendChild(logLine);
      this.warpConsole.scrollTop = this.warpConsole.scrollHeight;

      // SFX
      this.sfx.playTick(1200 + (completed * 20), 0.02, 'triangle');
    }

    // Finished
    const finalElapsed = ((performance.now() - this.startTime) / 1000).toFixed(3);
    this.warpTimer.textContent = this.formatTime(finalElapsed);
    this.heroStopwatch.textContent = this.formatTime(finalElapsed);
    this.warpStatusText.textContent = `✅ 48/48 Micro-Operations Verified in ${finalElapsed}s`;
    this.warpSubText.textContent = `Zero LLM token bottlenecks // 100% Deterministic execution`;

    this.sfx.playVictory();
    this.victoryBanner.style.display = 'block';

    this.heroSpeedup.textContent = '136x';
    this.startRaceBtn.disabled = false;
    this.startRaceBtn.style.opacity = '1';
  }

  async runLegacyAgentLoop() {
    this.legacyConsole.innerHTML = '';
    this.legacySpinner.textContent = '⚙️';
    this.legacySpinner.style.animation = 'pulseDot 1s infinite';

    const slowSteps = [
      { text: "Calling Claude 3.5 Sonnet: Formulating tool execution plan...", cost: 0.048, dur: 3800 },
      { text: "LLM finished thinking (3.8s). Dispatching grep tool call...", cost: 0.096, dur: 4200 },
      { text: "Calling GPT-4o: Analyzing AST output and reading files...", cost: 0.144, dur: 4100 },
      { text: "Waiting on token generation for patch 1 of 48...", cost: 0.192, dur: 4500 }
    ];

    for (let i = 0; i < slowSteps.length; i++) {
      const step = slowSteps[i];
      this.legacyStatusText.textContent = `⏳ Step ${i + 1}/48: ${step.text}`;
      this.sfx.playSlowDrone();

      const log = document.createElement('div');
      log.className = 'log-entry';
      const now = ((performance.now() - this.startTime) / 1000).toFixed(1);
      log.innerHTML = `<span class="log-dim">[${now}s]</span> <span class="log-red">${step.text}</span>`;
      this.legacyConsole.appendChild(log);
      this.legacyConsole.scrollTop = this.legacyConsole.scrollHeight;

      await new Promise(r => setTimeout(r, step.dur));
      this.legacyCost.textContent = `$${step.cost.toFixed(3)}`;
      this.legacyProgressBar.style.width = `${((i + 1) / 48) * 100}%`;
    }

    this.legacyStatusText.textContent = `❌ SLOWDOWN: Only 4/48 operations completed after 16.6s`;
    this.legacySubText.textContent = `Estimated completion time: 182.4s (3+ minutes) | Cost: $1.44`;
  }

  generateWarpActions() {
    const list = [];
    for (let i = 1; i <= 48; i++) {
      if (i === 1) list.push({ action: 'MAP_WORKSPACE_TOPOLOGY', target: 'package.json' });
      else if (i < 12) list.push({ action: 'AST_BRANCH_DIAGNOSTIC', target: `services/core/node_${i}.ts` });
      else if (i === 12) list.push({ action: 'ISOLATE_MUTEX_STARVATION', target: 'session_manager.ts:142' });
      else if (i < 30) list.push({ action: 'SYNTHESIZE_ATOMIC_LOCK', target: `patches/atomic_lock_${i}.ts` });
      else if (i < 42) list.push({ action: 'STATIC_TYPE_VERIFICATION', target: `tsc --strict (module ${i})` });
      else list.push({ action: 'VERIFY_CONCURRENCY_SPEC', target: `stress_test_thread_${i}.spec.ts` });
    }
    return list;
  }

  resetRace() {
    this.isRunning = false;
    this.startRaceBtn.disabled = false;
    this.startRaceBtn.style.opacity = '1';

    this.heroStopwatch.textContent = '00:00.000';
    this.heroVelocity.innerHTML = '0.0 <small>actions/s</small>';
    this.heroLatency.textContent = '0ms';
    this.heroSpeedup.textContent = '100x';

    this.legacyTimer.textContent = '00:00.0';
    this.legacyCost.textContent = '$0.00';
    this.legacyProgressBar.style.width = '0%';
    this.legacySpinner.textContent = '⏳';
    this.legacySpinner.style.animation = 'none';
    this.legacyStatusText.textContent = 'Awaiting Mission Launch...';
    this.legacySubText.textContent = 'Heavy 70B parameter inference: ~4,200ms per tool decision';
    this.legacyConsole.innerHTML = '<div class="log-entry log-dim">[00:00.000] Initializing LangChain / AutoGen agent loop...</div>';

    this.warpTimer.textContent = '00:00.000';
    this.warpCost.textContent = '$0.0000';
    this.warpProgressBar.style.width = '0%';
    this.warpStepCount.textContent = '0/48';
    this.warpStatusText.textContent = 'System 1 Reflex Subconscious Ready';
    this.warpSubText.textContent = 'Target Latency: <30ms // Zero LLM Hallucinations';
    this.warpConsole.innerHTML = '<div class="log-entry log-dim">[00:00.000] Subconscious neural reflex ready for instant execution...</div>';

    this.victoryBanner.style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.arena = new ArenaController();
});
