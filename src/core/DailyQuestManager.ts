import { StorageManager } from './StorageManager';
import { UserManager } from './UserManager';

export type QuestType = 'focus_time' | 'write_note' | 'add_model' | 'complete_part';

export interface DailyQuest {
  id: string;
  type: QuestType;
  titleZh: string;
  titleEn: string;
  target: number;
  progress: number;
  completed: boolean;
  claimed: boolean;
  reward: number;
}

const STORAGE_KEY = 'mv_daily_quests_data';

const QUEST_POOL = [
  { type: 'focus_time', target: 900, titleZh: '今日累计专注 15 分钟', titleEn: 'Focus for 15 mins today', reward: 50 },
  { type: 'focus_time', target: 1800, titleZh: '今日累计专注 30 分钟', titleEn: 'Focus for 30 mins today', reward: 100 },
  { type: 'focus_time', target: 3600, titleZh: '今日累计专注 60 分钟', titleEn: 'Focus for 60 mins today', reward: 200 },
  { type: 'write_note', target: 1, titleZh: '写 1 篇制作心得', titleEn: 'Write 1 build note', reward: 50 },
  { type: 'write_note', target: 3, titleZh: '写 3 篇制作心得', titleEn: 'Write 3 build notes', reward: 150 },
  { type: 'add_model', target: 1, titleZh: '添加 1 个新模型入库', titleEn: 'Add 1 new model to backlog', reward: 50 },
  { type: 'complete_part', target: 1, titleZh: '完成 1 个部位的拼装', titleEn: 'Finish 1 model part', reward: 80 },
] as const;

export class DailyQuestManager {
  private static getTodayDateStr(): string {
    const d = new Date();
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
  }

  /**
   * 获取今日任务（如果是新的一天，自动生成并保存）
   */
  static getTodayQuests(): DailyQuest[] {
    const raw = StorageManager.getRawDailyQuests();
    const today = this.getTodayDateStr();

    if (raw && raw.date === today && raw.quests?.length > 0) {
      return raw.quests;
    }

    // 跨天或首次生成：随机抽 3 个不重复的任务
    const shuffled = [...QUEST_POOL].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3).map(q => ({
      id: crypto.randomUUID(),
      type: q.type,
      titleZh: q.titleZh,
      titleEn: q.titleEn,
      target: q.target,
      progress: 0,
      completed: false,
      claimed: false,
      reward: q.reward,
    }));

    this.saveQuests(today, selected);
    return selected;
  }

  private static saveQuests(date: string, quests: DailyQuest[]) {
    StorageManager._set(STORAGE_KEY, JSON.stringify({ date, quests }));
  }

  /**
   * 更新任务进度（埋点方法）
   */
  static updateProgress(type: QuestType, amount: number = 1) {
    const quests = this.getTodayQuests();
    let changed = false;

    const updated = quests.map(q => {
      if (q.type === type && !q.completed) {
        const newProgress = q.progress + amount;
        const isCompleted = newProgress >= q.target;
        if (newProgress !== q.progress) changed = true;
        return { ...q, progress: Math.min(newProgress, q.target), completed: isCompleted };
      }
      return q;
    });

    if (changed) {
      this.saveQuests(this.getTodayDateStr(), updated);
    }
  }

  /**
   * 领取任务奖励
   */
  static claimReward(questId: string): boolean {
    const quests = this.getTodayQuests();
    const targetQuest = quests.find(q => q.id === questId);

    if (targetQuest && targetQuest.completed && !targetQuest.claimed) {
      targetQuest.claimed = true;
      UserManager.addCoins(targetQuest.reward);
      this.saveQuests(this.getTodayDateStr(), quests);
      return true;
    }
    return false;
  }
}