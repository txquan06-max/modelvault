import { createUISFX } from 'uisfx';
import { StorageManager } from './StorageManager';

export type SoundType = 'click' | 'start' | 'pause' | 'complete' | 'finishPart' | 'stage' | 'timebox' | 'achievement';

const ui = createUISFX({ pack: 'glass' });

// 用户风格 → uisfx pack 名称映射
const STYLE_TO_PACK: Record<string, string> = {
  'default': 'glass',
  'chiptune': 'arcade',
  'soft': 'soft',
};

// 语义事件 → uisfx cue 名称映射
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

  static async unlock() {
    try { await ui.unlock(); } catch (e) { console.warn('Audio unlock failed', e); }
  }

  private static syncPack(style: string) {
    const targetPack = STYLE_TO_PACK[style] || 'glass';
    if (targetPack !== this.currentPack) {
      this.currentPack = targetPack;
      // uisfx 的 setPack 类型较严格，用 any 断言以兼容 string 变量
      ui.setPack(targetPack as any);
    }
  }

  private static playCustom(type: SoundType): boolean {
    const customAudios = StorageManager.getCustomAudios();
    const base64 = customAudios[type];
    if (base64) {
      const audio = new Audio(base64);
      audio.volume = 0.5;
      audio.play().catch(e => console.warn('Audio play failed', e));
      return true;
    }
    return false;
  }

  private static play(type: SoundType) {
    const settings = StorageManager.getAudioSettings();
    const style = settings[type] || 'default';
    if (style === 'off') return;
    if (style === 'custom' && this.playCustom(type)) return;
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
}