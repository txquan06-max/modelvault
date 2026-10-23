import { StorageManager } from '../core/StorageManager';
import { UserManager } from '../core/UserManager';
import { BOTS, type BotType } from '../core/QuoteEngine';

interface ShareCardProps {
  model: any;
  totalTime: number;
  isZh: boolean;
  username: string;
  level: number;
  currentBot: BotType;
  equippedTitle: string;
  formatTime: (sec: number) => string;
  t: (key: string) => string;
}

// 🌟 预加载图片的工具函数
const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

export const generateShareCard = async (props: ShareCardProps) => {
  const { model, totalTime, isZh, username, level, currentBot, equippedTitle, formatTime, t } = props;
  
  const canvas = document.createElement('canvas');
  canvas.width = 800; canvas.height = 1200; // 拉长一点，更适合手机屏幕截图
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context failed');

  const botData = BOTS[currentBot];
  const botColor = botData.color;

  // 1. 绘制深色背景和专属光晕
  ctx.fillStyle = '#09090b'; 
  ctx.fillRect(0, 0, 800, 1200);

  const gradient = ctx.createRadialGradient(400, 600, 100, 400, 600, 600);
  gradient.addColorStop(0, `${botColor}30`);
  gradient.addColorStop(1, 'transparent');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 800, 1200);

  // 2. 绘制模型封面作为背景暗纹
  if (model.coverImage) {
    try {
      let imgUrl = model.coverImage;
      if (imgUrl.startsWith('local://')) {
        const blobUrl = await StorageManager.loadLocalFileUrl(imgUrl);
        if (blobUrl) imgUrl = blobUrl;
      }
      const img = await loadImage(imgUrl);
      const scale = Math.max(800 / img.width, 1200 / img.height);
      const w = img.width * scale; const h = img.height * scale;
      const x = (800 - w) / 2; const y = (1200 - h) / 2;
      
      ctx.globalAlpha = 0.3;
      ctx.drawImage(img, x, y, w, h);
      ctx.globalAlpha = 1.0;
      
      // 加上一层渐变，让底部文字清晰
      const bottomGrad = ctx.createLinearGradient(0, 600, 0, 1200);
      bottomGrad.addColorStop(0, 'rgba(9,9,11,0.4)');
      bottomGrad.addColorStop(1, 'rgba(9,9,11,1)');
      ctx.fillStyle = bottomGrad;
      ctx.fillRect(0, 600, 800, 600);
    } catch (e) { console.warn('背景图加载失败'); }
  }

  // 3. 绘制赛博网格
  ctx.strokeStyle = `${botColor}15`; 
  ctx.lineWidth = 1;
  for (let i = 0; i < 800; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 1200); ctx.stroke(); }
  for (let i = 0; i < 1200; i += 40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(800, i); ctx.stroke(); }

  // 4. 顶部 Header
  ctx.fillStyle = botColor;
  ctx.fillRect(60, 80, 8, 50);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 36px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('MODELJOURNEY', 85, 115);
  
  ctx.fillStyle = '#888';
  ctx.font = '18px monospace';
  ctx.fillText('BUILD REPORT // 战报', 85, 145);

  // 5. 绘制模型头像（如果有的话可以画个圆，这里我们跳过，直接放文字）
  // 其实这里可以画一个圆形的塑灵头像
  try {
    const avatarImg = await loadImage(botData.avatar);
    ctx.save();
    ctx.beginPath();
    ctx.arc(680, 110, 40, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(avatarImg, 640, 70, 80, 80);
    ctx.restore();
    ctx.strokeStyle = botColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(680, 110, 42, 0, Math.PI * 2);
    ctx.stroke();
  } catch (e) {}

  // 6. 模型名称与信息
  ctx.fillStyle = '#fff'; 
  ctx.font = 'bold 56px sans-serif'; 
  ctx.textAlign = 'center'; 
  ctx.fillText(isZh ? model.name.zh : model.name.en, 400, 780);
  
  ctx.fillStyle = botColor; 
  ctx.font = 'bold 24px monospace'; 
  ctx.fillText(`[ ${model.grade} | ${isZh ? model.series.zh : model.series.en} ]`, 400, 830);

  // 7. 核心时长数据
  ctx.fillStyle = '#10b981'; 
  ctx.font = 'bold 100px monospace'; 
  ctx.fillText(formatTime(totalTime), 400, 950);
  
  ctx.fillStyle = '#666'; 
  ctx.font = 'bold 18px monospace'; 
  ctx.fillText('TOTAL FOCUS TIME', 400, 990);

  // 8. 绘制底部的数据面板 (机师、等级、称号)
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.strokeStyle = `${botColor}50`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(60, 1030, 680, 100, 16);
  ctx.fill();
  ctx.stroke();

  const title = UserManager.getTitleLibrary().find(t => t.id === equippedTitle);
  const titleName = title ? t(title.nameKey) : (isZh ? '新晋胶佬' : 'New Builder');

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`🧑‍🔧 ${username}`, 90, 1075);
  
  ctx.fillStyle = '#f59e0b';
  ctx.fillText(`Lv.${level}`, 300, 1075);

  ctx.fillStyle = title ? title.color : '#888';
  ctx.textAlign = 'right';
  ctx.fillText(`[ ${titleName} ]`, 710, 1075);

  // 9. 底部水印
  ctx.fillStyle = '#444';
  ctx.font = '14px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`Witnessed by Animold [ ${isZh ? botData.name : botData.enName} ]`, 400, 1160);

  return canvas.toDataURL('image/jpeg', 0.9);
};