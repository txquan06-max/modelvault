export interface Session {
  id: string;
  taskId: string;
  stageId: string | null; // 新增：记录是哪个工序消耗的时间
  startedAt: number;
  endedAt: number;
  activeSeconds: number;
}