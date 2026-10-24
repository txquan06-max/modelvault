// src/core/SessionManager.ts
import { StorageManager } from './StorageManager';
import type { Session } from './types';

export class SessionManager {
  // 🌟 内存级缓存，避免每次渲染都重复解析大 JSON
  private static cachedSessions: Session[] | null = null;
  private static cachedRawString: string | null = null;

  static invalidateCache() {
    this.cachedSessions = null;
    this.cachedRawString = null;
  }

  static saveSession(session: Session) {
    // 获取最新的会话列表
    const sessions = this.getAllSessions();
    sessions.push(session);
    const newRaw = JSON.stringify(sessions);
    
    // 保存到底层
    StorageManager.setSessions(newRaw);
    
    // 同步更新缓存，避免下一次读取时重新解析
    this.cachedSessions = sessions;
    this.cachedRawString = newRaw;
  }

  static getAllSessions(): Session[] {
    const raw = StorageManager.getSessions();
    
    // 如果原始字符串没变，直接返回缓存内容的浅拷贝（防止外部 sort() 污染缓存）
    if (this.cachedSessions && this.cachedRawString === raw) {
      return [...this.cachedSessions];
    }

    // 否则重新解析并更新缓存
    const sessions = raw ? JSON.parse(raw) : [];
    this.cachedSessions = sessions;
    this.cachedRawString = raw;
    return [...sessions];
  }

  static getTodayTotalSeconds(): number {
    const sessions = this.getAllSessions();
    const today = new Date().setHours(0, 0, 0, 0);
    return sessions
      .filter(s => s.startedAt >= today)
      .reduce((sum, s) => sum + s.activeSeconds, 0);
  }
}