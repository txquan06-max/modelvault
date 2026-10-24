import { createUISFX } from 'uisfx';
import { StorageManager } from './StorageManager';

export type SoundType = 'click' | 'start' | 'pause' | 'complete' | 'finishPart' | 'stage' | 'timebox' | 'achievement' | 'typing' | 'distraction' | 'wakeup';
export type AmbientType = 'none' | 'rain' | 'cafe' | 'wind';

const ui = createUISFX({ pack: 'glass' });

const STYLE_TO_PACK: Record<string, string> = {
  'default': 'glass',
  'chiptune': 'arcade',
  'soft': 'soft',
};

const CUE_MAP: Record<SoundType, string> = {
  click: 'press',
  start: 'start',
  pause: 'pause',
  complete: 'complete',
  finishPart: 'double-click',
  stage: 'select',
  timebox: 'focus',
  achievement: 'long-press',
  typing: 'press',
  distraction: 'press',
  wakeup: 'complete',
};

export class AudioManager {
  private static currentPack = 'glass';
  private static ctx: AudioContext | null = null;
  private static lastClickTime = 0; 

  private static ambientSource: AudioBufferSourceNode | null = null;
  private static ambientGain: GainNode | null = null;
  private static currentAmbient: AmbientType = 'none';

  static async unlock() {
    // 🌟 修复：用 as any 绕过旧版 uisfx 的类型缺失
    try { await (ui as any).unlock(); } catch (e) { console.warn('Audio unlock failed', e); }
  }

  private static getCtx(): AudioContext {
    if (!this.ctx) this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  private static syncPack(style: string) {
    const targetPack = STYLE_TO_PACK[style] || 'glass';
    if (targetPack !== this.currentPack) {
      this.currentPack = targetPack;
      ui.setPack(targetPack as any);
    }
  }

  private static playCustom(type: SoundType): boolean {
    const customAudios = StorageManager.getCustomAudios();
    const base64 = customAudios[type];
    if (base64) {
      const audio = new Audio(base64);
      audio.volume = 0.5;
      audio.play().catch(e => console.warn("Audio play failed", e));
      return true;
    }
    return false;
  }

  private static playCrispClick() {
    try {
      const ctx = this.getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) {}
  }

  private static playDistractionSound() {
    try {
      const ctx = this.getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(350, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.3);
      
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.45);
    } catch (e) {}
  }

  private static play(type: SoundType) {
    if (type === 'typing') { this.playTypeTick(); return; }
    if (type === 'distraction') { this.playDistractionSound(); return; }
    if (type === 'wakeup') { this.playWakeupSound(); return; }

    const settings = StorageManager.getAudioSettings();
    const style = settings[type] || 'default';
    if (style === 'off') return;
    if (style === 'custom' && this.playCustom(type)) return;
    
    if (type === 'click' && style === 'default') {
      this.playCrispClick();
      return;
    }

    this.syncPack(style);
    ui.play(CUE_MAP[type] as any);
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
  
  private static playWakeupSound() {
    const customWakeup = StorageManager.getCustomWakeupSound();
    if (customWakeup) {
      const audio = new Audio(customWakeup);
      audio.volume = 1.0;
      audio.play().catch(e => console.warn('Wakeup sound play failed', e));
      return;
    }
    const settings = StorageManager.getAudioSettings();
    const style = settings['complete'] || 'default';
    if (style !== 'off') {
      this.syncPack(style);
      ui.play(CUE_MAP['complete'] as any);
    }
  }

  static previewSound(type: SoundType) { this.play(type); }

  static playTypeTick() {
    const settings = StorageManager.getAudioSettings();
    const style = settings['typing'] || 'default';
    if (style === 'off') return;
    if (style === 'custom' && this.playCustom('typing')) return;

    try {
      const ctx = this.getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);

      if (style === 'chiptune') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(2200, ctx.currentTime);
        gain.gain.setValueAtTime(0.012, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.02);
      } else if (style === 'soft') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, ctx.currentTime);
        gain.gain.setValueAtTime(0.008, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.04);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1600, ctx.currentTime);
        gain.gain.setValueAtTime(0.015, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.03);
      }
    } catch (e) {}
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