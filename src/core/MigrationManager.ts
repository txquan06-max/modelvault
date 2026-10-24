// src/core/MigrationManager.ts

export const CURRENT_SCHEMA_VERSION = 6; // 升级版本号

export interface RawStorageData {
  schemaVersion: number;
  models: any[];
}

export class MigrationManager {
  /**
   * 执行数据迁移
   * @param parsedData 解析后的 JSON 数据
   * @param saveBackup 用于保存备份的回调（由 StorageManager 提供）
   * @returns 迁移后的新数据
   */
  static async migrate(parsedData: any, saveBackup: (data: string) => Promise<void>): Promise<RawStorageData> {
    let currentData = { ...parsedData };
    const storedVersion = currentData.schemaVersion || 1;

    if (storedVersion >= CURRENT_SCHEMA_VERSION) {
      return currentData;
    }

    // 只有真正需要迁移时才备份
    await saveBackup(JSON.stringify(currentData));

    // 链式迁移：从旧版本一步步升级到最新版本
    if (storedVersion < 5) {
      currentData = this.v4_to_v5(currentData);
    }
    if (storedVersion < 6) {
      currentData = this.v5_to_v6(currentData);
    }

    currentData.schemaVersion = CURRENT_SCHEMA_VERSION;
    return currentData;
  }

  // ============================================
  // 具体的迁移逻辑
  // ============================================

  // v4 -> v5: 将模型名称/系列从字符串转为多语言对象，并补全 note 字段
  private static v4_to_v5(oldData: any): any {
    console.log('🔄 数据迁移: v4 -> v5 (多语言字段与心得)');
    const models = oldData.models || [];
    const newModels = models.map((m: any) => ({
      ...m,
      name: typeof m.name === 'string' ? { en: m.name, zh: m.name } : m.name,
      series: typeof m.series === 'string' ? { en: m.series, zh: m.series } : m.series,
      tasks: (m.tasks || []).map((t: any) => ({
        ...t,
        note: t.note || '',
        stages: (t.stages || []).map((s: any) => ({
          ...s,
          note: s.note || '',
        })),
      })),
    }));
    return { ...oldData, models: newModels };
  }

  // v5 -> v6: 清理旧版遗留字段，确保数据完整
  private static v5_to_v6(oldData: any): any {
    console.log('🔄 数据迁移: v5 -> v6 (结构清理与兼容)');
    const models = oldData.models || [];
    // 可以在这里补充未来的数据结构修复，比如补全缺失的 modelId 等
    const newModels = models.map((m: any) => ({
      ...m,
      tasks: (m.tasks || []).map((t: any) => ({
        ...t,
        modelId: m.id, // 确保关联ID正确
      })),
    }));
    return { ...oldData, models: newModels };
  }
}