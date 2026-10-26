// src/core/MigrationManager.ts

export const CURRENT_SCHEMA_VERSION = 7; // 🌟 升级到 v7

export interface RawStorageData {
  schemaVersion: number;
  models: any[];
}

export class MigrationManager {
  static async migrate(parsedData: any, saveBackup: (data: string) => Promise<void>): Promise<RawStorageData> {
    let currentData = { ...parsedData };
    const storedVersion = currentData.schemaVersion || 1;

    if (storedVersion >= CURRENT_SCHEMA_VERSION) {
      return currentData;
    }

    await saveBackup(JSON.stringify(currentData));

    if (storedVersion < 5) {
      currentData = this.v4_to_v5(currentData);
    }
    if (storedVersion < 6) {
      currentData = this.v5_to_v6(currentData);
    }
    if (storedVersion < 7) {
      currentData = this.v6_to_v7(currentData);
    }

    currentData.schemaVersion = CURRENT_SCHEMA_VERSION;
    return currentData;
  }

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
    const newModels = models.map((m: any) => ({
      ...m,
      tasks: (m.tasks || []).map((t: any) => ({
        ...t,
        modelId: m.id,
      })),
    }));
    return { ...oldData, models: newModels };
  }

  // 🌟 v6 -> v7: 单张 photoUrl 升级为 processPhotos 数组
  private static v6_to_v7(oldData: any): any {
    console.log('🔄 数据迁移: v6 -> v7 (多图相册升级)');
    const models = oldData.models || [];
    const newModels = models.map((m: any) => ({
      ...m,
      tasks: (m.tasks || []).map((t: any) => ({
        ...t,
        stages: (t.stages || []).map((s: any) => {
          const processPhotos = s.processPhotos || [];
          // 如果旧数据有 photoUrl 且不在数组里，塞进去
          if (s.photoUrl && !processPhotos.includes(s.photoUrl)) {
            processPhotos.push(s.photoUrl);
          }
          return {
            ...s,
            processPhotos,
          };
        }),
      })),
    }));
    return { ...oldData, models: newModels };
  }
}