import { StorageManager } from './StorageManager';
import { UserManager } from './UserManager';

export type StageStatus = 'NotStarted' | 'InProgress' | 'Completed';

export interface BuildStage {
  id: string;
  nameKey: string;
  status: StageStatus;
  xpReward: number;
  photoUrl?: string;
}

export interface Task {
  id: string;
  modelId: string;
  name: string; 
  status: 'NotStarted' | 'InProgress' | 'Completed';
  stages: BuildStage[];
}

export interface Model {
  id: string;
  name: { en: string; zh: string }; 
  series: { en: string; zh: string }; 
  grade: string;
  status: 'NotStarted' | 'InProgress' | 'Completed';
  coverImage?: string;
  isRebuilding?: boolean;
  isImported?: boolean; // 标记为历史模型
  tasks: Task[];
}

const STAGE_DEFS = [
  { key: 'stage_assembly', xp: 25 }, { key: 'stage_scribing', xp: 15 },
  { key: 'stage_lining', xp: 10 }, { key: 'stage_painting', xp: 30 },
  { key: 'stage_topcoat', xp: 10 },
];

export const DEFAULT_TASK_KEYS = ['part_head', 'part_torso', 'part_waist', 'part_right_arm', 'part_left_arm', 'part_right_leg', 'part_left_leg', 'part_backpack', 'part_weapons'];

const generateStages = () => STAGE_DEFS.map(s => ({ id: crypto.randomUUID(), nameKey: s.key, status: 'NotStarted' as StageStatus, xpReward: s.xp }));

// 默认历史模型只完成素组
const generateImportedTask = (modelId: string) => ({
  id: crypto.randomUUID(), 
  modelId, 
  name: 'part_legacy', 
  status: 'Completed' as const,
  stages: STAGE_DEFS.map(s => ({ 
    id: crypto.randomUUID(), 
    nameKey: s.key, 
    status: s.key === 'stage_assembly' ? 'Completed' : 'NotStarted' as StageStatus, 
    xpReward: s.xp 
  }))
});

const DEFAULT_DATA: Model[] = [
  {
    id: 'model-1',
    name: { en: 'MG Barbatos', zh: 'MG 巴巴托斯' },
    series: { en: 'Iron-Blooded Orphans', zh: '铁血的奥尔芬斯' },
    grade: 'MG',
    status: 'NotStarted',
    tasks: [{ id: 'task-1', modelId: 'model-1', name: 'part_right_arm', status: 'NotStarted', stages: generateStages() }]
  }
];

export class ModelManager {
  static getAllModels(): Model[] {
    const coreData = StorageManager.getRawStorage();
    let models = coreData.models;

    models = models.map((m: any) => {
      const isLegacyName = typeof m.name === 'string';
      return {
        ...m,
        name: isLegacyName ? { en: m.name, zh: m.name } : m.name,
        series: typeof m.series === 'string' ? { en: m.series, zh: m.series } : m.series,
      };
    });

    if (models.length === 0) {
      StorageManager.saveRawStorage(DEFAULT_DATA);
      return DEFAULT_DATA;
    }
    return models;
  }

  static saveModels(models: Model[]) {
    StorageManager.saveRawStorage(models);
  }

  static deleteModel(modelId: string): Model[] {
    const models = this.getAllModels().filter(m => m.id !== modelId);
    this.saveModels(models);
    return models;
  }

  static updateModelCover(modelId: string, coverImage: string): Model[] {
    const models = this.getAllModels();
    const model = models.find(m => m.id === modelId);
    if (model) {
      model.coverImage = coverImage;
      this.saveModels(models);
    }
    return models;
  }

  // 更新历史模型的流程完成状态
  static updateImportedModelStatus(modelId: string, completedStageKeys: string[]): Model[] {
    const models = this.getAllModels();
    const model = models.find(m => m.id === modelId);
    if (model) {
      model.tasks.forEach(task => {
        task.stages.forEach(stage => {
          stage.status = completedStageKeys.includes(stage.nameKey) ? 'Completed' : 'NotStarted';
        });
      });
      this.saveModels(models);
    }
    return models;
  }

  static getTotalXP(): number {
    let xp = StorageManager.getLegacyXP();
    this.getAllModels().forEach(m => m.tasks.forEach(t => {
      t.stages.forEach(s => { if (s.status === 'Completed') xp += s.xpReward; });
    }));
    return xp;
  }

  static addModel(nameObj: { en: string; zh: string }, grade: string, seriesObj: { en: string; zh: string }, useTemplate: boolean = true): Model[] {
    const models = this.getAllModels();
    const modelId = crypto.randomUUID();
    const newModel: Model = {
      id: modelId, name: nameObj, series: seriesObj, grade, status: 'NotStarted',
      tasks: useTemplate ? DEFAULT_TASK_KEYS.map(key => ({ id: crypto.randomUUID(), modelId, name: key, status: 'NotStarted', stages: generateStages() })) : []
    };
    models.push(newModel);
    this.saveModels(models);
    return models;
  }

  static importLegacyModelsFromList(items: { name: { en: string; zh: string }, grade: string, series: { en: string; zh: string }, coverImage?: string }[]): { models: Model[], count: number } {
    const models = this.getAllModels();
    let count = 0;

    items.forEach(item => {
      const modelId = crypto.randomUUID();
      models.push({
        id: modelId,
        name: item.name,
        series: item.series,
        grade: item.grade,
        status: 'Completed',
        coverImage: item.coverImage,
        isImported: true,
        tasks: [generateImportedTask(modelId)]
      });
      count++;
    });

    if (count > 0) {
      const legacyXp = count * 20;
      StorageManager.setLegacyXP(StorageManager.getLegacyXP() + legacyXp);
      UserManager.addCoins(count * 10);
      this.saveModels(models);
    }
    return { models, count };
  }

