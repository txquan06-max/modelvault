import { AudioManager } from '../core/AudioManager';

export const JournalView = ({ t, i18n, getHistoryLogs, journalFilterMonth, setJournalFilterMonth, formatTime, formatLogDate, handleFocus }: any) => {
  return (
    <div className="view-content journal-view" style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ fontSize: '13px', color: '#ccc', fontWeight: 'bold' }}>制作日志</span>
        <input 
          type="month" 
          value={journalFilterMonth} 
          onChange={e => { AudioManager.playClick(); setJournalFilterMonth(e.target.value); }} 
          style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid #555', color: '#fff', padding: '4px 8px', borderRadius: '6px', outline: 'none', fontSize: '12px' }}
          onFocus={handleFocus}
        />
        {journalFilterMonth && <button className="mini-btn" onClick={() => { AudioManager.playClick(); setJournalFilterMonth(''); }}>清除</button>}
      </div>
      <div className="journal-list" style={{ flex: 1, maxHeight: 'none' }}>
        {getHistoryLogs().length === 0 ? (
          <div className="empty-state">{t('emptyJournal').split('\n').map((line: string, i: number) => <span key={i}>{line}<br/></span>)}</div>
        ) : (
          getHistoryLogs().map((session: any) => {
            const modelName = session.details?.modelName 
              ? (i18n.language === 'zh' ? session.details.modelName.zh : session.details.modelName.en)
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