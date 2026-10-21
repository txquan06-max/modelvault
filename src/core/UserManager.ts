import { StorageManager } from './StorageManager';
import { ModelManager } from './ModelManager';

export interface TitleDef {
  id: string;
  nameKey: string;
  descKey: string;
  cost: number;
  checkCondition: () => boolean;
}

export class UserManager {
  static addCoins(amount: number) {
    const balance = StorageManager.getCoinsBalance() + amount;
    const total = StorageManager.getCoinsTotalEarned() + amount;
    StorageManager.setCoinsBalance(balance);
    StorageManager.setCoinsTotalEarned(total);
  }

  static getTitleLibrary(): TitleDef[] {
    return [
      {
        id: 'newbie',
        nameKey: 'title_newbie_name',
        descKey: 'title_newbie_desc',
        cost: 0,
        checkCondition: () => true
      },
      {
        id: 'assembly_master',
        nameKey: 'title_assembly_master_name',
        descKey: 'title_assembly_master_desc',
        cost: 1000,
        checkCondition: () => {
          const stats = ModelManager.getTimeStats();
          return (stats.stageTime['stage_assembly'] || 0) >= 50 * 3600;
        }
      },
      {
        id: 'lining_king',
        nameKey: 'title_lining_king_name',
        descKey: 'title_lining_king_desc',
        cost: 500,
        checkCondition: () => {
          const stats = ModelManager.getTimeStats();
          return (stats.stageTime['stage_lining'] || 0) >= 10 * 3600;
        }
      },
      {
        id: 'model_hoarder',
        nameKey: 'title_model_hoarder_name',
        descKey: 'title_model_hoarder_desc',
        cost: 800,
        checkCondition: () => {
          return ModelManager.getModelStats()['MG'] >= 3;
        }
      }
    ];
  }

  static buyTitle(titleId: string): boolean {
    const title = this.getTitleLibrary().find(t => t.id === titleId);
    if (!title) return false;
    
    const balance = StorageManager.getCoinsBalance();
    if (balance < title.cost) return false;
    if (!title.checkCondition()) return false;

    StorageManager.setCoinsBalance(balance - title.cost);
    
    const earned = StorageManager.getEarnedTitles();
    if (!earned.includes(titleId)) {
      earned.push(titleId);
      StorageManager.setEarnedTitles(earned);
    }
    return true;
  }
}