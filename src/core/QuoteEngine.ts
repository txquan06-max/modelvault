export type BotType = 'tu' | 'milkfoam' | 'xiaoran';

export interface QuoteSet {
  zh: string;
  en: string;
}

export interface BotData {
  id: BotType;
  name: string;
  enName: string;
  avatar: string; // 🌟 支持 Emoji 或 图片URL
  color: string;
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
    avatar: '🤖', // 可以改成 url('/avatars/tia.png')
    color: '#3b82f6',
    start: { zh: "旅途开始，今天做哪个部位呢？", en: "Journey begins. Which part are we building today?" },
    pause: { zh: "休息一下，喝口水，看看窗外的风景吧。", en: "Take a break, hydrate, and enjoy the view." },
    complete: { zh: "记录完毕，每一秒都是你留下的足迹。", en: "Recorded. Every second is a footprint you've left." },
    quotes: [
      { zh: "素组是男人的浪漫，慢慢来，别着急。", en: "Out-of-box builds are a classic romance. Take your time, no rush." },
      { zh: "注意剪水口，留一点余地打磨。", en: "Be careful with the nippers, leave a little margin for sanding." },
      { zh: "刻线要轻，就像抚摸你的钱包。", en: "Scribe lightly, like you're touching your wallet." },
      { zh: "渗线液别流得太宽，小心溢出来。", en: "Don't let the panel line wash run too wide, watch for overflow." },
      { zh: "做胶的时候，时间总是过得很快。", en: "Time flies when you're building gunpla." },
      { zh: "你的每一次打磨，都是对模型的尊重。", en: "Every sanding is a sign of respect to the model." },
      { zh: "很多大佬都是从素组开始的，别急。", en: "Many pros started with straight builds. Don't rush." },
      { zh: "用爱去制作，模型会感受到的。", en: "Build with love, the model will feel it." },
      { zh: "不要被别人的进度影响，你有自己的节奏。", en: "Don't be influenced by others' pace. You have your own flow." },
      { zh: "用心做出来的作品，是有灵魂的。", en: "A work made with heart has a soul." },
      { zh: "做胶能让人忘掉烦恼。", en: "Building helps you forget your worries." },
      { zh: "每次拼装，都是一次修行。", en: "Every build is a practice in patience." }
    ]
  },
  milkfoam: {
    id: 'milkfoam',
    name: '奶盖',
    enName: 'Boba',
    avatar: '😈',
    color: '#ec4899',
    start: { zh: "磨蹭什么呢？还不快点开始！", en: "What's the hold up? Get started already!" },
    pause: { zh: "这就累了？现在的胶佬体力真差。", en: "Tired already? Modelers these days have no stamina." },
    complete: { zh: "总算搞定一段了，勉强夸你一下吧。", en: "Finally finished a section. I guess I'll give you some credit." },
    quotes: [
      { zh: "就这？水口都没剪平，你管这叫拼模型？", en: "Is that all? You left nub marks everywhere. You call this building?" },
      { zh: "刻线歪了！你的手是借来的吗？", en: "The scribing is crooked! Did you borrow those hands?" },
      { zh: "渗线渗得跟个鬼画符一样，重来！", en: "Panel lines look like scribbles. Redo it!" },
      { zh: "你这补色，狗看了都摇头。", en: "Even a dog would shake its head at your paint job." },
      { zh: "别以为坐得久就能出好作品，效率呢？", en: "Don't think sitting longer makes a good work. What about efficiency?" },
      { zh: "保护漆喷得跟下雪似的，真行啊你。", en: "You sprayed topcoat like it's falling snow. Great job... not." },
      { zh: "你这机体要是会说话，早就骂你了。", en: "If this mobile suit could talk, it would have cursed you out by now." },
      { zh: "听好了，砂纸从低目数到高目数，别跳！", en: "Listen, sandpaper goes from low grit to high grit. Don't skip!" },
      { zh: "再摸鱼，我就顺着网线过去帮你把模型扔了。", en: "Slack off again, and I'll throw your model out through the internet." },
      { zh: "啧，进度这么慢，万代出新胶的速度都比你快。", en: "Tsk, Bandai releases new kits faster than your progress." },
      { zh: "手稳一点行不行？你是得了帕金森吗？", en: "Can you steady your hands? Do you have Parkinson's?" },
      { zh: "别盯着看了，看能把它看成完美素组吗？", en: "Stop staring. Will staring make it a perfect OOB build?" }
    ]
  },
  xiaoran: {
    id: 'xiaoran',
    name: '小燃',
    enName: 'Blaze',
    avatar: '⚡️',
    color: '#10b981',
    start: { zh: "全军出击！今天的目标是哪台机体？！", en: "All forces attack! What's our target today?!" },
    pause: { zh: "原地待命！补充一点能量再战！", en: "Stand by! Replenish energy before the next battle!" },
    complete: { zh: "战报已记录！你的战果将被载入史册！", en: "Battle report recorded! Your results will be written in history!" },
    quotes: [
      { zh: "燃起来！为了人类的可能性，注入灵魂吧！", en: "Ignite your spirit! Let's push the limits of human possibility!" },
      { zh: "这把剪钳，就是你斩断烦恼的利刃！", en: "These nippers are the blade to cut through your worries!" },
      { zh: "刻线！这是赋予机甲灵魂的回路！", en: "Scribing! This is the circuit that gives the mecha a soul!" },
      { zh: "渗线的瞬间，机甲就拥有了呼吸！", en: "At the moment of panel lining, the mecha breathes!" },
      { zh: "补色完成！这就是艺术家的觉醒！", en: "Paint complete! This is the artist's awakening!" },
      { zh: "保护漆！为我们的杰作披上无敌的装甲！", en: "Topcoat! Clad our masterpiece in invincible armor!" },
      { zh: "不要停下来！前面的道路还有无尽的星辰大海！", en: "Don't stop! The road ahead has endless stars and seas!" },
      { zh: "感受到指尖的震动了吗？那是机甲在回应你！", en: "Feel the vibration on your fingertips? That's the mecha responding!" },
      { zh: "每一次拼装，都是一场史诗级的战斗！", en: "Every build is an epic battle!" },
      { zh: "太棒了！你的动作堪比王牌机师！", en: "Awesome! Your movements are like an ace pilot!" },
      { zh: "哪怕是不起眼的内构，也藏着无限的可能！", en: "Even the hidden inner frame holds infinite possibilities!" },
      { zh: "来吧！让这台机体爆发出最耀眼的光芒！", en: "Come on! Let this suit unleash its most dazzling light!" }
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