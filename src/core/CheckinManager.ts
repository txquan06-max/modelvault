import { StorageManager } from './StorageManager';
import { UserManager } from './UserManager';

export class CheckinManager {
  // 检查今天是否已打卡
  static isCheckedInToday(): boolean {
    const lastDate = StorageManager.getLastCheckinDate();
    if (!lastDate) return false;
    const today = new Date().toISOString().slice(0, 10);
    return lastDate === today;
  }

  // 执行打卡
  static checkin(): { success: boolean; streak: number; rewardXp: number; rewardCoins: number; isNewStreak: boolean } {
    if (this.isCheckedInToday()) {
      return { success: false, streak: StorageManager.getCheckinStreak(), rewardXp: 0, rewardCoins: 0, isNewStreak: false };
    }

    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const lastDate = StorageManager.getLastCheckinDate();

    let newStreak = 1;
    if (lastDate === yesterday) {
      newStreak = StorageManager.getCheckinStreak() + 1;
    }

    // 奖励计算
    let rewardXp = 10;
    let rewardCoins = 5;

    // 连击加成
    if (newStreak >= 3) { rewardXp += 10; rewardCoins += 5; }
    if (newStreak >= 7) { rewardXp += 20; rewardCoins += 10; }
    if (newStreak >= 14) { rewardXp += 30; rewardCoins += 20; }
    if (newStreak >= 30) { rewardXp += 50; rewardCoins += 30; }
    if (newStreak >= 100) { rewardXp += 100; rewardCoins += 100; }

    // 保存
    StorageManager.setCheckinStreak(newStreak);
    StorageManager.setLastCheckinDate(today);
    StorageManager.setTotalCheckinDays(StorageManager.getTotalCheckinDays() + 1);

    // 发放奖励 (XP 通过 LegacyXP 发放，金币直接加)
    StorageManager.setLegacyXP(StorageManager.getLegacyXP() + rewardXp);
    UserManager.addCoins(rewardCoins);

    return { success: true, streak: newStreak, rewardXp, rewardCoins, isNewStreak: true };
  }
}