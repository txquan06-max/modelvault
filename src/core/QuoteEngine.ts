// 本地台词库
const QUOTES = [
  "素组是男人的浪漫，慢慢来，别着急。",
  "注意剪水口，留一点余地打磨。",
  "刻线要轻，就像抚摸你的钱包。",
  "渗线液别流得太宽，小心溢出来。",
  "补色的时候，记得先调好色调。",
  "保护漆记得要在通风的地方喷哦！",
  "做胶的时候，时间总是过得很快。",
  "累了吗？休息一下，揉揉眼睛。",
  "这个模型的骨架设计很扎实，注意关节方向。",
  "听说组完这个，你就是群里的素组大师了。",
  "别忘了，水贴是在保护漆之后贴的。",
  "今天的进度不错，继续保持！"
];

export class QuoteEngine {
  // 获取随机一条台词
  static getRandom(): string {
    return QUOTES[Math.floor(Math.random() * QUOTES.length)];
  }

  // 根据动作返回特定台词
  static getStartQuote(): string {
    return "开始专注！今天是做哪个部位呢？";
  }

  static getPauseQuote(): string {
    return "休息一下，喝口水吧。";
  }

  static getCompleteQuote(): string {
    return "记录完毕！每一秒都是心血。";
  }
}