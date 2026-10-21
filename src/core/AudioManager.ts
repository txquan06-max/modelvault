import { createUISFX } from 'uisfx';
import { StorageManager } from './StorageManager';

type SoundType = 'click' | 'stage' | 'timebox' | 'complete';
type AudioStyle = 'default' | 'chiptune' | 'soft' | 'off' | 'custom';

// 初始化 uisfx，使用 arcade (街机) 风格，清脆且上头
const ui = createUISFX({ pack: 'arcade' });

export class AudioManager {
  // 用户首次交互时解锁音频
  static async unlock() {
    try {
      await ui.unlock();
    } catch (e) {
      console.warn('Audio unlock failed', e);
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
    const settings = StorageManager.getAudioSettings();
    return settings[type] || 'default';
  }

  static playClick() {
    const style = this.getStyle('click');
    if (style === 'off') return;
    if (style === 'custom' && this.playCustom('click')) return;
    
    // 替换为 uisfx 支持的 press
    ui.play('press'); 
  }

  static playStart() { 
    ui.play('start'); 
  }

  static playComplete() {
    const style = this.getStyle('complete');
    if (style === 'off') return;
    if (style === 'custom' && this.playCustom('complete')) return;

    ui.play('complete');
  }

  static playStageDone() {
    const style = this.getStyle('stage');
    if (style === 'off') return;
    if (style === 'custom' && this.playCustom('stage')) return;

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

    // 替换为 uisfx 支持的 focus (通常用于引起注意)
    ui.play('focus');
  }

  static previewSound(type: SoundType) {
    if (type === 'click') this.playClick();
    if (type === 'stage') this.playStageDone();
    if (type === 'timebox') this.playTimeboxEnd();
    if (type === 'complete') this.playComplete();
  }
}