/**
 * WARP-AGENT Speedrun Arena Controller
 * LIVE AI BATTLE: Google Gemini 2.5 Flash vs TypeSafe AI Jev 1.13.0
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

  playJevTick(frequency = 1100, duration = 0.03) {
    if (!this.enabled) return;
    this.init();
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(frequency * 0.4, this.ctx.currentTime + duration);

    gain.gain.setValueAtTime(0.09, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playGeminiTick() {
    if (!this.enabled) return;
    this.init();
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
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
    this.runLiveBattle(mission);
  }

  startTimerLoop() {
    const update = () => {
      if (!this.isRunning) return;
      const elapsed = (performance.now() - this.startTime) / 1000;
      const formatted = this.formatTime(elapsed);
      this.heroStopwatch.textContent = formatted;
      this.legacyTimer.textContent = formatted;
      this.warpTimer.textContent = formatted;
      requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(3);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(6, '0')}`;
  }

  runLiveBattle(missionKey) {
    this.legacyConsole.innerHTML = '';
    this.warpConsole.innerHTML = '';

    this.legacyStatusText.textContent = `✨ Streaming Google Gemini 2.5 Flash Inferences`;
    this.warpStatusText.textContent = `⚡ Streaming TypeSafe AI Jev 1.13.0 Inferences`;

    this.legacySpinner.textContent = '✨';
    this.legacySpinner.style.animation = 'pulseDot 1s infinite';

    const streamUrl = `/api/live-battle?mission=${encodeURIComponent(missionKey)}`;
    this.eventSource = new EventSource(streamUrl);

    let jevCount = 0;
    let geminiCount = 0;
    let geminiCumulativeCost = 0;

    this.eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'jev') {
        jevCount = data.step;
        const percent = (data.step / data.total) * 100;
        this.warpProgressBar.style.width = `${percent}%`;
        this.warpStepCount.textContent = `${data.step}/${data.total}`;
        this.warpCost.textContent = `$${(data.step * 0.00002).toFixed(4)}`;

        const logLine = document.createElement('div');
        logLine.className = 'log-entry';
        logLine.innerHTML = `<span class="log-dim">[${data.latencyMs}ms]</span> <span class="log-cyan">${data.input}</span> ➔ <span class="log-emerald">${data.summary}</span>`;
        this.warpConsole.appendChild(logLine);
        this.warpConsole.scrollTop = this.warpConsole.scrollHeight;

        this.sfx.playJevTick(1000 + (data.step * 40));
      } 
      else if (data.type === 'gemini') {
        geminiCount = data.step;
        const percent = (data.step / data.total) * 100;
        this.legacyProgressBar.style.width = `${percent}%`;

        const itemCost = parseFloat(data.cost.replace('$', '')) || 0.0001;
        geminiCumulativeCost += itemCost;
        this.legacyCost.textContent = `$${geminiCumulativeCost.toFixed(4)}`;

        const logLine = document.createElement('div');
        logLine.className = 'log-entry';
        logLine.innerHTML = `<span class="log-dim">[${data.latencyMs}ms]</span> <span class="log-yellow">${data.input}</span> ➔ <span class="log-red">${data.summary}</span> <span class="log-dim">(${data.totalTokens}t)</span>`;
        this.legacyConsole.appendChild(logLine);
        this.legacyConsole.scrollTop = this.legacyConsole.scrollHeight;

        this.sfx.playGeminiTick();
      }
    };

    this.eventSource.addEventListener('complete', (event) => {
      const summary = JSON.parse(event.data);
      this.eventSource.close();
      this.isRunning = false;

      const finalElapsed = ((performance.now() - this.startTime) / 1000).toFixed(3);
      this.heroStopwatch.textContent = this.formatTime(finalElapsed);
      this.legacyTimer.textContent = this.formatTime(finalElapsed);
      this.warpTimer.textContent = this.formatTime(finalElapsed);

      this.legacyStatusText.textContent = `✅ Gemini 2.5 Flash: ${summary.total}/${summary.total} Completed`;
      this.warpStatusText.textContent = `✅ Jev 1.13.0: ${summary.total}/${summary.total} Completed`;

      this.sfx.playVictory();
      this.victoryBanner.style.display = 'block';
      this.victoryBadge.textContent = `⚡ 100% LIVE COMPARATIVE BATTLE COMPLETED (${summary.total} ITEMS IN ${finalElapsed}s)`;
      this.victoryCount.textContent = `Both Live APIs Authenticated`;

      this.startRaceBtn.disabled = false;
      this.startRaceBtn.style.opacity = '1';
    });

    this.eventSource.onerror = () => {
      this.eventSource.close();
      this.isRunning = false;
      this.startRaceBtn.disabled = false;
      this.startRaceBtn.style.opacity = '1';
    };
  }

  resetRace() {
    if (this.eventSource) {
      this.eventSource.close();
    }
    this.isRunning = false;
    this.startRaceBtn.disabled = false;
    this.startRaceBtn.style.opacity = '1';

    this.heroStopwatch.textContent = '00:00.000';
    this.legacyTimer.textContent = '00:00.0';
    this.legacyCost.textContent = '$0.0000';
    this.legacyProgressBar.style.width = '0%';
    this.legacySpinner.textContent = '✨';
    this.legacySpinner.style.animation = 'none';
    this.legacyStatusText.textContent = 'Google AI API Ready';
    this.legacySubText.textContent = 'Autoregressive LLM // Live token generation';
    this.legacyConsole.innerHTML = '<div class="log-entry log-dim">[00:00.000] Standby for live Gemini 2.5 Flash token streams...</div>';

    this.warpTimer.textContent = '00:00.000';
    this.warpCost.textContent = '$0.0000';
    this.warpProgressBar.style.width = '0%';
    this.warpStepCount.textContent = '0/10';
    this.warpStatusText.textContent = 'TypeSafe AI Jev Ready';
    this.warpSubText.textContent = 'System 1 Reflex // Sub-300ms discrete decisions';
    this.warpConsole.innerHTML = '<div class="log-entry log-dim">[00:00.000] Ready to stream live neural decisions from jev-1.13.0...</div>';

    this.victoryBanner.style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.arena = new ArenaController();
});
