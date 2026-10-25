// src/utils/format.ts
/**
 * 通用格式化工具
 * 从 App.tsx 抽取，供多个 View 复用（JournalView / HangarView / ProfileView / ModelDetail 等）
 */

/**
 * 格式化秒数为时长字符串
 * - >= 1 小时：`H:MM:SS`
 * - < 1 小时：`MM:SS`
 */
export const formatTime = (totalSec: number): string => {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60).toString().padStart(2, '0');
  const s = (totalSec % 60).toString().padStart(2, '0');
  if (h > 0) return `${h}:${m}:${s}`;
  return `${m}:${s}`;
};

/**
 * 格式化时间戳为日志日期字符串：`MM-DD HH:MM`
 */
export const formatLogDate = (timestamp: number): string => {
  const d = new Date(timestamp);
  return `${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
};

/**
 * 输入框聚焦时自动滚动到视野中心
 * 用于所有需要输入的表单（解决移动端键盘遮挡问题）
 */
export const handleFocusScroll = (
  e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
) => {
  setTimeout(() => {
    e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 300);
};

/**
 * 从 timestamp 提取 `YYYYMM` 格式月份键
 * 用于 JournalView 的月份过滤（本地时区）
 */
export const getMonthKey = (timestamp: number): string => {
  const d = new Date(timestamp);
  return `${d.getFullYear()}${(d.getMonth() + 1).toString().padStart(2, '0')}`;
};

/**
 * 把 `<input type="month">` 的 `YYYY-MM` 值转换为 `YYYYMM` 键
 */
export const normalizeMonthInput = (month: string): string => {
  if (!month) return '';
  return month.replace('-', '');
};