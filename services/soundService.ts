
import { ThemeConfig } from "../types";

class SoundService {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private bgmGain: GainNode | null = null;
  private isBgmPlaying: boolean = false;
  private bgmInterval: any = null;
  private customAudio: HTMLAudioElement | null = null;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMuted(isMuted: boolean) {
    this.muted = isMuted;
    if (this.muted) {
      this.stopBGM();
    }
  }

  playFlap() {
    if (this.muted) return;
    this.init();
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(250, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  }

  playScore() {
    if (this.muted) return;
    this.init();
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  }

  playCrash() {
    if (this.muted) return;
    this.init();
    const ctx = this.ctx!;
    
    // Thud
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);

    // Noise burst
    const bufferSize = ctx.sampleRate * 0.2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.05, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    noise.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start();
    noise.stop(ctx.currentTime + 0.2);
  }

  startBGM(theme: ThemeConfig, customUrl?: string | null) {
    if (this.muted || this.isBgmPlaying) return;
    this.init();
    this.isBgmPlaying = true;
    
    const ctx = this.ctx!;
    this.bgmGain = ctx.createGain();
    this.bgmGain.gain.setValueAtTime(0, ctx.currentTime);
    this.bgmGain.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 1); // Fade in
    this.bgmGain.connect(ctx.destination);

    if (customUrl) {
      if (!this.customAudio) {
        this.customAudio = new Audio();
        this.customAudio.loop = true;
      }
      this.customAudio.src = customUrl;
      this.customAudio.volume = 0.5;
      this.customAudio.play().catch(e => console.warn("Custom audio play blocked:", e));
      return;
    }

    // Derive musical properties from theme
    const themeHash = theme.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const baseFreq = 110 * (1 + (themeHash % 4) * 0.25); // Range around A2 (110Hz)
    const tempo = 400 + (themeHash % 200); // 400ms to 600ms per beat
    
    const scale = [1, 1.125, 1.25, 1.5, 1.667]; // Major Pentatonic
    const melody = [0, 2, 4, 3, 0, 1, 4, 2].map(i => baseFreq * scale[i % scale.length]);

    let step = 0;
    this.bgmInterval = setInterval(() => {
      if (!this.bgmGain) return;
      const freq = melody[step % melody.length];
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();
      
      osc.type = theme.name.toLowerCase().includes('cyber') || theme.name.toLowerCase().includes('space') ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      
      noteGain.gain.setValueAtTime(0.4, ctx.currentTime);
      noteGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (tempo / 1000) * 0.8);
      
      osc.connect(noteGain);
      noteGain.connect(this.bgmGain);
      
      osc.start();
      osc.stop(ctx.currentTime + (tempo / 1000));
      
      step++;
    }, tempo);
  }

  stopBGM() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
    if (this.customAudio) {
      this.customAudio.pause();
    }
    if (this.bgmGain) {
      const ctx = this.ctx!;
      this.bgmGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      setTimeout(() => {
        if (this.bgmGain) {
          this.bgmGain.disconnect();
          this.bgmGain = null;
        }
      }, 600);
    }
    this.isBgmPlaying = false;
  }
}

export const soundService = new SoundService();
