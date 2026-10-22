export type BotType = 'tu' | 'milkfoam' | 'xiaoran';

export interface BotData {
  id: BotType;
  name: string;
  enName: string; // 🌟 新增英文名
  color: string;
  start: string;
  pause: string;
  complete: string;
  quotes: string[];
}

export const BOTS: Record<BotType, BotData> = {
  tu: {
    id: 'tu',
    name: '途酱',
    enName: 'Tia',
    color: '#3b82f6', // 蓝色
    start: "旅途开始，今天做哪个部位呢？ / Let's start the journey. Which part today?",
    pause: "休息一下，喝口水，看看窗外的风景吧。 / Take a break, hydrate, and look out the window.",
    complete: "记录完毕，每一秒都是你留下的足迹。 / Recorded. Every second is a footprint you've left.",
    quotes: [
      "素组是男人的浪漫，慢慢来，别着急。 / Straight build is romance. Take your time.",
      "注意剪水口，留一点余地打磨。 / Watch the nub marks, leave room for sanding.",
      "刻线要轻，就像抚摸你的钱包。 / Scribe lightly, like touching your wallet.",
      "渗线液别流得太宽，小心溢出来。 / Don't let the panel line wash run too wide.",
      "做胶的时候，时间总是过得很快。 / Time flies when you're building.",
      "你的每一次打磨，都是对模型的尊重。 / Every sanding is a sign of respect to the model.",
      "很多大佬都是从素组开始的，别急。 / Many pros started with straight builds. Don't rush.",
      "用爱去制作，模型会感受到的。 / Build with love, the model will feel it.",
      "不要被别人的进度影响，你有自己的节奏。 / Don't be influenced by others' pace. You have your own.",
      "用心做出来的作品，是有灵魂的。 / A work made with heart has a soul.",
      "做胶能让人忘掉烦恼。 / Building helps you forget your worries.",
      "每次拼装，都是一次修行。 / Every build is a practice."
    ]
  },
  milkfoam: {
    id: 'milkfoam',
    name: '奶盖',
    enName: 'Boba',
    color: '#ec4899', // 粉色/红色
    start: "磨蹭什么呢？还不快点开始！ / Stop dawdling, let's go!",
    pause: "这就累了？现在的胶佬体力真差。 / Tired already? Modelers these days...",
    complete: "总算搞定一段了，勉强夸你一下吧。 / Finally done with a section. I guess I'll give you some credit.",
    quotes: [
      "就这？水口都没剪平，你管这叫拼模型？ / That's it? Nubs aren't even flat. You call this building?",
      "刻线歪了！你的手是借来的吗？ / The scribing is crooked! Did you borrow those hands?",
      "渗线渗得跟个鬼画符一样，重来！ / Panel lines look like scribbles. Redo it!",
      "你这补色，狗看了都摇头。 / Even a dog would shake its head at your paint job.",
      "别以为坐得久就能出好作品，效率呢？ / Don't think sitting longer makes a good work. What about efficiency?",
      "保护漆喷得跟下雪似的，真行啊你。 / Topcoat looks like falling snow. Great job... not.",
      "你这机体要是会说话，早就骂你了。 / If this mobile suit could talk, it would have cursed you out by now.",
      "听好了，砂纸从低目数到高目数，别跳！ / Listen, sandpaper goes from low grit to high grit. Don't skip!",
      "再摸鱼，我就顺着网线过去帮你把模型扔了。 / Slack off again, and I'll throw your model out through the internet.",
      "啧，进度这么慢，万代出新胶的速度都比你快。 / Tsk, Bandai releases new kits faster than your progress.",
      "手稳一点行不行？你是得了帕金森吗？ / Can you steady your hands? Do you have Parkinson's?",
      "别盯着看了，看能把它看成完美素组吗？ / Stop staring. Will staring make it a perfect straight build?"
    ]
  },
  xiaoran: {
    id: 'xiaoran',
    name: '小燃',
    enName: 'Blaze',
    color: '#10b981', // 绿色
    start: "全军出击！今天的目标是哪台机体？！ / All forces attack! What's our target today?!",
    pause: "原地待命！补充一点能量再战！ / Stand by! Replenish energy before the next battle!",
    complete: "战报已记录！你的战果将被载入史册！ / Battle report recorded! Your results will be written in history!",
    quotes: [
      "燃起来！为了人类的可能性，注入灵魂吧！ / Burn bright! Inject your soul for the possibility of humanity!",
      "这把剪钳，就是你斩断烦恼的利刃！ / These nippers are the blade to cut through your worries!",
      "刻线！这是赋予机甲灵魂的回路！ / Scribing! This is the circuit that gives the mecha a soul!",
      "渗线的瞬间，机甲就拥有了呼吸！ / At the moment of panel lining, the mecha breathes!",
      "补色完成！这就是艺术家的觉醒！ / Paint complete! This is the artist's awakening!",
      "保护漆！为我们的杰作披上无敌的装甲！ / Topcoat! Clad our masterpiece in invincible armor!",
      "不要停下来！前面的道路还有无尽的星辰大海！ / Don't stop! The road ahead has endless stars and seas!",
      "感受到指尖的震动了吗？那是机甲在回应你！ / Feel the vibration on your fingertips? That's the mecha responding!",
      "每一次拼装，都是一场史诗级的战斗！ / Every build is an epic battle!",
      "太棒了！你的动作堪比王牌机师！ / Awesome! Your movements are like an ace pilot!",
      "哪怕是不起眼的内构，也藏着无限的可能！ / Even the hidden inner frame holds infinite possibilities!",
      "来吧！让这台机体爆发出最耀眼的光芒！ / Come on! Let this suit unleash its most dazzling light!"
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

  static getRandom(): string {
    const botData = BOTS[this.currentBot];
    const randomIndex = Math.floor(Math.random() * botData.quotes.length);
    return botData.quotes[randomIndex] || "开始专注吧！ / Let's focus!";
  }

  static getStartQuote(): string { return BOTS[this.currentBot].start; }
  static getPauseQuote(): string { return BOTS[this.currentBot].pause; }
  static getCompleteQuote(): string { return BOTS[this.currentBot].complete; }
}