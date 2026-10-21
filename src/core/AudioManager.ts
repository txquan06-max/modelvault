import { createUISFX } from 'uisfx';
import { StorageManager } from './StorageManager';

type SoundType = 'click' | 'stage' | 'timebox' | 'complete';
type AudioStyle = 'default' | 'chiptune' | 'soft' | 'off' | 'custom';

// 1. 默认使用 'glass' 风格（明亮、清脆）
const ui = createUISFX({ pack: 'glass' });

// 将设置中的风格映射到 uisfx 的 pack 名称
const STYLE_TO_PACK: Record<string, string> = {
  'default': 'glass',      // 默认：明亮清脆
  'chiptune': 'arcade',    // 复古：街机芯片
  'soft': 'soft',          // 柔和：温暖
};

export class AudioManager {
  private static currentPack = 'glass';

  static async unlock() {
    try { await ui.unlock(); } catch (e) { console.warn('Audio unlock failed', e); }
  }

  // 新增：根据设置切换音色包
  private static syncPack(type: SoundType) {
    const settings = StorageManager.getAudioSettings();
    const style = settings[type] || 'default';
    const targetPack = STYLE_TO_PACK[style] || 'glass';
    
    if (targetPack !== this.currentPack) {
      this.currentPack = targetPack;
      ui.setPack(targetPack);
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

  private static getStyle(type: SoundType): AudioStyle {
    return StorageManager.getAudioSettings()[type] || 'default';
  }

  static playClick() {
    const style = this.getStyle('click');
    if (style === 'off') return;
    if (style === 'custom' && this.playCustom('click')) return;
    this.syncPack('click');
    ui.play('press');
  }

  static playStart() { 
    ui.play('start'); 
  }

  static playComplete() {
    const style = this.getStyle('complete');
    if (style === 'off') return;
    if (style === 'custom' && this.playCustom('complete')) return;
    this.syncPack('complete');
    ui.play('complete');
  }

  static playStageDone() {
    const style = this.getStyle('stage');
    if (style === 'off') return;
    if (style === 'custom' && this.playCustom('stage')) return;
    this.syncPack('stage');
    ui.play('select');
  }

  static playFinishPart() { 
    ui.play('double-click'); 
  }
  
  static playAchievement() { 
    ui.play('long-press'); 
  }

  static playTimeboxEnd() {
    const style = this.getStyle('timebox');
    if (style === 'off') return;
    if (style === 'custom' && this.playCustom('timebox')) return;
    this.syncPack('timebox');
    ui.play('focus');
  }

  static previewSound(type: SoundType) {
    if (type === 'click') this.playClick();
    if (type === 'stage') this.playStageDone();
    if (type === 'timebox') this.playTimeboxEnd();
    if (type === 'complete') this.playComplete();
  }
}