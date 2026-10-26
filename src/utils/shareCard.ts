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
    if (!src.startsWith('blob:') && !src.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

const fitText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  baseFontSize: number,
  fontFamily: string,
  fontWeight = 'bold',
  minFontSize = 24
) => {
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

const resetShadow = (ctx: CanvasRenderingContext2D) => {
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
};

const drawCoverImage = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number, dy: number, dw: number, dh: number
) => {
  const scale = Math.max(dw / img.width, dh / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  const x = dx + (dw - w) / 2;
  const y = dy + (dh - h) / 2;

  ctx.save();
  ctx.beginPath();
  ctx.rect(dx, dy, dw, dh);
  ctx.clip();
  ctx.drawImage(img, x, y, w, h);
  ctx.restore();
};

// 🌟 自定义梯形切片
const drawCustomSlice = (
  ctx: CanvasRenderingContext2D,
  sourceImg: CanvasImageSource,
  p1: { x: number, y: number },
  p2: { x: number, y: number },
  thickness1: number, // 左侧厚度
  thickness2: number, // 右侧厚度（用于收窄）
  offsetX: number,
  offsetY: number,
  overlayColor?: string
) => {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.lineTo(p2.x, p2.y + thickness2); // 右边缘（收窄）
  ctx.lineTo(p1.x, p1.y + thickness1); // 左边缘
  ctx.closePath();
  ctx.clip();

  // 画错位的原图
  ctx.drawImage(sourceImg, offsetX, offsetY);

  // 叠加色彩与发光边缘
  if (overlayColor) {
    ctx.fillStyle = overlayColor;
    ctx.fillRect(0, 0, 800, 800);
    
    // 给切割线增加锐利的霓虹高光
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = overlayColor.replace(/rgba\(([\d,\s]+).*\)/, 'rgb($1)');
    ctx.shadowBlur = 10;

    // 上边缘
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();

    // 下边缘（随收窄倾斜）
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y + thickness1);
    ctx.lineTo(p2.x, p2.y + thickness2);
    ctx.stroke();
    
    resetShadow(ctx);
  }

  ctx.restore();
};

