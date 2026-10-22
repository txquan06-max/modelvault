import { AudioManager } from '../core/AudioManager';
import { SessionManager } from '../core/SessionManager';

export const ModelDetail = (props: any) => {
  const {
    t, i18n, viewingModel, viewingModelTotalSec, formatTime, expandedTaskId, setExpandedTaskId,
    isEditingCover, setIsEditingCover, isEditingImportedStatus, setIsEditingImportedStatus,
    importedStages, setImportedStages, handleConfirmRebuild, showRebuildConfirm, setShowRebuildConfirm,
    handleDoRebuild, handleStartRebuild, handleJumpToFocus, handleCoverUpload, generateShareCard
  } = props;

  return (
    <div className="detail-view">
      <div className="detail-hero" style={{ backgroundImage: viewingModel.coverImage ? `url(${viewingModel.coverImage})` : 'none' }}>
        <div className="detail-hero-info">
          <div className="detail-title">{i18n.language === 'zh' ? viewingModel.name.zh : viewingModel.name.en}</div>
          <div className="detail-subtitle">
            <span>{viewingModel.grade} | {i18n.language === 'zh' ? viewingModel.series.zh : viewingModel.series.en}</span>
            <span>Total: {formatTime(viewingModelTotalSec)}</span>
          </div>
        </div>
        <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10, background: 'rgba(0,0,0,0.6)', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => setIsEditingCover(true)}>
          <span style={{ fontSize: '14px' }}>📷</span>
          <span style={{ fontSize: '11px', color: '#fff', fontWeight: 'bold' }}>封面</span>
        </div>
      </div>

      {isEditingCover && (
        <div className="inline-form" style={{ background: 'rgba(0,0,0,0.5)', padding: '12px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#ccc' }}>上传/修改模型封面</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <label className="btn start" style={{ flex: 1, padding: '8px', textAlign: 'center', cursor: 'pointer', margin: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>📁 上传图片<input type="file" accept="image/*" onChange={handleCoverUpload} style={{ display: 'none' }} /></label>
            <button className="btn no" style={{ flex: 1, padding: '8px' }} onClick={() => { AudioManager.playClick(); setIsEditingCover(false); }}>取消</button>
          </div>
        </div>
      )}

      {isEditingImportedStatus && (
        <div className="custom-section" style={{ border: '1px solid #f59e0b', background: 'rgba(245, 158, 11, 0.1)' }}>
          <h4 style={{ color: '#f59e0b', marginBottom: '8px' }}>📦 历史模型进度录入</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: '#ccc' }}>勾选你当时已经完成的流程：</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '8px' }}>
              {['stage_assembly', 'stage_scribing', 'stage_lining', 'stage_painting', 'stage_topcoat'].map(stageKey => (
                <label key={stageKey} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={importedStages.includes(stageKey)} disabled={stageKey === 'stage_assembly'} onChange={(e) => { if (e.target.checked) setImportedStages([...importedStages, stageKey]); else setImportedStages(importedStages.filter((k: string) => k !== stageKey)); }} />
                  {t(stageKey)}
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn start" style={{ flex: 1, padding: '6px' }} onClick={handleConfirmRebuild}>确认并开始改造</button>
              <button className="btn no" style={{ flex: 1, padding: '6px' }} onClick={() => { AudioManager.playClick(); setIsEditingImportedStatus(false); }}>取消</button>
            </div>
          </div>
        </div>
      )}

      {showRebuildConfirm && (
        <div className="inline-confirm" style={{ border: '1px solid #3b82f6', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>
          <div className="confirm-text" style={{ fontSize: '14px' }}>改造状态已激活！<br/><span>是否直接跳转至专注页面开始制作？</span></div>
          <div className="confirm-actions">
            <button className="btn yes" onClick={handleDoRebuild}>是，前往专注</button>
            <button className="btn no" onClick={() => { AudioManager.playClick(); setShowRebuildConfirm(false); }}>留在详情页</button>
          </div>
        </div>
      )}

      <div className="timeline-container" style={{ maxHeight: '350px', overflowY: 'auto', paddingRight: '4px' }}>
        {viewingModel.tasks.map((task: any) => {
          const taskSessions = SessionManager.getAllSessions().filter((s: any) => s.taskId === task.id);
          const taskTime = taskSessions.reduce((sum: number, s: any) => sum + s.activeSeconds, 0);
          const isExpanded = expandedTaskId === task.id;
          const isCompleted = task.status === 'Completed';
          return (
            <div key={task.id} className="timeline-item">
              <div className="timeline-header" onClick={() => { AudioManager.playClick(); setExpandedTaskId(isExpanded ? null : task.id); }}>
                <div className="timeline-title">{isCompleted ? '✅' : '⏳'} {t(task.name)}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="timeline-time">{formatTime(taskTime)}</span>
                  <span style={{ color: '#666', fontSize: '10px' }}>{isExpanded ? '▲' : '▼'}</span>
                </div>
              </div>
              {isExpanded && (
                <div className="timeline-content">
                  {task.stages.map((stage: any) => (
                    <div key={stage.id} className={`stage-detail-item ${stage.status === 'Completed' ? 'done' : ''}`}>
                      <div className={`stage-detail-header ${stage.status === 'Completed' ? 'done' : ''}`}>
                        <span>{t(stage.nameKey)}</span>
                        <span>{stage.status === 'Completed' ? 'Done' : (stage.status === 'InProgress' ? 'In Progress' : 'Pending')}</span>
                      </div>
                      {stage.photoUrl && <img src={stage.photoUrl} alt="progress" className="stage-photo" onError={(e) => (e.currentTarget.style.display = 'none')} />}
                    </div>
                  ))}
                  <button className="mini-btn" style={{ width: '100%', marginTop: '8px', background: '#3b82f6', color: '#fff', border: 'none', padding: '8px' }}
                    onClick={() => { if (viewingModel.isImported && !viewingModel.isRebuilding) handleStartRebuild(task.id); else handleJumpToFocus(task.id, task.stages.find((s: any) => s.status !== 'Completed')?.id || task.stages[0].id); }}>
                    {viewingModel.isImported && !viewingModel.isRebuilding ? `🔧 开始继续改造` : `⏱ ${t('focus')}`}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button className="btn start" style={{ width: '100%', marginTop: '16px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', border: 'none', padding: '12px' }} onClick={() => generateShareCard(viewingModel, viewingModelTotalSec)}>
        📸 {i18n.language === 'zh' ? '生成专属战报' : 'Generate Build Report'}
      </button>
    </div>
  );
};