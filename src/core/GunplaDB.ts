import Fuse from 'fuse.js';

export interface GunplaItem {
  id: string;
  name: { en: string; jp: string; zh: string };
  series: { en: string; jp: string; zh: string };
  grade: string;
}

// ==================== 检索逻辑 (异步按需加载) ====================
export class GunplaSearch {
  private static fuse: Fuse<GunplaItem> | null = null;
  private static data: GunplaItem[] = [];
  private static loadPromise: Promise<void> | null = null;

  /**
   * 🌟 核心优化：只有在用户真正需要搜索时才加载庞大的 JSON 数据
   */
  static async init(): Promise<void> {
    if (this.fuse) return;
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = (async () => {
      try {
        // 动态导入：Vite 会将其打包为一个独立的 chunk，首屏不会下载
        const module = await import('./GunplaDBData');
        this.data = module.CORE_DB;
        
        this.fuse = new Fuse(this.data, {
          keys: ['name.en', 'name.jp', 'name.zh', 'series.en', 'series.zh', 'grade'],
          threshold: 0.3,
          ignoreLocation: true,
          minMatchCharLength: 2,
        });
      } catch (err) {
        console.error('Failed to load GunplaDB:', err);
      }
    })();

    return this.loadPromise;
  }

  static async search(query: string): Promise<GunplaItem[]> {
    if (!query || query.trim().length < 2) return [];
    
    // 如果尚未加载，等待加载完成
    if (!this.fuse) {
      await this.init();
    }
    if (!this.fuse) return [];

    const rawResults = this.fuse.search(query.trim()).map(r => r.item);
    const gradeOrder = ['EG', 'HG', 'RG', 'MG', 'MGEX', 'MGSD', 'RE/100', 'FM', 'PG'];

    return rawResults.sort((a, b) => {
      const nameCompare = a.name.en.localeCompare(b.name.en);
      if (nameCompare !== 0) return nameCompare;

      const idxGradeA = gradeOrder.indexOf(a.grade.toUpperCase());
      const idxGradeB = gradeOrder.indexOf(b.grade.toUpperCase());
      if (idxGradeA !== idxGradeB) {
        return (idxGradeA === -1 ? 999 : idxGradeA) - (idxGradeB === -1 ? 999 : idxGradeB);
      }
      return a.series.en.localeCompare(b.series.en);
    });
  }

  static async getAll(): Promise<GunplaItem[]> {
    if (!this.fuse) await this.init();
    return this.data;
  }
}