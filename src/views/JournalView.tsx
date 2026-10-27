// src/views/JournalView.tsx
import { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AudioManager } from '../core/AudioManager';
import { SessionManager } from '../core/SessionManager';
import { ModelManager } from '../core/ModelManager';
import { formatTime, formatLogDate, handleFocusScroll, getMonthKey, normalizeMonthInput } from '../utils/format';

export const JournalView = () => {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === 'zh';

  const [journalFilterMonth, setJournalFilterMonth] = useState('');
  const [syncTrigger, setSyncTrigger] = useState(0); // 🌟 新增：用于强制刷新

  // 🌟 监听本地文件夹同步事件
  useEffect(() => {
    const handleSync = () => setSyncTrigger(s => s + 1);
    window.addEventListener('mv-journal-synced', handleSync);
    return () => window.removeEventListener('mv-journal-synced', handleSync);
  }, []);

  const logs = useMemo(() => {
    const allLogs = SessionManager.getAllSessions()
      .sort((a, b) => b.startedAt - a.startedAt)
      .map(s => ({ ...s, details: ModelManager.getTaskDetails(s.taskId) }));

    if (!journalFilterMonth) return allLogs;

    const filterKey = normalizeMonthInput(journalFilterMonth); // YYYY-MM -> YYYYMM
    return allLogs.filter(s => getMonthKey(s.startedAt) === filterKey);
  }, [journalFilterMonth, syncTrigger]); // 🌟 依赖中加入 syncTrigger

  return (
    <div className="view-content journal-view" style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%' }}>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
          gap: '8px',
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontSize: '13px', color: '#ccc', fontWeight: 'bold', flexShrink: 0 }}>
          {t('journal_log')}
        </span>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(0,0,0,0.5)',
              border: '1px solid #555',
              borderRadius: '6px',
              minHeight: '40px',
              cursor: 'pointer',
              transition: 'border-color 0.2s, background 0.2s',
              flex: '0 1 auto',
              minWidth: '150px',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = '#3b82f6';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = '#555';
            }}
            onClick={(e) => {
              if ((e.target as HTMLElement).tagName !== 'INPUT') {
                const input = e.currentTarget.querySelector('input') as HTMLInputElement | null;
                if (input) {
                  input.focus();
                  (input as any).showPicker?.();
                }
              }
            }}
          >
            <span
              style={{
                fontSize: '14px',
                padding: '0 10px',
                userSelect: 'none',
                pointerEvents: 'none',
              }}
            >
              📅
            </span>
            <input
              type="month"
              value={journalFilterMonth}
              onChange={(e) => {
                AudioManager.playClick();
                setJournalFilterMonth(e.target.value);
              }}
              onClick={(e) => {
                (e.currentTarget as HTMLInputElement).showPicker?.();
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                outline: 'none',
                fontSize: '13px',
                padding: '10px 10px 10px 0',
                flex: 1,
                cursor: 'pointer',
                colorScheme: 'dark',
                minWidth: 0,
                minHeight: '40px',
              }}
              onFocus={handleFocusScroll}
            />
          </div>

          {journalFilterMonth && (
            <button
              onClick={() => {
                AudioManager.playClick();
                setJournalFilterMonth('');
              }}
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid #ef4444',
                color: '#ef4444',
                padding: '8px 14px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 'bold',
                minHeight: '40px',
                transition: 'background 0.2s',
                userSelect: 'none',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239, 68, 68, 0.3)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239, 68, 68, 0.15)';
              }}
            >
              {t('clear')}
            </button>
          )}
        </div>
      </div>

      <div className="journal-list" style={{ flex: 1, maxHeight: 'none' }}>
        {logs.length === 0 ? (
          <div className="empty-state">
            {t('emptyJournal').split('\n').map((line: string, i: number) => (
              <span key={i}>
                {line}
                <br />
              </span>
            ))}
          </div>
        ) : (
          logs.map((session: any) => {
            const modelName = session.details?.modelName
              ? i18n.language === 'zh'
                ? session.details.modelName.zh
                : session.details.modelName.en
              : 'Unknown';
            return (
              <div key={session.id} className="journal-item">
                <div className="journal-time">{formatLogDate(session.startedAt)}</div>
                <div className="journal-main">
                  <div className="journal-model">{modelName}</div>
                  <div className="journal-task">
                    {t(session.details?.taskName || '')}
                    {session.stageNameKey && <span className="journal-stage"> - {t(session.stageNameKey)}</span>}
                  </div>
                </div>
                <div className="journal-duration">{formatTime(session.activeSeconds)}</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};