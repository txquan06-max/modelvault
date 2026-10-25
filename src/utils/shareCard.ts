import { StorageManager } from '../core/StorageManager';
import { UserManager } from '../core/UserManager';
import { BOTS, type BotType } from '../core/QuoteEngine';
import type { Model } from '../core/ModelManager';

export type ShareCardTemplate = 'cyber' | 'minimal' | 'glitch';

interface ShareCardProps {
  model: Model;
  totalTime: number;
  stageTimes: Record<string, number>;
  template: ShareCardTemplate;
  isZh: boolean;
  username: string;
  level: number;
  currentBot: BotType;
  equippedTitle: string;
  formatTime: (sec: number) => string;
  t: (key: string) => string;
}

const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

// 🌟 新增：限制文本宽度的辅助函数（超长则缩小字号，极限情况截断加省略号）
const fitText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number, baseFontSize: number, fontFamily: string, fontWeight = 'bold', minFontSize = 24) => {
  let fontSize = baseFontSize;
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  while (ctx.measureText(text).width > maxWidth && fontSize > minFontSize) {
    fontSize -= 2;
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  }
  if (ctx.measureText(text).width > maxWidth) {
    let truncated = text;
    while (truncated.length > 0 && ctx.measureText(truncated + '...').width > maxWidth) {
      truncated = truncated.slice(0, -1);
    }
    return truncated + '...';
  }
  return text;
};

