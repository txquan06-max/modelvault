import { AudioManager } from '../core/AudioManager';
import { SessionManager } from '../core/SessionManager';
import { StorageManager } from '../core/StorageManager';
import { useEffect, useState } from 'react';

const LocalHero = ({ image, children, onClick }: { image: string, children: React.ReactNode, onClick: () => void }) => {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (image?.startsWith('local://')) {
      let objUrl: string | null = null;
      StorageManager.loadLocalFileUrl(image).then(res => { if (res) { objUrl = res; setUrl(res); } });
      return () => { if (objUrl) URL.revokeObjectURL(objUrl); };
    } else {
      setUrl(image);
    }
  }, [image]);

  return (
    <div className="detail-hero" style={{ backgroundImage: url ? `url(${url})` : 'none', cursor: 'pointer' }} onClick={onClick}>
      {children}
    </div>
  );
};

export const ModelDetail = (props: any) => {
  const {
    t, i18n, viewingModel, viewingModelTotalSec, formatTime, expandedTaskId, setExpandedTaskId,
    isEditingCover, setIsEditingCover, isEditingImportedStatus, setIsEditingImportedStatus,
    importedStages, setImportedStages, handleConfirmRebuild, showRebuildConfirm, setShowRebuildConfirm,
    handleDoRebuild, handleStartRebuild, handleJumpToFocus, handleCoverUpload, generateShareCard,
    rebuildMode, setRebuildMode // 🌟 接收新属性
  } = props;

  const isZh = i18n.language === 'zh';
  const allSessions = SessionManager.getAllSessions();

  useEffect(() => {
    if (isEditingImportedStatus) {
      setTimeout(() => {
        const el = document.getElementById('imported-status-form');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [isEditingImportedStatus]);

  return (
    <div className="detail-view">
      <LocalHero image={viewingModel.coverImage} onClick={() => setIsEditingCover(true)}>
        <div className="detail-hero-info">
          <div className="detail-title">{isZh ? viewingModel.name.zh : viewingModel.name.en}</div>
          <div className="detail-subtitle">
            <span>{viewingModel.grade} | {isZh ? viewingModel.series.zh : viewingModel.series.en}</span>
            <span>Total: {formatTime(viewingModelTotalSec)}</span>
          </div>
        </div>
        <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10, background: 'rgba(0,0,0,0.6)', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '14px' }}>📷</span>
          <span style={{ fontSize: '11px', color: '#fff', fontWeight: 'bold' }}>{isZh ? '封面' : 'Cover'}</span>
        </div>
      </LocalHero>

      {isEditingCover && (
        <div className="inline-form" style={{ background: 'rgba(0,0,0,0.5)', padding: '12px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#ccc' }}>{isZh ? '上传/修改模型封面' : 'Upload/Modify Cover'}</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <label className="btn start" style={{ flex: 1, padding: '8px', textAlign: 'center', cursor: 'pointer', margin: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>📁 {isZh ? '上传图片' : 'Upload'}<input type="file" accept="image/*" onChange={handleCoverUpload} style={{ display: 'none' }} /></label>
            <button className="btn no" style={{ flex: 1, padding: '8px' }} onClick={() => { AudioManager.playClick(); setIsEditingCover(false); }}>{isZh ? '取消' : 'Cancel'}</button>
          </div>
        </div>
      )}

      {/* 🌟 历史模型改造模式选择 */}
      {isEditingImportedStatus && (
        <div id="imported-status-form" className="custom-section" style={{ border: '1px solid #f59e0b', background: 'rgba(245, 158, 11, 0.1)' }}>
          <h4 style={{ color: '#f59e0b', marginBottom: '8px' }}>📦 {t('rebuild_mode_title')}</h4>
          <p style={{ fontSize: '12px', color: '#ccc', marginBottom: '12px' }}>{t('rebuild_mode_desc')}</p>
          
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <button 
              className={`btn ${rebuildMode === 'part' ? 'start' : 'no'}`} 
              style={{ flex: 1, padding: '10px' }}
              onClick={() => { AudioManager.playClick(); setRebuildMode('part'); }}
            >
              {t('rebuild_by_part')}
            </button>
            <button 
              className={`btn ${rebuildMode === 'whole' ? 'start' : 'no'}`} 
              style={{ flex: 1, padding: '10px' }}
              onClick={() => { AudioManager.playClick(); setRebuildMode('whole'); }}
            >
              {t('rebuild_by_whole')}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: '#ccc' }}>{isZh ? '勾选你当时已经完成的流程：' : 'Check completed stages:'}</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '8px' }}>
              {['stage_assembly', 'stage_scribing', 'stage_lining', 'stage_painting', 'stage_topcoat'].map(stageKey => (
                <label key={stageKey} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={importedStages.includes(stageKey)} disabled={stageKey === 'stage_assembly'} onChange={(e) => { if (e.target.checked) setImportedStages([...importedStages, stageKey]); else setImportedStages(importedStages.filter((k: string) => k !== stageKey)); }} />
                  {t(stageKey)}
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn start" style={{ flex: 1, padding: '8px' }} onClick={handleConfirmRebuild}>{isZh ? '确认并开始改造' : 'Confirm & Start Rebuild'}</button>
              <button className="btn no" style={{ flex: 1, padding: '8px' }} onClick={() => { AudioManager.playClick(); setIsEditingImportedStatus(false); }}>{isZh ? '取消' : 'Cancel'}</button>
            </div>
          </div>
        </div>
      )}

      {showRebuildConfirm && (
        <div className="inline-confirm" style={{ border: '1px solid #3b82f6', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>
          <div className="confirm-text" style={{ fontSize: '14px' }}>{isZh ? '改造状态已激活！' : 'Rebuild activated!'}<br/><span>{isZh ? '是否直接跳转至专注页面开始制作？' : 'Jump to focus page now?'}</span></div>
          <div className="confirm-actions">
            <button className="btn yes" onClick={handleDoRebuild}>{isZh ? '是，前往专注' : 'Yes, go to Focus'}</button>
            <button className="btn no" onClick={() => { AudioManager.playClick(); setShowRebuildConfirm(false); }}>{isZh ? '留在详情页' : 'Stay here'}</button>
          </div>
        </div>
      )}

      <div className="timeline-container" style={{ maxHeight: '350px', overflowY: 'auto', paddingRight: '4px' }}>
        {viewingModel.tasks.map((task: any) => {
          const taskSessions = allSessions.filter((s: any) => s.taskId === task.id);
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
                  {task.stages.map((stage: any) => {
                    const stageTime = taskSessions.filter((s: any) => s.stageId === stage.id).reduce((sum: number, s: any) => sum + s.activeSeconds, 0);
                    return (
                      <div key={stage.id} className={`stage-detail-item ${stage.status === 'Completed' ? 'done' : ''}`}>
                        <div className={`stage-detail-header ${stage.status === 'Completed' ? 'done' : ''}`}>
                          <span>{t(stage.nameKey)}</span>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            {stageTime > 0 && <span style={{ color: '#10b981', fontWeight: 'bold' }}>⏱ {formatTime(stageTime)}</span>}
                            <span>{stage.status === 'Completed' ? 'Done' : (stage.status === 'InProgress' ? 'In Progress' : 'Pending')}</span>
                          </div>
                        </div>
                        {stage.photoUrl && <img src={stage.photoUrl} alt="progress" className="stage-photo" onError={(e) => (e.currentTarget.style.display = 'none')} />}
                      </div>
                    );
                  })}
                  
                  {/* 🌟 修复按钮拥挤问题：增加 marginTop，宽度100%，增大 padding */}
                  <button 
                    className="mini-btn" 
                    style={{ width: '100%', marginTop: '16px', background: '#3b82f6', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold' }}
                    onClick={() => { 
                      AudioManager.playClick();
                      if (viewingModel.isImported && !viewingModel.isRebuilding) {
                        handleStartRebuild(task.id); 
                      } else {
                        handleJumpToFocus(task.id, task.stages.find((s: any) => s.status !== 'Completed')?.id || task.stages[0].id); 
                      }
                    }}>
                    {viewingModel.isImported && !viewingModel.isRebuilding ? (isZh ? `🔧 开始继续改造` : `🔧 Start Rebuild`) : (isZh ? `⏱ 去专注` : `⏱ Focus`)}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button className="btn start" style={{ width: '100%', marginTop: '16px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', border: 'none', padding: '12px' }} onClick={() => generateShareCard(viewingModel, viewingModelTotalSec)}>
        📸 {isZh ? '生成专属战报' : 'Generate Build Report'}
      </button>
    </div>
  );
};