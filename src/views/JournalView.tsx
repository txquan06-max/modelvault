// src/views/JournalView.tsx
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AudioManager } from '../core/AudioManager';
import { SessionManager } from '../core/SessionManager';
import { ModelManager } from '../core/ModelManager';
import { formatTime, formatLogDate, handleFocusScroll, getMonthKey, normalizeMonthInput } from '../utils/format';

export const JournalView = () => {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === 'zh';

  // 🌟 批次 10B：完全零 props，月份过滤器改为组件内部 state
  const [journalFilterMonth, setJournalFilterMonth] = useState('');

  // 🌟 顺手修复：原 App.tsx 传入的 getHistoryLogs() 并没有应用月份过滤
  // 这里内聚到 JournalView，并真正按 journalFilterMonth 过滤
  const logs = useMemo(() => {
    const allLogs = SessionManager.getAllSessions()
      .sort((a, b) => b.startedAt - a.startedAt)
      .map(s => ({ ...s, details: ModelManager.getTaskDetails(s.taskId) }));

    if (!journalFilterMonth) return allLogs;

    const filterKey = normalizeMonthInput(journalFilterMonth); // YYYY-MM -> YYYYMM
    return allLogs.filter(s => getMonthKey(s.startedAt) === filterKey);
  }, [journalFilterMonth]);

  return (
    <div className="view-content journal-view" style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%' }}>

      {/* 顶部筛选栏：扩大触达面积 + 图标联动 + 暗色原生日历 */}
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
          {isZh ? '制作日志' : 'Journal'}
        </span>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* 整块容器可点击，点击除 input 本身的区域会 focus + showPicker */}
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
              {isZh ? '清除' : 'Clear'}
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