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

// 重置阴影状态（用完 shadowBlur 必须重置，否则影响后续绘制）
const resetShadow = (ctx: CanvasRenderingContext2D) => {
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
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
  // 🎨 模板 1: 极简白描 (Minimal) - 上下分区方案
  // ============================================
  if (template === 'minimal') {
    // 整体背景（浅灰白）
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, 800, 1200);

    // 图片区 (0 - 700)
    if (coverImg) {
      const scale = Math.max(800 / coverImg.width, 700 / coverImg.height);
      const w = coverImg.width * scale;
      const h = coverImg.height * scale;
      const x = (800 - w) / 2;
      const y = (700 - h) / 2;
      ctx.drawImage(coverImg, x, y, w, h);

      // 底部渐变融合（图片淡出到文字区背景）
      const fadeGrad = ctx.createLinearGradient(0, 480, 0, 700);
      fadeGrad.addColorStop(0, 'rgba(248, 249, 250, 0)');
      fadeGrad.addColorStop(1, 'rgba(248, 249, 250, 1)');
      ctx.fillStyle = fadeGrad;
      ctx.fillRect(0, 480, 800, 220);
    } else {
      // 无图时浅灰占位
      ctx.fillStyle = '#e9ecef';
      ctx.fillRect(0, 0, 800, 700);
    }

    // 分割线（用 botColor 做视觉锚点）
    ctx.fillStyle = botColor;
    ctx.fillRect(0, 700, 800, 5);

    // ============ 文字区 (700 - 1200)：纯浅色背景，所有文字深色 ============
    ctx.textAlign = 'center';

    // 机体名称（深色，无论机体什么颜色都能清晰阅读）
    ctx.fillStyle = '#0f172a';
    const fittedModelName = fitText(ctx, modelName, 680, 60, 'sans-serif', 'bold', 28);
    ctx.fillText(fittedModelName, 400, 800);

    // 规格 + 系列
    ctx.fillStyle = '#64748b';
    ctx.font = '24px sans-serif';
    ctx.fillText(`${model.grade}  |  ${seriesName}`, 400, 850);

    // 大号计时
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 96px monospace';
    ctx.fillText(formatTime(totalTime), 400, 990);

    ctx.fillStyle = '#adb5bd';
    ctx.font = '16px monospace';
    ctx.fillText(isZh ? '总专注时长' : 'TOTAL FOCUS TIME', 400, 1030);

    // 工序明细（最多 3 条）
    const topStages = Object.entries(stageTimes)
      .filter(([_, time]) => time > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    if (topStages.length > 0) {
      let startY = 1080;
      topStages.forEach(([stageKey, time], idx) => {
        const y = startY + idx * 32;
        ctx.fillStyle = '#495057';
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`• ${t(stageKey)}`, 180, y);

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(formatTime(time), 620, y);
      });
    }

    // 用户信息
    ctx.fillStyle = '#94a3b8';
    ctx.font = '18px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${username} (Lv.${level})`, 60, 1170);
    ctx.textAlign = 'right';
    ctx.fillText(`Witnessed by ${isZh ? botData.name : botData.enName}`, 740, 1170);

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob failed'));
      }, 'image/jpeg', 0.92);
    });
  }

  // ============================================
  // 🎨 模板 2: 赛博光晕 (Cyber) - 霓虹双色重做
  // ============================================
  if (template === 'cyber') {
    // 霓虹色板
    const NEON_CYAN = '#00f0ff';
    const NEON_PINK = '#ff00aa';
    const NEON_YELLOW = '#fde047';

    // 深色渐变背景
    const bgGrad = ctx.createRadialGradient(400, 600, 100, 400, 600, 800);
    bgGrad.addColorStop(0, '#140a2b');
    bgGrad.addColorStop(1, '#050110');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 800, 1200);

    // 扫描线（细的青色横线，营造 CRT 屏幕感）
    ctx.fillStyle = 'rgba(0, 240, 255, 0.04)';
    for (let y = 0; y < 1200; y += 3) {
      ctx.fillRect(0, y, 800, 1);
    }

    // 机体图片（透明度 0.7，比之前清晰很多）
    if (coverImg) {
      const scale = Math.max(800 / coverImg.width, 750 / coverImg.height);
      const w = coverImg.width * scale;
      const h = coverImg.height * scale;
      const x = (800 - w) / 2;
      const y = (750 - h) / 2;

      ctx.globalAlpha = 0.7;
      ctx.drawImage(coverImg, x, y, w, h);
      ctx.globalAlpha = 1.0;

      // 底部渐变到深色（覆盖图片下边缘）
      const fadeGrad = ctx.createLinearGradient(0, 500, 0, 750);
      fadeGrad.addColorStop(0, 'rgba(5, 1, 16, 0)');
      fadeGrad.addColorStop(1, 'rgba(5, 1, 16, 1)');
      ctx.fillStyle = fadeGrad;
      ctx.fillRect(0, 500, 800, 250);
    }

    // 赛博网格（青色调，比之前明显）
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 800; i += 40) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 1200); ctx.stroke();
    }
    for (let i = 0; i < 1200; i += 40) {
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(800, i); ctx.stroke();
    }

    // 顶部装饰：左上角品牌标识
    ctx.fillStyle = NEON_CYAN;
    ctx.fillRect(60, 80, 8, 50);
    ctx.shadowColor = NEON_CYAN;
    ctx.shadowBlur = 15;
    ctx.fillRect(60, 80, 8, 50);
    resetShadow(ctx);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('MODELJOURNEY', 85, 115);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px monospace';
    ctx.fillText(`BUILD REPORT // ${t('share_report_label')}`, 85, 145);

    // 顶部装饰：右上角 avatar
    if (avatarImg) {
      // 外圈发光青
      ctx.save();
      ctx.beginPath(); ctx.arc(680, 110, 42, 0, Math.PI * 2); ctx.clip();
      ctx.drawImage(avatarImg, 638, 68, 84, 84);
      ctx.restore();

      ctx.shadowColor = NEON_CYAN;
      ctx.shadowBlur = 15;
      ctx.strokeStyle = NEON_CYAN;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(680, 110, 42, 0, Math.PI * 2); ctx.stroke();
      resetShadow(ctx);

      // 内圈小圆环（品红）
      ctx.shadowColor = NEON_PINK;
      ctx.shadowBlur = 10;
      ctx.strokeStyle = NEON_PINK;
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(680, 110, 46, 0, Math.PI * 2); ctx.stroke();
      resetShadow(ctx);
    }

    // 顶部双色分割线
    ctx.fillStyle = NEON_CYAN;
    ctx.fillRect(0, 178, 400, 2);
    ctx.fillStyle = NEON_PINK;
    ctx.fillRect(400, 178, 400, 2);

    // 主标题（发光白色）
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    const fittedModelName = fitText(ctx, modelName, 680, 56, 'sans-serif', 'bold', 28);

    // 外发光
    ctx.shadowColor = NEON_CYAN;
    ctx.shadowBlur = 30;
    ctx.fillText(fittedModelName, 400, 330);

    // 双层描边（青 + 白）
    ctx.shadowBlur = 0;
    ctx.strokeStyle = NEON_CYAN;
    ctx.lineWidth = 2;
    ctx.strokeText(fittedModelName, 400, 330);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 0.5;
    ctx.strokeText(fittedModelName, 400, 330);
    resetShadow(ctx);

    // 副标题 [ GRADE | SERIES ]（霓虹青）
    ctx.font = 'bold 22px monospace';
    ctx.fillStyle = NEON_CYAN;
    ctx.shadowColor = NEON_CYAN;
    ctx.shadowBlur = 15;
    ctx.fillText(`[ ${model.grade} | ${seriesName} ]`, 400, 780);
    resetShadow(ctx);

    // 大号计时（霓虹黄 + 强发光）
    ctx.fillStyle = NEON_YELLOW;
    ctx.font = 'bold 100px monospace';
    ctx.shadowColor = NEON_YELLOW;
    ctx.shadowBlur = 40;
    ctx.fillText(formatTime(totalTime), 400, 900);
    resetShadow(ctx);

    ctx.fillStyle = '#6b7280';
    ctx.font = '18px monospace';
    ctx.fillText('TOTAL FOCUS TIME', 400, 940);

    // 底部信息卡片（带发光边框）
    ctx.fillStyle = 'rgba(10, 1, 24, 0.85)';
    ctx.beginPath();
    ctx.roundRect(60, 1010, 680, 110, 16);
    ctx.fill();

    ctx.shadowColor = NEON_CYAN;
    ctx.shadowBlur = 12;
    ctx.strokeStyle = NEON_CYAN;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(60, 1010, 680, 110, 16);
    ctx.stroke();
    resetShadow(ctx);

    // 卡片内容
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`🧑‍🔧 ${username}`, 90, 1060);

    ctx.fillStyle = NEON_YELLOW;
    ctx.fillText(`Lv.${level}`, 320, 1060);

    ctx.fillStyle = title ? title.color : NEON_PINK;
    ctx.textAlign = 'right';
    ctx.fillText(`[ ${titleName} ]`, 710, 1060);

    // 卡片副行：塑灵信息
    ctx.fillStyle = '#6b7280';
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`WITNESSED BY ANIMOLD [ ${isZh ? botData.name : botData.enName} ]`, 400, 1100);

    // 底部品牌
    ctx.fillStyle = '#4b5563';
    ctx.font = '14px monospace';
    ctx.fillText('// END OF BUILD REPORT //', 400, 1170);

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob failed'));
      }, 'image/jpeg', 0.92);
    });
  }

  // ============================================
  // 🎨 模板 3: 故障风 (Glitch) - 保持原样
  // ============================================
  if (template === 'glitch') {
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, 800, 1200);

    if (coverImg) {
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

    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    for (let i = 0; i < 1200; i += 4) { ctx.fillRect(0, i, 800, 1); }

    ctx.fillStyle = '#ff003c'; ctx.font = 'bold 28px monospace'; ctx.textAlign = 'left';
    ctx.fillText('SYSTEM_DATA_RECOVERED', 60, 100);
    ctx.fillStyle = '#00f0ff'; ctx.fillText('ERR_0x00FF', 60, 140);

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

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas toBlob failed'));
    }, 'image/jpeg', 0.92);
  });
};