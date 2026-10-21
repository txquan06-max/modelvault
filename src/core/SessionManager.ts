import { StorageManager } from './StorageManager';
import type { Session } from './types';

export class SessionManager {
  static saveSession(session: Session) {
    const sessions = this.getAllSessions();
    sessions.push(session);
    StorageManager.setSessions(JSON.stringify(sessions));
  }

  static getAllSessions(): Session[] {
    const data = StorageManager.getSessions();
    return data ? JSON.parse(data) : [];
  }

  static getTodayTotalSeconds(): number {
    const sessions = this.getAllSessions();
    const today = new Date().setHours(0, 0, 0, 0);
    return sessions
      .filter(s => s.startedAt >= today)
      .reduce((sum, s) => sum + s.activeSeconds, 0);
  }
}