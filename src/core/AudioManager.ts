// src/core/AudioManager.ts
import { StorageManager } from './StorageManager';

export type SoundType = 'click' | 'start' | 'pause' | 'complete' | 'finishPart' | 'stage' | 'timebox' | 'achievement' | 'typing' | 'distraction' | 'wakeup';
export type AmbientType = 'none' | 'rain' | 'cafe' | 'wind';
type SoundStyle = 'default' | 'chiptune' | 'soft';

interface ToneSpec {
  freq: number;
  freqEnd?: number;
  duration: number;
  type: OscillatorType;
  gain: number;
}

const SOUND_LIBRARY: Record<SoundType, Record<SoundStyle, ToneSpec | ToneSpec[]>> = {
  click: {
    default: { freq: 1400, duration: 0.05, type: 'sine', gain: 0.1 },
    chiptune: { freq: 1600, duration: 0.03, type: 'square', gain: 0.08 },
    soft: { freq: 1200, duration: 0.04, type: 'sine', gain: 0.06 },
  },
  typing: {
    default: { freq: 1600, duration: 0.03, type: 'sine', gain: 0.015 },
    chiptune: { freq: 2200, duration: 0.02, type: 'square', gain: 0.012 },
    soft: { freq: 1200, duration: 0.04, type: 'sine', gain: 0.008 },
  },
  start: {
    default: [{ freq: 600, duration: 0.08, type: 'sine', gain: 0.12 }, { freq: 900, duration: 0.12, type: 'sine', gain: 0.12 }],
    chiptune: [{ freq: 800, duration: 0.06, type: 'square', gain: 0.1 }, { freq: 1200, duration: 0.08, type: 'square', gain: 0.1 }],
    soft: [{ freq: 500, duration: 0.12, type: 'sine', gain: 0.1 }, { freq: 700, duration: 0.15, type: 'sine', gain: 0.1 }],
  },
  pause: {
    default: [{ freq: 900, duration: 0.08, type: 'sine', gain: 0.12 }, { freq: 500, duration: 0.12, type: 'sine', gain: 0.1 }],
    chiptune: [{ freq: 1200, duration: 0.06, type: 'square', gain: 0.1 }, { freq: 700, duration: 0.08, type: 'square', gain: 0.08 }],
    soft: [{ freq: 800, duration: 0.12, type: 'sine', gain: 0.08 }, { freq: 500, duration: 0.15, type: 'sine', gain: 0.08 }],
  },
  complete: {
    default: [{ freq: 800, duration: 0.1, type: 'sine', gain: 0.15 }, { freq: 1100, duration: 0.1, type: 'sine', gain: 0.15 }, { freq: 1500, duration: 0.2, type: 'sine', gain: 0.15 }],
    chiptune: [{ freq: 1000, duration: 0.08, type: 'square', gain: 0.12 }, { freq: 1400, duration: 0.08, type: 'square', gain: 0.12 }, { freq: 1800, duration: 0.15, type: 'square', gain: 0.12 }],
    soft: [{ freq: 700, duration: 0.15, type: 'sine', gain: 0.1 }, { freq: 1000, duration: 0.15, type: 'sine', gain: 0.1 }, { freq: 1300, duration: 0.2, type: 'sine', gain: 0.1 }],
  },
  finishPart: {
    default: [{ freq: 1000, duration: 0.08, type: 'sine', gain: 0.15 }, { freq: 1400, duration: 0.15, type: 'sine', gain: 0.15 }],
    chiptune: [{ freq: 1200, duration: 0.06, type: 'square', gain: 0.12 }, { freq: 1600, duration: 0.1, type: 'square', gain: 0.12 }],
    soft: [{ freq: 800, duration: 0.1, type: 'sine', gain: 0.1 }, { freq: 1100, duration: 0.15, type: 'sine', gain: 0.1 }],
  },
  stage: {
    default: { freq: 1000, duration: 0.08, type: 'sine', gain: 0.12 },
    chiptune: { freq: 1200, duration: 0.06, type: 'square', gain: 0.1 },
    soft: { freq: 800, duration: 0.1, type: 'sine', gain: 0.08 },
  },
  timebox: {
    default: [{ freq: 700, duration: 0.12, type: 'sine', gain: 0.15 }, { freq: 900, duration: 0.12, type: 'sine', gain: 0.15 }, { freq: 1200, duration: 0.2, type: 'sine', gain: 0.15 }],
    chiptune: [{ freq: 800, duration: 0.1, type: 'square', gain: 0.12 }, { freq: 1100, duration: 0.1, type: 'square', gain: 0.12 }, { freq: 1500, duration: 0.15, type: 'square', gain: 0.12 }],
    soft: [{ freq: 600, duration: 0.15, type: 'sine', gain: 0.1 }, { freq: 800, duration: 0.15, type: 'sine', gain: 0.1 }, { freq: 1100, duration: 0.2, type: 'sine', gain: 0.1 }],
  },
  achievement: {
    default: [{ freq: 800, duration: 0.1, type: 'sine', gain: 0.15 }, { freq: 1000, duration: 0.1, type: 'sine', gain: 0.15 }, { freq: 1200, duration: 0.1, type: 'sine', gain: 0.15 }, { freq: 1600, duration: 0.25, type: 'sine', gain: 0.15 }],
    chiptune: [{ freq: 1000, duration: 0.08, type: 'square', gain: 0.12 }, { freq: 1300, duration: 0.08, type: 'square', gain: 0.12 }, { freq: 1600, duration: 0.08, type: 'square', gain: 0.12 }, { freq: 2000, duration: 0.2, type: 'square', gain: 0.12 }],
    soft: [{ freq: 700, duration: 0.15, type: 'sine', gain: 0.1 }, { freq: 900, duration: 0.15, type: 'sine', gain: 0.1 }, { freq: 1100, duration: 0.15, type: 'sine', gain: 0.1 }, { freq: 1400, duration: 0.25, type: 'sine', gain: 0.1 }],
  },
  distraction: {
    default: [{ freq: 350, freqEnd: 180, duration: 0.3, type: 'triangle', gain: 0.15 }, { freq: 300, freqEnd: 150, duration: 0.3, type: 'triangle', gain: 0.15 }],
    chiptune: [{ freq: 400, freqEnd: 200, duration: 0.25, type: 'square', gain: 0.1 }, { freq: 350, freqEnd: 180, duration: 0.25, type: 'square', gain: 0.1 }],
    soft: [{ freq: 300, freqEnd: 150, duration: 0.4, type: 'sine', gain: 0.1 }, { freq: 250, freqEnd: 120, duration: 0.4, type: 'sine', gain: 0.1 }],
  },
  wakeup: {
    default: [{ freq: 800, duration: 0.12, type: 'sine', gain: 0.15 }, { freq: 1200, duration: 0.12, type: 'sine', gain: 0.15 }, { freq: 1600, duration: 0.25, type: 'sine', gain: 0.15 }],
    chiptune: [{ freq: 1000, duration: 0.1, type: 'square', gain: 0.12 }, { freq: 1400, duration: 0.1, type: 'square', gain: 0.12 }, { freq: 1800, duration: 0.2, type: 'square', gain: 0.12 }],
    soft: [{ freq: 700, duration: 0.15, type: 'sine', gain: 0.1 }, { freq: 1000, duration: 0.15, type: 'sine', gain: 0.1 }, { freq: 1300, duration: 0.25, type: 'sine', gain: 0.1 }],
  },
};

