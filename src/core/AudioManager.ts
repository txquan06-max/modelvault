import { createUISFX } from 'uisfx';
import { StorageManager } from './StorageManager';

type SoundType = 'click' | 'stage' | 'timebox' | 'complete';
type AudioStyle = 'default' | 'chiptune' | 'soft' | 'off' | 'custom';

// 1. 初始化 uisfx，并设置为“街机”风格以获得上头感
const ui = createUISFX({ pack: 'arcade' });

export class AudioManager {
  private static ctx: AudioContext | null = null;

  private static getCtx(): AudioContext {
    if (!this.ctx) this.ctx = new AudioContext();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  // 用户首次交互时解锁音频（必须）
  static async unlock() {
    try {
      await ui.unlock();
    } catch (e) {
      console.warn('Audio unlock failed', e);
    }
  }

  // --- 自定义音效部分（保持你原有的逻辑，这里略作精简）---
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

  // --- 使用 uisfx 的全新音效方法 ---

  static playClick() {
    const style = this.getStyle('click');
    if (style === 'off') return;
    if (style === 'custom' && this.playCustom('click')) return;

    // 使用 uisfx 的“点击”音效，清脆短促
    ui.play('tap'); 
  }

  static playStart() { 
    // 开始计时用“上升”音效，充满能量
    ui.play('toggle-on'); 
  }

  static playComplete() {
    const style = this.getStyle('complete');
    if (style === 'off') return;
    if (style === 'custom' && this.playCustom('complete')) return;

    // 完成计时用“成功”音效，悦耳且有满足感
    ui.play('success');
  }

  static playStageDone() {
    const style = this.getStyle('stage');
    if (style === 'off') return;
    if (style === 'custom' && this.playCustom('stage')) return;

    // 阶段完成用“升级”音效，更有成就感
    ui.play('level-up');
  }

  static playFinishPart() { 
    // 完成整个部位，使用更隆重的“成就”音效
    ui.play('achievement');
  }
  
  static playAchievement() { 
    // 成就解锁，同样使用隆重的音效
    ui.play('achievement');
  }

  static playTimeboxEnd() {
    const style = this.getStyle('timebox');
    if (style === 'off') return;
    if (style === 'custom' && this.playCustom('timebox')) return;

    // 番茄钟结束/提醒，用“通知”音效，既引人注意又不刺耳
    ui.play('notify');
  }

  static previewSound(type: SoundType) {
    if (type === 'click') this.playClick();
    if (type === 'stage') this.playStageDone();
    if (type === 'timebox') this.playTimeboxEnd();
    if (type === 'complete') this.playComplete();
  }
}