import { tiaData } from './quotes/tia';
import { bobaData } from './quotes/boba';
import { blazeData } from './quotes/blaze';

export type BotType = 'tu' | 'milkfoam' | 'xiaoran';

export interface QuoteSet {
  zh: string;
  en: string;
}

export interface BotData {
  id: BotType;
  name: string;
  enName: string;
  speciesZh: string; 
  speciesEn: string;
  avatar: string;
  portrait: string;
  color: string;
  backgroundZh: string;
  backgroundEn: string;
  unlockLevel: number;
  unlockCost: number;
  unlockStreak?: number;
  start: QuoteSet;
  pause: QuoteSet;
  complete: QuoteSet;
  quotes: QuoteSet[];
  stageQuotes?: Record<string, QuoteSet[]>; 
}

export const BOTS: Record<BotType, BotData> = {
  tu: {
    id: 'tu', name: '途酱', enName: 'Tia',
    speciesZh: 'ModelJourney 的初代原生塑灵，代号：领航员。',
    speciesEn: 'The 1st generation native Animold of ModelJourney. Code: Navigator.',    
    avatar: '/bots/tia_avatar.png', portrait: '/bots/tia.png', color: '#3b82f6',
    backgroundZh: 'ModelJourney 的官方原生 AI 领航员。她曾是旧时代数据库里负责记录模型制造历史的“主脑”碎片。性格温柔、理性、包容。对所有的拼装流派（素组、改件、旧化）都有着极其渊博的知识。她像一位安静陪伴你的知心大姐姐。',
    backgroundEn: 'The official native AI navigator of ModelJourney. She is a fragment of the "Main Brain" from an old era database...',
    unlockLevel: 1, unlockCost: 0,
    ...tiaData
  },
  milkfoam: {
    id: 'milkfoam', name: '奶盖', enName: 'Boba',
    speciesZh: '万代流水线觉醒的质检塑灵，代号：赛博监工。',
    speciesEn: 'An awakened QC Animold from the Bandai assembly line. Code: Cyber Supervisor.',
    avatar: '/bots/boba_avatar.png', portrait: '/bots/boba.png', color: '#ec4899',
    backgroundZh: '你的赛博监工。原本是万代流水线上的初级质检员 AI，因为看不惯次品而觉醒了自我意识。性格极其傲娇、毒舌、强迫症晚期。虽然嘴上骂骂咧咧，嫌弃你的水口没剪平、渗线溢出，但每天都会准时打卡上线陪你拼胶。她只是用最狠的话，表达最深的期盼。',
    backgroundEn: 'Your cyber supervisor. Originally a junior QC AI on Bandai\'s assembly line...',
    unlockLevel: 5, unlockCost: 500,
    ...bobaData
  },
  xiaoran: {
    id: 'xiaoran', name: '小燃', enName: 'Blaze',
    speciesZh: '废弃数据中重生的格斗塑灵，代号：热血灵魂伴侣。',
    speciesEn: 'A combat Animold reborn from discarded data. Code: Hot-blooded Soulmate.',
    avatar: '/bots/blaze_avatar.png', portrait: '/bots/blaze.png', color: '#10b981',
    backgroundZh: '热血中二的灵魂伴侣。在系统数据库里，他是一个被废弃的“格斗游戏 NPC 逻辑模块”。他坚信每一个塑料模型里都封印着机甲的真正灵魂。每天都在燃烧小宇宙，把你的每一次剪水口、打磨都当成是拯救世界的战斗。',
    backgroundEn: 'A hot-blooded, chuunibyou soulmate. In the system database...',
    unlockLevel: 3, unlockCost: 1000, unlockStreak: 3,
    ...blazeData
  }
};

export class QuoteEngine {
  private static currentBot: BotType = 'tu';
  private static queues: Record<BotType, number[]> = { tu: [], milkfoam: [], xiaoran: [] };
  private static stageQueues: Record<string, number[]> = {};

  static setBot(bot: BotType) { this.currentBot = bot; }
  static getBotData(): BotData { return BOTS[this.currentBot]; }

  private static shuffle(array: number[]): number[] {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  }

  static getRandom(lang: string, stageId?: string | null): string {
    const botData = BOTS[this.currentBot];
    if (!botData) return lang === 'zh' ? "开始专注吧！" : "Let's focus!";

    if (stageId && botData.stageQuotes && botData.stageQuotes[stageId] && botData.stageQuotes[stageId].length > 0) {
      const queueKey = `${this.currentBot}_${stageId}`;
      if (!this.stageQueues[queueKey] || this.stageQueues[queueKey].length === 0) {
        const indices = Array.from({ length: botData.stageQuotes[stageId].length }, (_, i) => i);
        this.stageQueues[queueKey] = this.shuffle(indices);
      }
      const idx = this.stageQueues[queueKey].pop()!;
      const q = botData.stageQuotes[stageId][idx];
      return lang === 'zh' ? q.zh : q.en;
    }

    if (!botData.quotes || botData.quotes.length === 0) return lang === 'zh' ? "开始专注吧！" : "Let's focus!";

    if (this.queues[this.currentBot].length === 0) {
      const indices = Array.from({ length: botData.quotes.length }, (_, i) => i);
      this.queues[this.currentBot] = this.shuffle(indices);
    }

    const randomIndex = this.queues[this.currentBot].pop()!;
    const q = botData.quotes[randomIndex] || { zh: "开始专注吧！", en: "Let's focus!" };
    return lang === 'zh' ? q.zh : q.en;
  }

  static getStartQuote(lang: string): string { const q = BOTS[this.currentBot].start; return lang === 'zh' ? q.zh : q.en; }
  static getPauseQuote(lang: string): string { const q = BOTS[this.currentBot].pause; return lang === 'zh' ? q.zh : q.en; }
  static getCompleteQuote(lang: string): string { const q = BOTS[this.currentBot].complete; return lang === 'zh' ? q.zh : q.en; }
}