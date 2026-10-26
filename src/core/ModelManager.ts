import { StorageManager } from './StorageManager';
import { UserManager } from './UserManager';

export type StageStatus = 'NotStarted' | 'InProgress' | 'Completed';

export interface BuildStage {
  id: string;
  nameKey: string;
  status: StageStatus;
  xpReward: number;
  photoUrl?: string; // 🌟 保留：兼容旧版
  processPhotos?: string[]; // 🌟 新增：多图相册
  note?: string;
}

export interface Task {
  id: string;
  modelId: string;
  name: string; 
  status: 'NotStarted' | 'InProgress' | 'Completed';
  stages: BuildStage[];
  note?: string;
}

export interface Model {
  id: string;
  name: { en: string; zh: string }; 
  series: { en: string; zh: string }; 
  grade: string;
  status: 'NotStarted' | 'InProgress' | 'Completed';
  coverImage?: string;
  isRebuilding?: boolean;
  isImported?: boolean; 
  tasks: Task[];
}

const STAGE_DEFS = [
  { key: 'stage_assembly', xp: 25 }, { key: 'stage_scribing', xp: 15 },
  { key: 'stage_lining', xp: 10 }, { key: 'stage_painting', xp: 30 },
  { key: 'stage_topcoat', xp: 10 },
];

export const DEFAULT_TASK_KEYS = ['part_head', 'part_torso', 'part_waist', 'part_right_arm', 'part_left_arm', 'part_right_leg', 'part_left_leg', 'part_backpack', 'part_weapons'];

const generateStages = () => STAGE_DEFS.map(s => ({
  id: crypto.randomUUID(),
  nameKey: s.key,
  status: 'NotStarted' as StageStatus,
  xpReward: s.xp,
  processPhotos: [] as string[],
}));

const generateImportedTask = (modelId: string) => ({
  id: crypto.randomUUID(), 
  modelId, 
  name: 'part_legacy', 
  status: 'Completed' as const,
  stages: STAGE_DEFS.map(s => ({ 
    id: crypto.randomUUID(), 
    nameKey: s.key, 
    status: s.key === 'stage_assembly' ? 'Completed' : 'NotStarted' as StageStatus, 
    xpReward: s.xp,
    processPhotos: [] as string[],
  }))
});

export class ModelManager {
  static getAllModels(): Model[] {
    const coreData = StorageManager.getRawStorage();
    let models = coreData.models || [];

    models = models.map((m: any) => {
      const isLegacyName = typeof m.name === 'string';
      return {
        ...m,
        name: isLegacyName ? { en: m.name, zh: m.name } : m.name,
        series: typeof m.series === 'string' ? { en: m.series, zh: m.series } : m.series,
      };
    });

    return models;
  }

  static saveModels(models: Model[]) {
    StorageManager.saveRawStorage(models);
  }