export class AudioManager {
  private static ctx: AudioContext | null = null;
  private static lastClickTime = 0;
  private static resumeInFlight = false;
  private static unlocked = true;

  private static ambientSource: AudioBufferSourceNode | null = null;
  private static ambientGain: GainNode | null = null;
  private static currentAmbient: AmbientType = 'none';

  private static lastPlayTime: Record<string, number> = {};
  private static DEBOUNCE_MS = 100;

  // 🌟 新增：缓存 local:// 音效转换后的 blob URL
  private static audioUrlCache: Record<string, string> = {};

  private static getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.ctx;
  }

  private static isCtxRunning(ctx: AudioContext): boolean {
    return (ctx.state as string) === 'running';
  }

  static isUnlocked(): boolean {
    return this.unlocked;
  }

  static unlock() {
    if (this.unlocked) return;
    this.unlocked = true;
    const ctx = this.getCtx();
    if (!this.isCtxRunning(ctx)) {
      this.ensureRunning(ctx).catch(() => {});
    }
  }

  static lock() {
    this.unlocked = false;
  }

  // 🌟 新增：预加载自定义音效（解决 local:// 协议无法直接播放的问题）
  static async preloadCustomAudios() {
    const customAudios = StorageManager.getCustomAudios();
    const wakeup = StorageManager.getCustomWakeupSound();
    
    const urlsToLoad = [...Object.values(customAudios), wakeup].filter(u => typeof u === 'string' && u.startsWith('local://')) as string[];
    
    for (const url of urlsToLoad) {
      if (!this.audioUrlCache[url]) {
        const blobUrl = await StorageManager.loadLocalFileUrl(url);
        if (blobUrl) this.audioUrlCache[url] = blobUrl;
      }
    }
  }

  private static getPlayableUrl(src: string): string | null {
    if (src.startsWith('local://')) {
      return this.audioUrlCache[src] || null;
    }
    return src;
  }

  private static async ensureRunning(ctx: AudioContext): Promise<boolean> {
    if (this.isCtxRunning(ctx)) return true;
    if (this.resumeInFlight) {
      return new Promise((resolve) => {
        const start = Date.now();
        const check = () => {
          if (this.isCtxRunning(ctx)) resolve(true);
          else if (!this.resumeInFlight || Date.now() - start > 1500) resolve(this.isCtxRunning(ctx));
          else setTimeout(check, 30);
        };
        check();
      });
    }
    this.resumeInFlight = true;
    try {
      await ctx.resume();
      return this.isCtxRunning(ctx);
    } catch {
      return false;
    } finally {
      this.resumeInFlight = false;
    }
  }

  private static playTone(ctx: AudioContext, spec: ToneSpec, startDelay: number = 0) {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime + startDelay;
      osc.type = spec.type;
      osc.frequency.setValueAtTime(spec.freq, now);
      if (spec.freqEnd) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(spec.freqEnd, 20), now + spec.duration);
      }
      gain.gain.setValueAtTime(spec.gain, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + spec.duration);

      osc.start(now);
      osc.stop(now + spec.duration + 0.02);
    } catch (e) {}
  }

  private static playSpecs(specs: ToneSpec | ToneSpec[]) {
    const arr = Array.isArray(specs) ? specs : [specs];
    const ctx = this.getCtx();
    let delay = 0;
    for (const spec of arr) {
      this.playTone(ctx, spec, delay);
      delay += spec.duration * 0.7;
    }
  }

  private static styleToSoundStyle(style: string): SoundStyle {
    if (style === 'chiptune' || style === 'soft') return style;
    return 'default';
  }

  private static playCustom(type: SoundType): boolean {
    const customAudios = StorageManager.getCustomAudios();
    const src = customAudios[type];
    if (src) {
      const playUrl = this.getPlayableUrl(src);
      if (playUrl) {
        const audio = new Audio(playUrl);
        audio.volume = 0.5;
        audio.play().catch(e => console.warn('Audio play failed', e));
        return true;
      }
      // 如果是从 local:// 加载但还没准备好，尝试异步加载一次并播放
      if (src.startsWith('local://')) {
        StorageManager.loadLocalFileUrl(src).then(blobUrl => {
          if (blobUrl) {
            this.audioUrlCache[src] = blobUrl;
            const audio = new Audio(blobUrl);
            audio.volume = 0.5;
            audio.play().catch(e => console.warn('Audio play failed', e));
          }
        });
        return true;
      }
    }
    return false;
  }

  private static play(type: SoundType) {
    if (!this.unlocked) return;

    // wakeup 走自定义音效路径（不受防抖限制，闹钟必须响）
    if (type === 'wakeup') {
      const customWakeup = StorageManager.getCustomWakeupSound();
      if (customWakeup) {
        const playUrl = this.getPlayableUrl(customWakeup);
        if (playUrl) {
          const audio = new Audio(playUrl);
          audio.volume = 1.0;
          audio.play().catch(e => console.warn('Wakeup sound play failed', e));
          return;
        }
        if (customWakeup.startsWith('local://')) {
          StorageManager.loadLocalFileUrl(customWakeup).then(blobUrl => {
            if (blobUrl) {
              this.audioUrlCache[customWakeup] = blobUrl;
              const audio = new Audio(blobUrl);
              audio.volume = 1.0;
              audio.play().catch(e => console.warn('Wakeup sound play failed', e));
            }
          });
          return;
        }
      }
    }

    const now = Date.now();
    if (this.lastPlayTime[type] && now - this.lastPlayTime[type] < this.DEBOUNCE_MS) {
      return;
    }
    this.lastPlayTime[type] = now;
    const requestTime = now;

    const settings = StorageManager.getAudioSettings();
    const style = settings[type] || 'default';
    if (style === 'off') return;
    if (style === 'custom' && this.playCustom(type)) return;

    const spec = SOUND_LIBRARY[type]?.[this.styleToSoundStyle(style)];
    if (!spec) return;

    const ctx = this.getCtx();

    if (this.isCtxRunning(ctx)) {
      this.playSpecs(spec);
      return;
    }

    try { ctx.resume().catch(() => {}); } catch {}
    this.ensureRunning(ctx).then((ok) => {
      if (!ok) return;
      if (this.lastPlayTime[type] !== requestTime) return;
      this.playSpecs(spec);
    });
  }

  static playClick() {
    const now = Date.now();
    if (now - this.lastClickTime < 50) return;
    this.lastClickTime = now;
    this.play('click');
  }

  static playStart() { this.play('start'); }
  static playPause() { this.play('pause'); }
  static playComplete() { this.play('complete'); }
  static playFinishPart() { this.play('finishPart'); }
  static playStageDone() { this.play('stage'); }
  static playTimeboxEnd() { this.play('timebox'); }
  static playAchievement() { this.play('achievement'); }
  static playDistraction() { this.play('distraction'); }
  static playWakeup() { this.play('wakeup'); }

  static playTypeTick() {
    if (!this.unlocked) return;

    const now = Date.now();
    if (this.lastPlayTime['typing'] && now - this.lastPlayTime['typing'] < 60) return;
    this.lastPlayTime['typing'] = now;

    const settings = StorageManager.getAudioSettings();
    const style = settings['typing'] || 'default';
    if (style === 'off') return;
    if (style === 'custom' && this.playCustom('typing')) return;

    const ctx = this.getCtx();
    if (!this.isCtxRunning(ctx)) {
      this.ensureRunning(ctx);
      return;
    }

    const spec = SOUND_LIBRARY['typing']?.[this.styleToSoundStyle(style)];
    if (spec) this.playSpecs(spec);
  }

  static previewSound(type: SoundType) {
    this.play(type);
  }

  static playAmbient(type: AmbientType) {
    if (this.currentAmbient === type) return;
    this.stopAmbient();
    if (type === 'none') return;
    this.currentAmbient = type;

    try {
      const ctx = this.getCtx();
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        if (type === 'rain') {
          output[i] = (lastOut + (0.02 * white)) / 1.02;
          lastOut = output[i];
          output[i] *= 3.5;
        } else if (type === 'wind') {
          output[i] = (lastOut + (0.05 * white)) / 1.05;
          lastOut = output[i];
          output[i] *= 2.0;
        } else {
          output[i] = white * 0.3;
        }
      }

      this.ambientSource = ctx.createBufferSource();
      this.ambientSource.buffer = noiseBuffer;
      this.ambientSource.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = type === 'rain' ? 'lowpass' : 'bandpass';
      filter.frequency.value = type === 'rain' ? 800 : 400;

      this.ambientGain = ctx.createGain();
      this.ambientGain.gain.value = 0.2;

      this.ambientSource.connect(filter);
      filter.connect(this.ambientGain);
      this.ambientGain.connect(ctx.destination);

      this.ambientSource.start();
    } catch (e) { console.warn('Ambient sound generation failed', e); }
  }

  static stopAmbient() {
    if (this.ambientSource) {
      try { this.ambientSource.stop(); } catch (e) {}
      this.ambientSource = null;
    }
    if (this.ambientGain) {
      this.ambientGain = null;
    }
    this.currentAmbient = 'none';
  }

  static setAmbientVolume(vol: number) {
    if (this.ambientGain) {
      this.ambientGain.gain.value = vol;
    }
  }
}