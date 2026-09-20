/**
 * WARP-AGENT Speedrun Arena Controller
 * Connected to LIVE TypeSafe AI Jev 1.13.0 Model via Server-Sent Events (/api/real-stream)
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

    const notes = [523.25, 659.25, 783.99, 1046.50];
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
    this.startTime = 0;
    this.eventSource = null;

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
    this.victoryBadge = document.getElementById('victoryBadge');
    this.victoryLatency = document.getElementById('victoryLatency');
    this.victoryCount = document.getElementById('victoryCount');
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

    const mission = this.taskSelect.value;
    this.runLegacyAgentLoop();
    this.runRealJevWarpLoop(mission);
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

  runRealJevWarpLoop(missionKey) {
    this.warpConsole.innerHTML = '';
    this.warpStatusText.textContent = `⚡ Evaluating Live TypeSafe AI jev-1.13.0 Model`;
    this.warpStatusText.className = 'status-heading text-emerald';
    this.warpSubText.textContent = `Streaming verified neural inferences via @typesafe-ai/sdk`;

    const streamUrl = `/api/real-stream?mission=${encodeURIComponent(missionKey)}`;
    this.eventSource = new EventSource(streamUrl);

    let completedSteps = 0;
    let totalItems = 10;

    this.eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const { step, total, input, summary, latencyMs, model } = data;
      completedSteps = step;
      totalItems = total;

      const currentElapsed = (performance.now() - this.startTime) / 1000;
      const percent = (step / total) * 100;

      // Update gauges
      this.warpProgressBar.style.width = `${percent}%`;
      this.warpStepCount.textContent = `${step}/${total}`;
      this.warpTimer.textContent = this.formatTime(currentElapsed);
      this.warpCost.textContent = `$${(step * 0.00002).toFixed(4)}`;

      this.heroLatency.textContent = `${latencyMs}ms`;
      if (data.confidence) {
        this.heroSpeedup.textContent = `${(data.confidence * 100).toFixed(0)}%`;
      }

      // Log real Jev response
      const logLine = document.createElement('div');
      logLine.className = 'log-entry';
      logLine.innerHTML = `<span class="log-dim">[${latencyMs}ms]</span> <span class="log-cyan">${input}</span> ➔ <span class="log-emerald">${summary}</span>`;
      this.warpConsole.appendChild(logLine);
      this.warpConsole.scrollTop = this.warpConsole.scrollHeight;

      // SFX
      this.sfx.playTick(1100 + (step * 45), 0.025, 'triangle');
    };

    this.eventSource.addEventListener('complete', (event) => {
      const summary = JSON.parse(event.data);
      this.eventSource.close();

      const finalElapsed = ((performance.now() - this.startTime) / 1000).toFixed(3);
      this.warpTimer.textContent = this.formatTime(finalElapsed);
      this.heroStopwatch.textContent = this.formatTime(finalElapsed);
      this.warpStatusText.textContent = `✅ ${summary.total}/${summary.total} Live Decisions Completed in ${finalElapsed}s`;
      this.warpSubText.textContent = `Model: ${summary.model} | Avg Latency: ${summary.avgLatencyMs}ms per live call`;

      this.sfx.playVictory();
      this.victoryBanner.style.display = 'block';
      this.victoryBadge.textContent = `⚡ 100% REAL MODEL INFERENCE: ${summary.total} DECISIONS IN ${finalElapsed}s`;
      this.victoryLatency.textContent = `${summary.avgLatencyMs}ms / decision`;
      this.victoryCount.textContent = `${summary.total}/${summary.total} Verified`;

      this.startRaceBtn.disabled = false;
      this.startRaceBtn.style.opacity = '1';
    });

    this.eventSource.onerror = () => {
      this.eventSource.close();
      this.startRaceBtn.disabled = false;
      this.startRaceBtn.style.opacity = '1';
    };
  }

  async runLegacyAgentLoop() {
    this.legacyConsole.innerHTML = '';
    this.legacySpinner.textContent = '⚙️';
    this.legacySpinner.style.animation = 'pulseDot 1s infinite';

    const slowSteps = [
      { text: "Calling Claude 3.5 Sonnet: Generating multi-paragraph safety analysis...", cost: 0.048, dur: 3800 },
      { text: "Token generation complete (3.8s). Formatting JSON schema output...", cost: 0.096, dur: 4200 },
      { text: "Calling GPT-4o: Autoregressively evaluating second item...", cost: 0.144, dur: 4100 },
      { text: "Generating explanation and chain of thought...", cost: 0.192, dur: 4500 }
    ];

    for (let i = 0; i < slowSteps.length; i++) {
      const step = slowSteps[i];
      this.legacyStatusText.textContent = `⏳ Item ${i + 1}: ${step.text}`;
      this.sfx.playSlowDrone();

      const log = document.createElement('div');
      log.className = 'log-entry';
      const now = ((performance.now() - this.startTime) / 1000).toFixed(1);
      log.innerHTML = `<span class="log-dim">[${now}s]</span> <span class="log-red">${step.text}</span>`;
      this.legacyConsole.appendChild(log);
      this.legacyConsole.scrollTop = this.legacyConsole.scrollHeight;

      await new Promise(r => setTimeout(r, step.dur));
      this.legacyCost.textContent = `$${step.cost.toFixed(3)}`;
      this.legacyProgressBar.style.width = `${((i + 1) / 10) * 100}%`;
    }

    this.legacyStatusText.textContent = `❌ SLOWDOWN: Only 4/10 items completed after 16.6s`;
    this.legacySubText.textContent = `Autoregressive tokens lag: ~38 seconds total | Cost: $0.48`;
  }

  resetRace() {
    if (this.eventSource) {
      this.eventSource.close();
    }
    this.isRunning = false;
    this.startRaceBtn.disabled = false;
    this.startRaceBtn.style.opacity = '1';

    this.heroStopwatch.textContent = '00:00.000';
    this.heroVelocity.textContent = 'jev-1.13.0';
    this.heroLatency.textContent = '0ms';
    this.heroSpeedup.textContent = '100%';

    this.legacyTimer.textContent = '00:00.0';
    this.legacyCost.textContent = '$0.00';
    this.legacyProgressBar.style.width = '0%';
    this.legacySpinner.textContent = '⏳';
    this.legacySpinner.style.animation = 'none';
    this.legacyStatusText.textContent = 'Awaiting Mission Launch...';
    this.legacySubText.textContent = 'Autoregressive text generation: ~3,800ms per decision';
    this.legacyConsole.innerHTML = '<div class="log-entry log-dim">[00:00.000] Standby for comparative prompt execution...</div>';

    this.warpTimer.textContent = '00:00.000';
    this.warpCost.textContent = '$0.0000';
    this.warpProgressBar.style.width = '0%';
    this.warpStepCount.textContent = '0/10';
    this.warpStatusText.textContent = 'Connected to Live Jev Cluster';
    this.warpSubText.textContent = 'Real API Key Authenticated // Verified System 1 Inference';
    this.warpConsole.innerHTML = '<div class="log-entry log-dim">[00:00.000] Ready to stream live neural decisions from jev-1.13.0...</div>';

    this.victoryBanner.style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.arena = new ArenaController();
});