export const generateShareCard = async (props: ShareCardProps): Promise<Blob> => {
  const { model, totalTime, stageTimes, template, isZh, username, level, currentBot, equippedTitle, formatTime, t } = props;

  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 1200;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context failed');

  const botData = BOTS[currentBot];
  const botColor = botData.color;

  const title = UserManager.getTitleLibrary().find(t => t.id === equippedTitle);
  const titleName = title ? t(title.nameKey) : t('share_default_title');
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
    } catch (e) { console.warn('封面图加载失败', e); }
  }

  let avatarImg: HTMLImageElement | null = null;
  try { avatarImg = await loadImage(botData.avatar); } catch (e) {}

  // ============================================
  // 🎨 模板 1: 极简白描 (Minimal)
  // ============================================
  if (template === 'minimal') {
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, 0, 800, 1200);

    if (coverImg) {
      drawCoverImage(ctx, coverImg, 0, 0, 800, 700);
      const fadeGrad = ctx.createLinearGradient(0, 550, 0, 700);
      fadeGrad.addColorStop(0, 'rgba(241, 245, 249, 0)');
      fadeGrad.addColorStop(1, 'rgba(241, 245, 249, 1)');
      ctx.fillStyle = fadeGrad;
      ctx.fillRect(0, 550, 800, 150);
    } else {
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(0, 0, 800, 700);
    }

    ctx.fillStyle = botColor;
    ctx.fillRect(0, 700, 800, 6);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#0f172a';
    const fittedModelName = fitText(ctx, modelName, 680, 60, 'sans-serif', 'bold', 30);
    ctx.fillText(fittedModelName, 400, 800);

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(`${model.grade}  |  ${seriesName}`, 400, 850);

    ctx.fillStyle = '#000000';
    ctx.font = 'bold 96px monospace';
    ctx.fillText(formatTime(totalTime), 400, 980);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(isZh ? '总专注时长' : 'TOTAL FOCUS TIME', 400, 1020);

    const topStages = Object.entries(stageTimes)
      .filter(([_, time]) => time > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    if (topStages.length > 0) {
      let startY = 1080;
      topStages.forEach(([stageKey, time], idx) => {
        const y = startY + idx * 32;
        ctx.fillStyle = '#334155'; ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'left';
        ctx.fillText(`• ${t(stageKey)}`, 180, y);
        ctx.fillStyle = '#0f172a'; ctx.font = 'bold 20px monospace'; ctx.textAlign = 'right';
        ctx.fillText(formatTime(time), 620, y);
      });
    }

    ctx.fillStyle = '#64748b'; ctx.font = '18px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(`${username} (Lv.${level})`, 60, 1170);
    ctx.textAlign = 'right';
    ctx.fillText(`Witnessed by ${isZh ? botData.name : botData.enName}`, 740, 1170);

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => { if (blob) resolve(blob); else reject(new Error('Failed')); }, 'image/jpeg', 0.95);
    });
  }

  // ============================================
  // 🎨 模板 2: 赛博光晕 (Cyber)
  // ============================================
  if (template === 'cyber') {
    const NEON_CYAN = '#00f0ff';
    const NEON_PINK = '#ff00aa';
    const NEON_YELLOW = '#fde047';

    ctx.fillStyle = '#050110';
    ctx.fillRect(0, 0, 800, 1200);

    if (coverImg) {
      ctx.globalAlpha = 0.95;
      drawCoverImage(ctx, coverImg, 0, 0, 800, 750);
      ctx.globalAlpha = 1.0;

      const fadeGrad = ctx.createLinearGradient(0, 450, 0, 750);
      fadeGrad.addColorStop(0, 'rgba(5, 1, 16, 0)');
      fadeGrad.addColorStop(1, 'rgba(5, 1, 16, 1)');
      ctx.fillStyle = fadeGrad;
      ctx.fillRect(0, 450, 800, 300);
    }

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 800; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 1200); ctx.stroke(); }
    for (let i = 0; i < 1200; i += 40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(800, i); ctx.stroke(); }

    ctx.fillStyle = 'rgba(0, 240, 255, 0.05)';
    for (let y = 0; y < 750; y += 3) { ctx.fillRect(0, y, 800, 1); }

    ctx.fillStyle = NEON_CYAN; ctx.fillRect(60, 80, 8, 50);
    ctx.shadowColor = NEON_CYAN; ctx.shadowBlur = 15; ctx.fillRect(60, 80, 8, 50);
    resetShadow(ctx);

    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 36px monospace'; ctx.textAlign = 'left';
    ctx.fillText('MODELJOURNEY', 85, 115);
    ctx.fillStyle = '#94a3b8'; ctx.font = '16px monospace';
    ctx.fillText(`BUILD REPORT // ${t('share_report_label')}`, 85, 145);

    if (avatarImg) {
      ctx.save(); ctx.beginPath(); ctx.arc(680, 110, 42, 0, Math.PI * 2); ctx.clip();
      ctx.drawImage(avatarImg, 638, 68, 84, 84); ctx.restore();
      ctx.shadowColor = NEON_CYAN; ctx.shadowBlur = 15; ctx.strokeStyle = NEON_CYAN; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(680, 110, 42, 0, Math.PI * 2); ctx.stroke();
      resetShadow(ctx);
      ctx.shadowColor = NEON_PINK; ctx.shadowBlur = 10; ctx.strokeStyle = NEON_PINK; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(680, 110, 46, 0, Math.PI * 2); ctx.stroke();
      resetShadow(ctx);
    }

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    const fittedModelName = fitText(ctx, modelName, 680, 56, 'sans-serif', 'bold', 28);
    
    ctx.shadowColor = NEON_CYAN; ctx.shadowBlur = 30;
    ctx.fillText(fittedModelName, 400, 330);
    
    resetShadow(ctx);
    ctx.strokeStyle = NEON_CYAN; ctx.lineWidth = 2;
    ctx.strokeText(fittedModelName, 400, 330);
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 0.5;
    ctx.strokeText(fittedModelName, 400, 330);

    ctx.font = 'bold 22px monospace';
    ctx.fillStyle = NEON_PINK;
    ctx.shadowColor = NEON_PINK; ctx.shadowBlur = 10;
    ctx.fillText(`[ ${model.grade} | ${seriesName} ]`, 400, 780);
    resetShadow(ctx);

    ctx.fillStyle = NEON_YELLOW;
    ctx.font = 'bold 100px monospace';
    ctx.shadowColor = NEON_YELLOW; ctx.shadowBlur = 40;
    ctx.fillText(formatTime(totalTime), 400, 900);
    resetShadow(ctx);

    ctx.fillStyle = '#6b7280'; ctx.font = '18px monospace';
    ctx.fillText('TOTAL FOCUS TIME', 400, 940);

    ctx.fillStyle = 'rgba(10, 1, 24, 0.85)';
    ctx.beginPath(); ctx.roundRect(60, 1010, 680, 110, 16); ctx.fill();
    ctx.shadowColor = NEON_CYAN; ctx.shadowBlur = 12; ctx.strokeStyle = NEON_CYAN; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(60, 1010, 680, 110, 16); ctx.stroke();
    resetShadow(ctx);

    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(`🧑‍🔧 ${username}`, 90, 1060);
    ctx.fillStyle = NEON_YELLOW; ctx.fillText(`Lv.${level}`, 320, 1060);
    ctx.fillStyle = title ? title.color : NEON_PINK; ctx.textAlign = 'right';
    ctx.fillText(`[ ${titleName} ]`, 710, 1060);

    ctx.fillStyle = '#6b7280'; ctx.font = '14px monospace'; ctx.textAlign = 'center';
    ctx.fillText(`WITNESSED BY ANIMOLD [ ${isZh ? botData.name : botData.enName} ]`, 400, 1100);
    ctx.fillStyle = '#4b5563'; ctx.fillText('// END OF BUILD REPORT //', 400, 1170);

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => { if (blob) resolve(blob); else reject(new Error('Failed')); }, 'image/jpeg', 0.95);
    });
  }

  // ============================================
  // 🎨 模板 3: 故障风 (Glitch) - 小偏移匹配版
  // ============================================
  if (template === 'glitch') {
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, 800, 1200);

    if (coverImg) {
      const offscreen = document.createElement('canvas');
      offscreen.width = 800;
      offscreen.height = 800;
      const offCtx = offscreen.getContext('2d');
      if (offCtx) {
        drawCoverImage(offCtx, coverImg, 0, 0, 800, 800);
      }

      // 基础原图
      ctx.drawImage(offscreen, 0, 0);
      ctx.fillStyle = 'rgba(10, 10, 10, 0.15)'; 
      ctx.fillRect(0, 0, 800, 800);

      // 增强型红/青色差分离
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.35;

      ctx.save();
      ctx.translate(-12, 4); // 红色向左下
      ctx.drawImage(offscreen, 0, 0);
      ctx.fillStyle = '#ff003c';
      ctx.fillRect(0, 0, 800, 800);
      ctx.restore();

      ctx.save();
      ctx.translate(12, -4); // 青色向右上
      ctx.drawImage(offscreen, 0, 0);
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(0, 0, 800, 800);
      ctx.restore();

      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1.0;

      // 🌟 三条按用户指定点位、互不碰撞、从左宽到右窄收尾的斜线错位
      // 大幅度收拢了 offsetX/offsetY，让切出的图像沿着原斜线方向“微小滑动”
      
      // 1. 上 1/2 至 下 1/4，向左下微移
      drawCustomSlice(
        ctx, offscreen, 
        { x: 30, y: 0 }, { x: 800, y: 650 }, 
        160, 90, 
        -20, 12, 
        'rgba(0, 240, 255, 0.25)'
      );

      // 2. 下 1/4 至 下 2/3，向右上微移
      drawCustomSlice(
        ctx, offscreen, 
        { x: 0, y: 520 }, { x: 800, y: 110 }, 
        95, 200,
        22, -15, 
        'rgba(255, 0, 60, 0.25)'
      );

      // 3. 下 2/3 至 下 5/6，向左上微移
      drawCustomSlice(
        ctx, offscreen, 
        { x: 0, y: 720 }, { x: 800, y: 520 }, 
        50, 150, 
        -15, -10, 
        'rgba(255, 255, 255, 0.25)'
      );
    }

    ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
    for (let i = 0; i < 800; i += 4) { ctx.fillRect(0, i, 800, 1); }
    
    const fadeGrad = ctx.createLinearGradient(0, 700, 0, 800);
    fadeGrad.addColorStop(0, 'rgba(10,10,10,0)');
    fadeGrad.addColorStop(1, 'rgba(10,10,10,1)');
    ctx.fillStyle = fadeGrad;
    ctx.fillRect(0, 700, 800, 100);

    // 故障风文字
    ctx.fillStyle = '#ff003c'; ctx.font = 'bold 28px monospace'; ctx.textAlign = 'left';
    ctx.fillText('SYSTEM_DATA_RECOVERED', 60, 100);
    ctx.fillStyle = '#00f0ff'; ctx.fillText('ERR_0x00FF', 60, 140);

    ctx.textAlign = 'center';
    const fittedModelName = fitText(ctx, modelName, 680, 70, 'monospace', 'bold', 30);
    
    ctx.fillStyle = '#ff003c'; ctx.fillText(fittedModelName, 408, 702);
    ctx.fillStyle = '#00f0ff'; ctx.fillText(fittedModelName, 392, 698);
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

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => { if (blob) resolve(blob); else reject(new Error('Failed')); }, 'image/jpeg', 0.95);
  });
};