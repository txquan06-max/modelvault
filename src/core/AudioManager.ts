import { StorageManager } from './StorageManager';

type SoundType = 'click' | 'stage' | 'timebox' | 'complete';
type AudioStyle = 'default' | 'chiptune' | 'soft' | 'off' | 'custom';

export class AudioManager {
  private static ctx: AudioContext | null = null;

  private static getCtx(): AudioContext {
    if (!this.ctx) this.ctx = new AudioContext();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  private static playTone(freq: number, type: OscillatorType, duration: number, vol: number = 0.1, delay: number = 0) {
    const ctx = this.getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
    // 增加声音衰减，让声音更干脆（水滴感）
    gain.gain.setValueAtTime(vol, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration);
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
    
    // 清脆、短促的点击声
    if (style === 'chiptune') this.playTone(1200, 'square', 0.03, 0.04);
    else if (style === 'soft') this.playTone(600, 'sine', 0.05, 0.04);
    else this.playTone(900, 'sine', 0.04, 0.05);
  }

  static playStart() { 
    // 上升双音，令人振奋
    this.playTone(600, 'sine', 0.08, 0.08); 
    this.playTone(900, 'sine', 0.15, 0.08, 0.08); 
  }

  static playComplete() {
    const style = this.getStyle('complete');
    if (style === 'off') return;
    if (style === 'custom' && this.playCustom('complete')) return;

    // 大三和弦加高音，非常上头
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((f, i) => {
      if (style === 'chiptune') this.playTone(f * 2, 'square', 0.15, 0.06, i * 0.08);
      else if (style === 'soft') this.playTone(f, 'sine', 0.3, 0.06, i * 0.08);
      else this.playTone(f, 'triangle', 0.2, 0.08, i * 0.08);
    });
  }

  static playStageDone() {
    const style = this.getStyle('stage');
    if (style === 'off') return;
    if (style === 'custom' && this.playCustom('stage')) return;

    // 类似金币入袋的清脆叮当声
    const notes = [1046.50, 1318.51, 1567.98];
    notes.forEach((f, i) => {
      if (style === 'chiptune') this.playTone(f, 'square', 0.1, 0.06, i * 0.05);
      else if (style === 'soft') this.playTone(f, 'sine', 0.2, 0.05, i * 0.05);
      else this.playTone(f, 'triangle', 0.15, 0.08, i * 0.05);
    });
  }

  static playFinishPart() { 
    [523.25, 659.25, 783.99, 1046.50, 1318.51].forEach((f, i) => this.playTone(f, 'triangle', 0.3, 0.1, i * 0.06)); 
  }
  
  static playAchievement() { 
    [523.25, 659.25, 783.99, 1046.50, 1318.51].forEach((f, i) => this.playTone(f, 'sine', 0.4, 0.1, i * 0.08)); 
  }

  static playTimeboxEnd() {
    const style = this.getStyle('timebox');
    if (style === 'off') return;
    if (style === 'custom' && this.playCustom('timebox')) return;

    const notes = [880, 1108.73, 1318.51];
    notes.forEach((f, i) => {
      if (style === 'chiptune') this.playTone(f, 'square', 0.15, 0.08, i * 0.15);
      else if (style === 'soft') this.playTone(f, 'sine', 0.6, 0.06, i * 0.15);
      else this.playTone(f, 'sine', 0.5, 0.08, i * 0.15);
    });
  }

  static previewSound(type: SoundType) {
    if (type === 'click') this.playClick();
    if (type === 'stage') this.playStageDone();
    if (type === 'timebox') this.playTimeboxEnd();
    if (type === 'complete') this.playComplete();
  }
}