  static checkModelComplete(modelId: string): boolean {
    const model = this.getAllModels().find(m => m.id === modelId);
    if (!model) return false;
    return model.tasks.length > 0 && model.tasks.every(t => t.status === 'Completed');
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

  static getTotalXP(): number {
    let xp = StorageManager.getLegacyXP();
    this.getAllModels().forEach(m => m.tasks.forEach(t => {
      t.stages.forEach(s => { if (s.status === 'Completed') xp += s.xpReward; });
    }));
    return xp;
  }

  static addModel(nameObj: { en: string; zh: string }, grade: string, seriesObj: { en: string; zh: string }, useTemplate: boolean = true, isWholeBuild: boolean = false): Model[] {
    const models = this.getAllModels();
    const modelId = crypto.randomUUID();
    
    let tasks: Task[] = [];
    if (useTemplate) {
      if (isWholeBuild) {
        tasks = [{ id: crypto.randomUUID(), modelId, name: 'part_whole', status: 'NotStarted', stages: generateStages() }];
      } else {
        tasks = DEFAULT_TASK_KEYS.map(key => ({ id: crypto.randomUUID(), modelId, name: key, status: 'NotStarted', stages: generateStages() }));
      }
    }

    const newModel: Model = {
      id: modelId, name: nameObj, series: seriesObj, grade, status: 'NotStarted',
      tasks
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

  static startLegacyRebuild(modelId: string, completedStageKeys: string[], isWholeBuild: boolean = false): Model[] {
    const models = this.getAllModels();
    const model = models.find(m => m.id === modelId);
    if (model) {
      model.isRebuilding = true;
      model.status = 'InProgress';
      
      const legacyTask = model.tasks.find(t => t.name === 'part_legacy');
      
      let finalCompletedStages: string[] = [];
      if (legacyTask) {
        finalCompletedStages = legacyTask.stages.filter(s => completedStageKeys.includes(s.nameKey) || s.nameKey === 'stage_assembly').map(s => s.nameKey);
      } else {
        finalCompletedStages = ['stage_assembly'];
      }

      if (isWholeBuild) {
        if (legacyTask) {
          legacyTask.name = 'part_whole';
          legacyTask.status = 'InProgress';
          legacyTask.stages.forEach(stage => {
            stage.status = finalCompletedStages.includes(stage.nameKey) ? 'Completed' : 'NotStarted';
          });
        } else if (!model.tasks.some(t => t.name === 'part_whole')) {
          const newTaskStages = generateStages();
          newTaskStages.forEach(stage => {
            stage.status = finalCompletedStages.includes(stage.nameKey) ? 'Completed' : 'NotStarted';
          });
          model.tasks.push({ id: crypto.randomUUID(), modelId, name: 'part_whole', status: 'InProgress', stages: newTaskStages });
        }
      } else {
        if (legacyTask) {
          model.tasks = model.tasks.filter(t => t.id !== legacyTask.id);
        }
        
        DEFAULT_TASK_KEYS.forEach(key => {
          if (!model.tasks.some(t => t.name === key)) {
            const newTaskStages = generateStages();
            newTaskStages.forEach(stage => {
              stage.status = finalCompletedStages.includes(stage.nameKey) ? 'Completed' : 'NotStarted';
            });
            const taskStatus = finalCompletedStages.includes('stage_assembly') ? 'InProgress' : 'NotStarted';
            model.tasks.push({ id: crypto.randomUUID(), modelId, name: key, status: taskStatus, stages: newTaskStages });
          }
        });
      }
      
      this.saveModels(models);
    }
    return models;
  }

  static finishModel(modelId: string): Model[] {
    const models = this.getAllModels();
    const model = models.find(m => m.id === modelId);
    if (model) {
      model.status = 'Completed';
      model.isRebuilding = false;
      model.tasks.forEach(t => t.status = 'Completed');
      this.saveModels(models);
    }
    return models;
  }

  static updateImportedModelStatus(modelId: string, completedStageKeys: string[]): Model[] {
    const models = this.getAllModels();
    const model = models.find(m => m.id === modelId);
    if (model) {
      model.tasks.forEach(task => {
        task.stages.forEach(stage => {
          if (stage.nameKey === 'stage_assembly') {
            stage.status = 'Completed';
          } else {
            stage.status = completedStageKeys.includes(stage.nameKey) ? 'Completed' : 'NotStarted';
          }
        });
      });
      this.saveModels(models);
    }
    return models;
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

  static updateStageNote(taskId: string, stageId: string, note: string): Model[] {
    const models = this.getAllModels();
    for (const m of models) {
      const task = m.tasks.find(t => t.id === taskId);
      if (task) {
        const stage = task.stages.find(s => s.id === stageId);
        if (stage) {
          stage.note = note;
          break;
        }
      }
    }
    this.saveModels(models);
    return models;
  }

  // 🌟 新增：追加过程照到指定工序
  static addStagePhoto(taskId: string, stageId: string, photoUrl: string): Model[] {
    const models = this.getAllModels();
    for (const m of models) {
      const task = m.tasks.find(t => t.id === taskId);
      if (task) {
        const stage = task.stages.find(s => s.id === stageId);
        if (stage) {
          if (!stage.processPhotos) stage.processPhotos = [];
          stage.processPhotos.push(photoUrl);
          break;
        }
      }
    }
    this.saveModels(models);
    return models;
  }

  // 🌟 新增：移除指定的过程照
  static removeStagePhoto(taskId: string, stageId: string, photoUrl: string): Model[] {
    const models = this.getAllModels();
    for (const m of models) {
      const task = m.tasks.find(t => t.id === taskId);
      if (task) {
        const stage = task.stages.find(s => s.id === stageId);
        if (stage && stage.processPhotos) {
          stage.processPhotos = stage.processPhotos.filter(url => url !== photoUrl);
          break;
        }
      }
    }
    this.saveModels(models);
    return models;
  }

  // 🌟 修改：completeStage 自动把 photoUrl 存入 processPhotos
  static completeStage(taskId: string, stageId: string | null, photoUrl?: string, note?: string): Model[] {
    const models = this.getAllModels();
    let isStageCompletedNow = false;
    for (const m of models) {
      const task = m.tasks.find(t => t.id === taskId);
      if (task) {
        if (stageId) { 
          const stage = task.stages.find(s => s.id === stageId); 
          if (stage && stage.status !== 'Completed') { 
            stage.status = 'Completed'; 
            if (photoUrl) {
              stage.photoUrl = photoUrl; // 保留旧字段
              if (!stage.processPhotos) stage.processPhotos = [];
              stage.processPhotos.push(photoUrl);
            }
            if (note) stage.note = note;
            isStageCompletedNow = true; 
          } 
        }
        break;
      }
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

  static getDetailedStatsForShareCard(modelId: string) {
    const models = this.getAllModels();
    const model = models.find(m => m.id === modelId);
    if (!model) return null;
    
    const sessions = JSON.parse(StorageManager.getSessions() || '[]');
    const taskIds = model.tasks.map(t => t.id);
    const modelSessions = sessions.filter((s: any) => taskIds.includes(s.taskId));
    
    let totalTime = 0;
    const stageTimes: Record<string, number> = {};
    
    modelSessions.forEach((s: any) => {
      totalTime += s.activeSeconds;
      if (s.stageId) {
        const key = this.getStageNameKey(s.taskId, s.stageId);
        if (key) stageTimes[key] = (stageTimes[key] || 0) + s.activeSeconds;
      }
    });
    
    return { model, totalTime, stageTimes };
  }
}