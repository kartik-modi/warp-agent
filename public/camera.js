/**
 * Camera Bubble & Audio-Reactive Voice Ring Visualizer
 * Streams user's webcam and animates an audio visualizer ring based on voice input.
 */

class CameraStudio {
  constructor() {
    this.videoEl = document.getElementById('webcamVideo');
    this.canvasEl = document.getElementById('audioVisualizerRing');
    this.ctx = this.canvasEl ? this.canvasEl.getContext('2d') : null;
    this.placeholderEl = document.getElementById('cameraPlaceholder');
    this.dockEl = document.getElementById('cameraDock');
    
    this.camToggleBtn = document.getElementById('camToggleBtn');
    this.micToggleBtn = document.getElementById('micToggleBtn');
    this.dockCycleBtn = document.getElementById('dockCycleBtn');

    this.stream = null;
    this.audioCtx = null;
    this.analyser = null;
    this.dataArray = null;
    this.isCamActive = false;
    this.isMicActive = true;
    this.dockPositions = ['dock-bottom-right', 'dock-bottom-left', 'dock-top-right'];
    this.currentDockIndex = 0;

    this.initListeners();
    this.startSimulatedRing(); // subtle glow before mic permission
  }

  initListeners() {
    if (this.placeholderEl) {
      this.placeholderEl.addEventListener('click', () => this.enableWebcam());
    }
    if (this.camToggleBtn) {
      this.camToggleBtn.addEventListener('click', () => this.toggleWebcam());
    }
    if (this.micToggleBtn) {
      this.micToggleBtn.addEventListener('click', () => this.toggleMic());
    }
    if (this.dockCycleBtn) {
      this.dockCycleBtn.addEventListener('click', () => this.cycleDockPosition());
    }
  }

  async enableWebcam() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true
      });

      this.videoEl.srcObject = this.stream;
      this.isCamActive = true;
      if (this.placeholderEl) this.placeholderEl.style.display = 'none';
      if (this.camToggleBtn) this.camToggleBtn.classList.add('active');

      this.initAudioVisualizer(this.stream);
    } catch (err) {
      console.warn('Webcam permission not granted or device unavailable:', err);
      if (this.placeholderEl) {
        this.placeholderEl.querySelector('.cam-hint').textContent = 'Camera Off (Click to Retry)';
      }
    }
  }

  toggleWebcam() {
    if (!this.stream) {
      this.enableWebcam();
      return;
    }
    const videoTrack = this.stream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      this.isCamActive = videoTrack.enabled;
      this.camToggleBtn.classList.toggle('active', this.isCamActive);
      this.placeholderEl.style.display = this.isCamActive ? 'none' : 'flex';
    }
  }

  toggleMic() {
    if (!this.stream) return;
    const audioTrack = this.stream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      this.isMicActive = audioTrack.enabled;
      this.micToggleBtn.classList.toggle('active', this.isMicActive);
    }
  }

  cycleDockPosition() {
    this.dockEl.classList.remove(this.dockPositions[this.currentDockIndex]);
    this.currentDockIndex = (this.currentDockIndex + 1) % this.dockPositions.length;
    this.dockEl.classList.add(this.dockPositions[this.currentDockIndex]);
  }

  initAudioVisualizer(stream) {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();
      const source = this.audioCtx.createMediaStreamSource(stream);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 64;
      source.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);

      this.drawAudioRing();
    } catch (e) {
      console.warn('Web Audio Analyser not supported:', e);
    }
  }

  drawAudioRing() {
    if (!this.ctx || !this.analyser) return;

    requestAnimationFrame(() => this.drawAudioRing());

    this.analyser.getByteFrequencyData(this.dataArray);

    const width = this.canvasEl.width;
    const height = this.canvasEl.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const baseRadius = 96;

    this.ctx.clearRect(0, 0, width, height);

    // Calculate volume level from audio bins
    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      sum += this.dataArray[i];
    }
    const avg = sum / this.dataArray.length; // 0 to 255
    const volumeMultiplier = this.isMicActive ? (avg / 255) : 0;

    // Draw audio-reactive radial spikes
    const numBars = 32;
    const angleStep = (Math.PI * 2) / numBars;

    for (let i = 0; i < numBars; i++) {
      const angle = i * angleStep;
      const binIndex = i % this.dataArray.length;
      const val = this.isMicActive ? (this.dataArray[binIndex] / 255) : (Math.sin(Date.now() * 0.003 + i) * 0.1 + 0.1);
      const spikeLength = Math.max(3, val * 22);

      const x1 = centerX + Math.cos(angle) * (baseRadius);
      const y1 = centerY + Math.sin(angle) * (baseRadius);
      const x2 = centerX + Math.cos(angle) * (baseRadius + spikeLength);
      const y2 = centerY + Math.sin(angle) * (baseRadius + spikeLength);

      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      this.ctx.lineWidth = 3;
      this.ctx.lineCap = 'round';
      
      // Color shifts from cyan to emerald based on voice loudness
      this.ctx.strokeStyle = volumeMultiplier > 0.35 
        ? `rgba(0, 255, 136, ${Math.min(1, 0.4 + val)})`
        : `rgba(0, 240, 255, ${Math.min(1, 0.3 + val)})`;

      this.ctx.stroke();
    }
  }

  startSimulatedRing() {
    // Idle glowing pulse before camera stream connects
    const renderIdle = () => {
      if (this.analyser) return; // Don't run once real audio is connected
      if (!this.ctx) return;

      const width = this.canvasEl.width;
      const height = this.canvasEl.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const baseRadius = 96;

      this.ctx.clearRect(0, 0, width, height);

      const numBars = 32;
      const angleStep = (Math.PI * 2) / numBars;
      const t = Date.now() * 0.002;

      for (let i = 0; i < numBars; i++) {
        const angle = i * angleStep;
        const val = (Math.sin(t + i * 0.4) + 1) * 0.5;
        const spikeLength = 3 + val * 6;

        const x1 = centerX + Math.cos(angle) * baseRadius;
        const y1 = centerY + Math.sin(angle) * baseRadius;
        const x2 = centerX + Math.cos(angle) * (baseRadius + spikeLength);
        const y2 = centerY + Math.sin(angle) * (baseRadius + spikeLength);

        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.lineWidth = 2;
        this.ctx.lineCap = 'round';
        this.ctx.strokeStyle = `rgba(0, 240, 255, ${0.2 + val * 0.4})`;
        this.ctx.stroke();
      }

      requestAnimationFrame(renderIdle);
    };

    renderIdle();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.cameraStudio = new CameraStudio();
});