export const generateShareCard = async (props: ShareCardProps) => {
  const { model, totalTime, stageTimes, template, isZh, username, level, currentBot, equippedTitle, formatTime, t } = props;
  
  const canvas = document.createElement('canvas');
  canvas.width = 800; 
  canvas.height = 1200;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context failed');

  const botData = BOTS[currentBot];
  const botColor = botData.color;

  // 准备基础数据
  const title = UserManager.getTitleLibrary().find(t => t.id === equippedTitle);
  // 兜底称号改为 i18n（原硬编码 isZh ? '新晋胶佬' : 'New Builder'）
  const titleName = title ? t(title.nameKey) : t('share_default_title');
  // 数据字段，保留 isZh 选择语言版本
  const modelName = isZh ? model.name.zh : model.name.en;
  const seriesName = isZh ? model.series.zh : model.series.en;

  let coverImg: HTMLImageElement | null = null;
  if (model.coverImage) {
    try {
      let imgUrl = model.coverImage;
      if (imgUrl.startsWith('local://')) {
        const blobUrl = await StorageManager.loadLocalFileUrl(imgUrl);
        if (blobUrl) imgUrl = blobUrl;
      }
      coverImg = await loadImage(imgUrl);
    } catch (e) { console.warn('背景图加载失败'); }
  }

  let avatarImg: HTMLImageElement | null = null;
  try { avatarImg = await loadImage(botData.avatar); } catch(e) {}

  // ============================================
  // 🎨 模板 1: 赛博光晕 (Cyber)
  // ============================================
  if (template === 'cyber') {
    ctx.fillStyle = '#09090b'; 
    ctx.fillRect(0, 0, 800, 1200);

    const gradient = ctx.createRadialGradient(400, 600, 100, 400, 600, 600);
    gradient.addColorStop(0, `${botColor}30`);
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 1200);

    if (coverImg) {
      const scale = Math.max(800 / coverImg.width, 1200 / coverImg.height);
      const w = coverImg.width * scale; const h = coverImg.height * scale;
      const x = (800 - w) / 2; const y = (1200 - h) / 2;
      ctx.globalAlpha = 0.3;
      ctx.drawImage(coverImg, x, y, w, h);
      ctx.globalAlpha = 1.0;
      
      const bottomGrad = ctx.createLinearGradient(0, 600, 0, 1200);
      bottomGrad.addColorStop(0, 'rgba(9,9,11,0.4)');
      bottomGrad.addColorStop(1, 'rgba(9,9,11,1)');
      ctx.fillStyle = bottomGrad;
      ctx.fillRect(0, 600, 800, 600);
    }

    // 赛博网格
    ctx.strokeStyle = `${botColor}15`; 
    ctx.lineWidth = 1;
    for (let i = 0; i < 800; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 1200); ctx.stroke(); }
    for (let i = 0; i < 1200; i += 40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(800, i); ctx.stroke(); }

    ctx.fillStyle = botColor;
    ctx.fillRect(60, 80, 8, 50);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('MODELJOURNEY', 85, 115);
    
    ctx.fillStyle = '#888';
    ctx.font = '18px monospace';
    // 修复：'BUILD REPORT // 战报' 拆分为英文美术前缀 + i18n 标签
    ctx.fillText(`BUILD REPORT // ${t('share_report_label')}`, 85, 145);

    if (avatarImg) {
      ctx.save();
      ctx.beginPath(); ctx.arc(680, 110, 40, 0, Math.PI * 2); ctx.clip();
      ctx.drawImage(avatarImg, 640, 70, 80, 80);
      ctx.restore();
      ctx.strokeStyle = botColor; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(680, 110, 42, 0, Math.PI * 2); ctx.stroke();
    }

    // 使用 fitText 限制宽度 680
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; 
    const fittedModelName = fitText(ctx, modelName, 680, 56, 'sans-serif', 'bold', 28);
    ctx.fillText(fittedModelName, 400, 700);

    ctx.fillStyle = botColor; ctx.font = 'bold 24px monospace'; 
    ctx.fillText(`[ ${model.grade} | ${seriesName} ]`, 400, 750);

    ctx.fillStyle = '#10b981'; ctx.font = 'bold 100px monospace'; 
    ctx.fillText(formatTime(totalTime), 400, 870);
    ctx.fillStyle = '#666'; ctx.font = 'bold 18px monospace'; 
    ctx.fillText('TOTAL FOCUS TIME', 400, 910);

    // 极简数据面板
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.strokeStyle = `${botColor}50`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(60, 1030, 680, 100, 16); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(`🧑‍🔧 ${username}`, 90, 1075);
    ctx.fillStyle = '#f59e0b'; ctx.fillText(`Lv.${level}`, 300, 1075);
    ctx.fillStyle = title ? title.color : '#888'; ctx.textAlign = 'right'; ctx.fillText(`[ ${titleName} ]`, 710, 1075);
    ctx.fillStyle = '#444'; ctx.font = '14px monospace'; ctx.textAlign = 'center';
    ctx.fillText(`Witnessed by Animold [ ${isZh ? botData.name : botData.enName} ]`, 400, 1160);
  }

  // ============================================
  // 🎨 模板 2: 极简白描 (Minimal)
  // ============================================
  else if (template === 'minimal') {
    ctx.fillStyle = '#f8f9fa'; 
    ctx.fillRect(0, 0, 800, 1200);

    if (coverImg) {
      const scale = Math.max(800 / coverImg.width, 600 / coverImg.height);
      const w = coverImg.width * scale; const h = coverImg.height * scale;
      const x = (800 - w) / 2; const y = 0;
      ctx.drawImage(coverImg, x, y, w, h);
    } else {
      ctx.fillStyle = '#e9ecef'; ctx.fillRect(0, 0, 800, 600);
    }

    // 中间过渡线
    ctx.fillStyle = botColor; ctx.fillRect(0, 596, 800, 8);

    ctx.fillStyle = '#212529'; ctx.textAlign = 'center';
    const fittedModelName = fitText(ctx, modelName, 680, 60, 'sans-serif', 'bold', 30);
    ctx.fillText(fittedModelName, 400, 720);

    ctx.fillStyle = '#6c757d'; ctx.font = '24px sans-serif';
    ctx.fillText(`${model.grade} | ${seriesName}`, 400, 770);

    ctx.fillStyle = '#212529'; ctx.font = 'bold 100px monospace';
    ctx.fillText(formatTime(totalTime), 400, 900);
    ctx.fillStyle = '#adb5bd'; ctx.font = '16px monospace';
    ctx.fillText('TOTAL FOCUS TIME', 400, 940);

    // 耗时拆分 (最多展示前 3 个工序)
    const topStages = Object.entries(stageTimes)
      .filter(([_, time]) => time > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    
    let startY = 990;
    topStages.forEach(([stageKey, time], idx) => {
      ctx.fillStyle = '#495057'; ctx.font = '20px sans-serif'; ctx.textAlign = 'left';
      ctx.fillText(`• ${t(stageKey)}`, 200, startY + idx * 35);
      ctx.fillStyle = '#212529'; ctx.font = 'bold 20px monospace'; ctx.textAlign = 'right';
      ctx.fillText(formatTime(time), 600, startY + idx * 35);
    });

    ctx.fillStyle = '#adb5bd'; ctx.font = '18px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(`${username} (Lv.${level})`, 60, 1140);
    ctx.textAlign = 'right';
    ctx.fillText(`Witnessed by ${isZh ? botData.name : botData.enName}`, 740, 1140);
  }

  // ============================================
  // 🎨 模板 3: 故障风 (Glitch)
  // ============================================
  else if (template === 'glitch') {
    ctx.fillStyle = '#0a0a0a'; 
    ctx.fillRect(0, 0, 800, 1200);

    if (coverImg) {
      // 错位重影
      ctx.globalAlpha = 0.4;
      ctx.drawImage(coverImg, -10, 0, 820, 820);
      ctx.fillStyle = 'rgba(255,0,0,0.3)';
      ctx.fillRect(0, 0, 800, 800);
      ctx.globalCompositeOperation = 'screen';
      ctx.drawImage(coverImg, 10, 0, 800, 800);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = 'rgba(10,10,10,0.6)'; ctx.fillRect(0, 0, 800, 800);
    }

    // 扫描线
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    for (let i = 0; i < 1200; i += 4) { ctx.fillRect(0, i, 800, 1); }

    ctx.fillStyle = '#ff003c'; ctx.font = 'bold 28px monospace'; ctx.textAlign = 'left';
    ctx.fillText('SYSTEM_DATA_RECOVERED', 60, 100);
    ctx.fillStyle = '#00f0ff'; ctx.fillText('ERR_0x00FF', 60, 140);

    // 错位字效
    ctx.textAlign = 'center';
    const fittedModelName = fitText(ctx, modelName, 680, 70, 'monospace', 'bold', 30);
    ctx.fillStyle = '#ff003c'; ctx.fillText(fittedModelName, 405, 705);
    ctx.fillStyle = '#00f0ff'; ctx.fillText(fittedModelName, 395, 695);
    ctx.fillStyle = '#ffffff'; ctx.fillText(fittedModelName, 400, 700);

    ctx.fillStyle = '#888'; ctx.font = '24px monospace';
    ctx.fillText(`> ${model.grade} / ${seriesName}`, 400, 760);

    ctx.fillStyle = '#00f0ff'; ctx.font = 'bold 120px monospace';
    ctx.fillText(formatTime(totalTime), 400, 920);
    ctx.fillStyle = '#555'; ctx.font = '18px monospace';
    ctx.fillText('== TOTAL_LOG_TIME ==', 400, 960);

    ctx.fillStyle = '#fff'; ctx.font = '18px monospace'; ctx.textAlign = 'left';
    ctx.fillText(`USER: ${username}`, 80, 1080);
    ctx.fillText(`LV: ${level} | TITLE: ${titleName}`, 80, 1120);
    
    ctx.fillStyle = '#ff003c'; ctx.textAlign = 'right';
    ctx.fillText(`LINK_ESTABLISHED: ${isZh ? botData.name : botData.enName}`, 720, 1120);
  }

  return canvas.toDataURL('image/jpeg', 0.9);
};