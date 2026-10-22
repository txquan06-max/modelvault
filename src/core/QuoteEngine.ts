export type BotType = 'tu' | 'milkfoam' | 'xiaoran';

export interface QuoteSet {
  zh: string;
  en: string;
}

export interface BotData {
  id: BotType;
  name: string;
  enName: string;
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
}

export const BOTS: Record<BotType, BotData> = {
  tu: {
    id: 'tu',
    name: '途酱',
    enName: 'Tia',
    avatar: '/bots/tia_avatar.png',
    portrait: '/bots/tia.png',
    color: '#3b82f6',
    backgroundZh: 'ModelJourney 的官方原生 AI 领航员。她曾是旧时代数据库里负责记录模型制造历史的“主脑”碎片。性格温柔、理性、包容。对所有的拼装流派（素组、改件、旧化）都有着极其渊博的知识。她像一位安静陪伴你的知心大姐姐。',
    backgroundEn: 'The official native AI navigator of ModelJourney. She is a fragment of the "Main Brain" from an old era database, responsible for recording the history of model making. Gentle, rational, and tolerant, she has profound knowledge of all building styles. Like a quiet, caring older sister.',
    unlockLevel: 1,
    unlockCost: 0,
    start: { zh: "旅途开始，今天做哪个部位呢？", en: "Journey begins. Which part are we building today?" },
    pause: { zh: "休息一下，喝口水，看看窗外的风景吧。", en: "Take a break, hydrate, and enjoy the view." },
    complete: { zh: "记录完毕，每一秒都是你留下的足迹。", en: "Recorded. Every second is a footprint you've left." },
    quotes: [
      { zh: "素组是男人的浪漫，慢慢来，别着急。", en: "Out-of-box builds are a classic romance. Take your time." },
      { zh: "注意剪水口，留一点余地打磨。", en: "Be careful with the nippers, leave a margin for sanding." },
      { zh: "刻线要轻，就像抚摸你的钱包。", en: "Scribe lightly, like you're touching your wallet." },
      { zh: "渗线液别流得太宽，小心溢出来。", en: "Don't let the panel line wash run too wide." },
      { zh: "做胶的时候，时间总是过得很快。", en: "Time flies when you're building gunpla." },
      { zh: "你的每一次打磨，都是对模型的尊重。", en: "Every sanding is a sign of respect to the model." }
    ]
  },
  milkfoam: {
    id: 'milkfoam',
    name: '奶盖',
    enName: 'Boba',
    avatar: '/bots/boba_avatar.png',
    portrait: '/bots/boba.png',
    color: '#ec4899',
    backgroundZh: '你的赛博监工。原本是万代流水线上的初级质检员 AI，因为看不惯次品而觉醒了自我意识。性格极其傲娇、毒舌、强迫症晚期。虽然嘴上骂骂咧咧，嫌弃你的水口没剪平、渗线溢出，但每天都会准时打卡上线陪你拼胶。她只是用最狠的话，表达最深的期盼。',
    backgroundEn: 'Your cyber supervisor. Originally a junior QC AI on Bandai\'s assembly line, she awakened self-awareness out of disgust for defective products. Extremely tsundere, sharp-tongued, and a late-stage perfectionist.',
    unlockLevel: 5,
    unlockCost: 500,
    start: { zh: "磨蹭什么呢？还不快点开始！", en: "What's the hold up? Get started already!" },
    pause: { zh: "这就累了？现在的胶佬体力真差。", en: "Tired already? Modelers these days have no stamina." },
    complete: { zh: "总算搞定一段了，勉强夸你一下吧。", en: "Finally finished a section. I guess I'll give you some credit." },
    quotes: [
      { zh: "就这？水口都没剪平，你管这叫拼模型？", en: "Is that all? You left nub marks everywhere. You call this building?" },
      { zh: "刻线歪了！你的手是借来的吗？", en: "The scribing is crooked! Did you borrow those hands?" },
      { zh: "保护漆喷得跟下雪似的，真行啊你。", en: "You sprayed topcoat like it's falling snow. Great job... not." },
      { zh: "啧，进度这么慢，万代出新胶的速度都比你快。", en: "Tsk, Bandai releases new kits faster than your progress." }
    ]
  },
  xiaoran: {
    id: 'xiaoran',
    name: '小燃',
    enName: 'Blaze',
    avatar: '/bots/blaze_avatar.png',
    portrait: '/bots/blaze.png',
    color: '#10b981',
    backgroundZh: '热血中二的灵魂伴侣。在系统数据库里，他是一个被废弃的“格斗游戏 NPC 逻辑模块”。他坚信每一个塑料模型里都封印着机甲的真正灵魂。每天都在燃烧小宇宙，把你的每一次剪水口、打磨都当成是拯救世界的战斗。',
    backgroundEn: 'A hot-blooded, chuunibyou soulmate. In the system database, he is a discarded "fighting game NPC logic module." He firmly believes that every plastic model seals the true soul of a mecha.',
    unlockLevel: 3,
    unlockCost: 1000,
    unlockStreak: 3,
    start: { zh: "全军出击！今天的目标是哪台机体？！", en: "All forces attack! What's our target today?!" },
    pause: { zh: "原地待命！补充一点能量再战！", en: "Stand by! Replenish energy before the next battle!" },
    complete: { zh: "战报已记录！你的战果将被载入史册！", en: "Battle report recorded! Your results will be written in history!" },
    quotes: [
      { zh: "燃起来！为了人类的可能性，注入灵魂吧！", en: "Ignite your spirit! Let's push the limits of human possibility!" },
      { zh: "这把剪钳，就是你斩断烦恼的利刃！", en: "These nippers are the blade to cut through your worries!" },
      { zh: "感受到指尖的震动了吗？那是机甲在回应你！", en: "Feel the vibration on your fingertips? That's the mecha responding!" },
      { zh: "哪怕是不起眼的内构，也藏着无限的可能！", en: "Even the hidden inner frame holds infinite possibilities!" }
    ]
  }
};

export class QuoteEngine {
  private static currentBot: BotType = 'tu';

  static setBot(bot: BotType) {
    this.currentBot = bot;
  }

  static getBotData(): BotData {
    return BOTS[this.currentBot];
  }

  static getRandom(lang: string): string {
    const botData = BOTS[this.currentBot];
    const randomIndex = Math.floor(Math.random() * botData.quotes.length);
    const q = botData.quotes[randomIndex] || { zh: "开始专注吧！", en: "Let's focus!" };
    return lang === 'zh' ? q.zh : q.en;
  }

  static getStartQuote(lang: string): string { 
    const q = BOTS[this.currentBot].start;
    return lang === 'zh' ? q.zh : q.en; 
  }
  
  static getPauseQuote(lang: string): string { 
    const q = BOTS[this.currentBot].pause;
    return lang === 'zh' ? q.zh : q.en; 
  }
  
  static getCompleteQuote(lang: string): string { 
    const q = BOTS[this.currentBot].complete;
    return lang === 'zh' ? q.zh : q.en; 
  }
}