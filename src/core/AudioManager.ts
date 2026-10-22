import { createUISFX } from 'uisfx';
import { StorageManager } from './StorageManager';

export type SoundType = 'click' | 'start' | 'pause' | 'complete' | 'finishPart' | 'stage' | 'timebox' | 'achievement';

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
};

export class AudioManager {
  private static currentPack = 'glass';
  private static ctx: AudioContext | null = null;

  static async unlock() {
    try { await ui.unlock(); } catch (e) { console.warn('Audio unlock failed', e); }
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

  private static play(type: SoundType) {
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

  static playClick() { this.play('click'); }
  static playStart() { this.play('start'); }
  static playPause() { this.play('pause'); }
  static playComplete() { this.play('complete'); }
  static playFinishPart() { this.play('finishPart'); }
  static playStageDone() { this.play('stage'); }
  static playTimeboxEnd() { this.play('timebox'); }
  static playAchievement() { this.play('achievement'); }

  static previewSound(type: SoundType) { this.play(type); }

  // 🌟 新增：打字机微音效
  static playTypeTick() {
    const settings = StorageManager.getAudioSettings();
    if (settings['click'] === 'off') return; // 共用点击音效的开关
    try {
      const ctx = this.getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1800, ctx.currentTime); // 更高频，更清脆
      gain.gain.setValueAtTime(0.03, ctx.currentTime); // 音量很小
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02); // 极短
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.02);
    } catch (e) {}
  }
}