  static addTask(modelId: string, name: string): Model[] {
    const models = this.getAllModels();
    const model = models.find(m => m.id === modelId);
    if (model) { model.tasks.push({ id: crypto.randomUUID(), modelId, name, status: 'NotStarted', stages: generateStages() }); this.saveModels(models); }
    return models;
  }

  static startStage(taskId: string, stageId: string | null): Model[] {
    const models = this.getAllModels();
    for (const m of models) {
      const task = m.tasks.find(t => t.id === taskId);
      if (task) {
        if (m.status === 'Completed' || task.status === 'Completed') {
          m.status = 'InProgress';
          m.isRebuilding = true;
          task.status = 'InProgress';
          task.stages.forEach(s => { if (s.status === 'Completed') s.status = 'InProgress'; });
        } else if (task.status === 'NotStarted') {
          task.status = 'InProgress';
        }
        if (stageId) {
          const stage = task.stages.find(s => s.id === stageId);
          if (stage && stage.status === 'NotStarted') stage.status = 'InProgress';
        }
        break;
      }
    }
    this.saveModels(models); 
    return models;
  }

  static completeStage(taskId: string, stageId: string | null, photoUrl?: string): Model[] {
    const models = this.getAllModels();
    let changedModelId: string | null = null; let isStageCompletedNow = false;
    for (const m of models) {
      const task = m.tasks.find(t => t.id === taskId);
      if (task) {
        if (stageId) { const stage = task.stages.find(s => s.id === stageId); if (stage && stage.status !== 'Completed') { stage.status = 'Completed'; if (photoUrl) stage.photoUrl = photoUrl; isStageCompletedNow = true; } }
        changedModelId = m.id; break;
      }
    }
    if (changedModelId) { 
      const model = models.find(m => m.id === changedModelId)!; 
      if (model.tasks.every(t => t.status === 'Completed')) { model.status = 'Completed'; model.isRebuilding = false; } 
    }
    this.saveModels(models); 
    if (isStageCompletedNow) UserManager.addCoins(10); 
    return models;
  }

  static finishTask(taskId: string, coverImage?: string): { models: Model[], error?: string } {
    const models = this.getAllModels(); let changedModelId: string | null = null;
    for (const m of models) {
      const task = m.tasks.find(t => t.id === taskId);
      if (task) {
        const assembly = task.stages.find(s => s.nameKey === 'stage_assembly');
        if (assembly && assembly.status !== 'Completed') return { models, error: 'errorAssemblyRequired' };
        if (task.status !== 'Completed') { task.status = 'Completed'; UserManager.addCoins(50); }
        changedModelId = m.id; break;
      }
    }
    if (changedModelId) {
      const model = models.find(m => m.id === changedModelId)!;
      if (model.tasks.every(t => t.status === 'Completed')) {
        if (model.status !== 'Completed') { model.status = 'Completed'; if (coverImage) model.coverImage = coverImage; UserManager.addCoins(200); }
        model.isRebuilding = false;
      }
    }
    this.saveModels(models); return { models };
  }

  static reopenModel(modelId: string): Model[] {
    const models = this.getAllModels();
    const model = models.find(m => m.id === modelId);
    if (model && model.status === 'Completed') { model.status = 'InProgress'; model.isRebuilding = true; }
    this.saveModels(models); return models;
  }

  static getCompletedModels(): Model[] { return this.getAllModels().filter(m => m.status === 'Completed' || m.isRebuilding); }

  static getTaskDetails(taskId: string): { modelName: { en: string; zh: string }; taskName: string } | null {
    for (const m of this.getAllModels()) { const t = m.tasks.find(t => t.id === taskId); if (t) return { modelName: m.name, taskName: t.name }; }
    return null;
  }

  static getStageNameKey(taskId: string, stageId: string | null): string {
    if (!stageId) return '';
    for (const m of this.getAllModels()) { const t = m.tasks.find(t => t.id === taskId); if (t) { const s = t.stages.find(st => st.id === stageId); if (s) return s.nameKey; } }
    return '';
  }

  static getModelStats() {
    const models = this.getAllModels(); const completedModels = models.filter(m => m.status === 'Completed');
    const stats: Record<string, number> = { total: completedModels.length, HG: 0, RG: 0, MG: 0, PG: 0 };
    completedModels.forEach(m => { const grade = m.grade.toUpperCase(); if (stats[grade] !== undefined) stats[grade]++; });
    return stats;
  }

  static getTimeStats() {
    const sessions = JSON.parse(StorageManager.getSessions() || '[]');
    let totalSeconds = 0; const stageTime: Record<string, number> = {};
    sessions.forEach((sess: any) => { totalSeconds += sess.activeSeconds; if (sess.stageId) { const key = this.getStageNameKey(sess.taskId, sess.stageId); if (key) stageTime[key] = (stageTime[key] || 0) + sess.activeSeconds; } });
    return { totalSeconds, stageTime };
  }

  static hasSpeedrunHG(): boolean {
    const models = this.getAllModels(); const sessions = JSON.parse(StorageManager.getSessions() || '[]');
    return models.some(m => { if (m.grade !== 'HG' || m.status !== 'Completed') return false; const taskIds = m.tasks.map(t => t.id); const modelTime = sessions.filter((s: any) => taskIds.includes(s.taskId)).reduce((sum: number, s: any) => sum + s.activeSeconds, 0); return modelTime > 0 && modelTime <= 7200; });
  }
}