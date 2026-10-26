import { AudioManager } from '../core/AudioManager';
import { SessionManager } from '../core/SessionManager';
import { StorageManager, FILE_SUBDIRS } from '../core/StorageManager';
import { ModelManager } from '../core/ModelManager';
import { DailyQuestManager } from '../core/DailyQuestManager';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/useAppStore';
import type { ShareCardTemplate } from '../utils/shareCard';
import { generateShareCard } from '../utils/shareCard';

const isTauriEnv = typeof window !== 'undefined' && !!(window as any).__TAURI_INTERNALS__;

const useLocalImageSrc = (image?: string): string | null => {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!image) { setUrl(null); return; }
    let objUrl: string | null = null;

    if (image.startsWith('local://')) {
      StorageManager.loadLocalFileUrl(image).then((res) => {
        if (res) { objUrl = res; setUrl(res); }
        else setUrl(null);
      });
      return () => { if (objUrl) URL.revokeObjectURL(objUrl); };
    } else {
      setUrl(image);
    }
  }, [image]);

  return url;
};

const LocalHero = ({ image, children, onClick }: { image: string, children: React.ReactNode, onClick: () => void }) => {
  const url = useLocalImageSrc(image);
  return (
    <div className="detail-hero" style={{ backgroundImage: url ? `url(${url})` : 'none', cursor: 'pointer' }} onClick={onClick}>
      {children}
    </div>
  );
};

export const ModelDetail = (props: any) => {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === 'zh';

  const { models, setModels, refreshData, currentBot, username, level, equippedTitle } = useAppStore();

  const {
    viewingModel, viewingModelTotalSec, formatTime, expandedTaskId, setExpandedTaskId,
    isEditingCover, setIsEditingCover, isEditingImportedStatus, setIsEditingImportedStatus,
    importedStages, setImportedStages, handleConfirmRebuild, showRebuildConfirm, setShowRebuildConfirm,
    handleDoRebuild, handleStartRebuild, handleJumpToFocus, handleCoverUpload,
    rebuildMode, setRebuildMode, showToast
  } = props;

  const allSessions = SessionManager.getAllSessions();

  const needsRebuild = viewingModel.isImported && !viewingModel.isRebuilding;
  const coverPreviewUrl = useLocalImageSrc(viewingModel.coverImage);

  const [editingNoteStageId, setEditingNoteStageId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [template, setTemplate] = useState<ShareCardTemplate>('cyber');
  const [isGenerating, setIsGenerating] = useState(false);
  const [saveProgress, setSaveProgress] = useState('');

  useEffect(() => {
    if (isEditingImportedStatus) {
      setTimeout(() => {
        const el = document.getElementById('imported-status-form');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [isEditingImportedStatus]);

  const handleSaveNote = (taskId: string, stageId: string) => {
    AudioManager.playClick();
    let wasEmpty = true;
    for (const m of models) {
      const task = m.tasks.find((t: any) => t.id === taskId);
      const stage = task?.stages.find((s: any) => s.id === stageId);
      if (stage) {
        wasEmpty = !stage.note || !stage.note.trim();
        break;
      }
    }

    const updated = ModelManager.updateStageNote(taskId, stageId, noteText);
    setModels(updated);
    refreshData();
    setEditingNoteStageId(null);
    setNoteText('');

    if (wasEmpty && noteText.trim()) {
      DailyQuestManager.updateProgress('write_note', 1);
    }
  };

  // 🌟 战报保存到 reports/ 子目录
  const handleGenerateShareCard = async () => {
    if (isGenerating) return;
    AudioManager.playClick();
    setIsGenerating(true);
    setSaveProgress(isZh ? '渲染中...' : 'Rendering...');

    const detailedStats = ModelManager.getDetailedStatsForShareCard(viewingModel.id);
    if (!detailedStats) {
      setIsGenerating(false);
      setSaveProgress('');
      return;
    }

    const formatFn = (sec: number) => {
      const h = Math.floor(sec / 3600);
      const m = Math.floor((sec % 3600) / 60).toString().padStart(2, '0');
      const s = (sec % 60).toString().padStart(2, '0');
      if (h > 0) return `${h}:${m}:${s}`;
      return `${m}:${s}`;
    };

    try {
      const blob = await generateShareCard({
        model: detailedStats.model,
        totalTime: detailedStats.totalTime,
        stageTimes: detailedStats.stageTimes,
        template,
        isZh,
        username,
        level,
        currentBot,
        equippedTitle,
        formatTime: formatFn,
        t,
      });

      const safeName = (detailedStats.model.name.en || 'model').replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
      
      // 🌟 使用 FILE_SUBDIRS.REPORT 常量，自动存入 reports/ 目录
      const filename = `${FILE_SUBDIRS.REPORT}/ModelVault_${safeName}_${Date.now()}.jpg`;

      if (isTauriEnv) {
        setSaveProgress(isZh ? '保存中...' : 'Saving...');
        const localPath = await StorageManager.saveFileToLocal(filename, blob);
        if (localPath) {
          AudioManager.playFinishPart();
          showToast(`✅ ${isZh ? '已保存到本地图库' : 'Saved to local gallery'}: reports/...`);
        } else {
          showToast(isZh ? '⚠️ 请先在个人中心挂载本地图库' : '⚠️ Please mount a local gallery first (Profile → Data Expansion)');
        }
      } else {
        // Web 端传统下载（无法直接写本地文件夹）
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        // Web 端仍使用默认下载路径，但文件名保持一致
        a.download = filename.split('/').pop() || filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        AudioManager.playFinishPart();
        showToast(t('toast_report_saved'));
      }
    } catch (err) {
      console.error('[Share Card] Failed:', err);
      showToast(t('toast_report_fail'));
    } finally {
      setIsGenerating(false);
      setSaveProgress('');
    }
  };

  return (
    <div className="detail-view">
      <LocalHero image={viewingModel.coverImage} onClick={() => setIsEditingCover(true)}>
        <div className="detail-hero-info">
          <div className="detail-title">{isZh ? viewingModel.name.zh : viewingModel.name.en}</div>
          <div className="detail-subtitle">
            <span>{viewingModel.grade} | {isZh ? viewingModel.series.zh : viewingModel.series.en}</span>
            <span>{t('totalTime')}: {formatTime(viewingModelTotalSec)}</span>
          </div>
        </div>
        <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10, background: 'rgba(0,0,0,0.6)', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '14px' }}>📷</span>
          <span style={{ fontSize: '11px', color: '#fff', fontWeight: 'bold' }}>{t('btn_cover')}</span>
        </div>
      </LocalHero>

      {isEditingCover && (
        <div className="inline-form" style={{ background: 'rgba(0,0,0,0.5)', padding: '12px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#ccc' }}>{t('btn_upload_cover')}</span>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ width: '140px', aspectRatio: '4 / 3', backgroundImage: coverPreviewUrl ? `url(${coverPreviewUrl})` : 'none', backgroundColor: '#333', backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: '6px', border: '1px solid #555', flexShrink: 0 }}>
              {!coverPreviewUrl && <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#666', fontSize: '12px' }}>{t('noImage')}</div>}
            </div>
            <div style={{ fontSize: '11px', color: '#aaa', lineHeight: 1.5 }}>
              {t('cover_preview_hint')}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <label className="btn start" style={{ flex: 1, padding: '8px', textAlign: 'center', cursor: 'pointer', margin: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>📁 {t('uploadImage')}<input type="file" accept="image/*" onChange={handleCoverUpload} style={{ display: 'none' }} /></label>
            <button className="btn no" style={{ flex: 1, padding: '8px' }} onClick={() => { AudioManager.playClick(); setIsEditingCover(false); }}>{t('cancel')}</button>
          </div>
        </div>
      )}

      {needsRebuild && !isEditingImportedStatus && (
        <button className="btn start" style={{ width: '100%', padding: '16px', fontSize: '16px', fontWeight: 'bold', background: 'linear-gradient(135deg, #f59e0b, #ef4444)', border: 'none', boxShadow: '0 4px 15px rgba(245, 158, 11, 0.4)' }} onClick={() => { AudioManager.playClick(); handleStartRebuild(null); }}>
          🔧 {t('btn_start_rebuild_legacy')}
        </button>
      )}

      {isEditingImportedStatus && (
        <div id="imported-status-form" className="custom-section" style={{ border: '1px solid #f59e0b', background: 'rgba(245, 158, 11, 0.1)' }}>
          <h4 style={{ color: '#f59e0b', marginBottom: '6px' }}>📦 {t('rebuild_mode_title')}</h4>
          <p style={{ fontSize: '12px', color: '#ccc', marginBottom: '10px' }}>{t('rebuild_mode_desc')}</p>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
            <button className={`btn ${rebuildMode === 'part' ? 'start' : 'no'}`} style={{ flex: 1, padding: '10px' }} onClick={() => { AudioManager.playClick(); setRebuildMode('part'); }}>{t('rebuild_by_part')}</button>
            <button className={`btn ${rebuildMode === 'whole' ? 'start' : 'no'}`} style={{ flex: 1, padding: '10px' }} onClick={() => { AudioManager.playClick(); setRebuildMode('whole'); }}>{t('rebuild_by_whole')}</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: '#ccc' }}>{t('rebuild_check_stages')}</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '8px' }}>
              {['stage_assembly', 'stage_scribing', 'stage_lining', 'stage_painting', 'stage_topcoat'].map(stageKey => (
                <label key={stageKey} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={importedStages.includes(stageKey)} disabled={stageKey === 'stage_assembly'} onChange={(e) => { if (e.target.checked) setImportedStages([...importedStages, stageKey]); else setImportedStages(importedStages.filter((k: string) => k !== stageKey)); }} />
                  {t(stageKey)}
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn start" style={{ flex: 1, padding: '8px' }} onClick={handleConfirmRebuild}>{t('rebuild_confirm_start')}</button>
              <button className="btn no" style={{ flex: 1, padding: '8px' }} onClick={() => { AudioManager.playClick(); setIsEditingImportedStatus(false); }}>{t('cancel')}</button>
            </div>
          </div>
        </div>
      )}

      {showRebuildConfirm && (
        <div className="inline-confirm" style={{ border: '1px solid #3b82f6', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>
          <div className="confirm-text" style={{ fontSize: '14px' }}>{t('rebuild_activated')}<br /><span>{t('rebuild_jump_prompt')}</span></div>
          <div className="confirm-actions">
            <button className="btn yes" onClick={handleDoRebuild}>{t('rebuild_yes_go_focus')}</button>
            <button className="btn no" onClick={() => { AudioManager.playClick(); setShowRebuildConfirm(false); }}>{t('rebuild_stay_here')}</button>
          </div>
        </div>
      )}

      <div className="timeline-container" style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '4px' }}>
        {viewingModel.tasks.map((task: any) => {
          if (needsRebuild && task.name !== 'part_legacy') return null;

          const taskSessions = allSessions.filter((s: any) => s.taskId === task.id);
          const taskTime = taskSessions.reduce((sum: number, s: any) => sum + s.activeSeconds, 0);
          const isExpanded = expandedTaskId === task.id;
          const isCompleted = task.status === 'Completed';

          return (
            <div key={task.id} className="timeline-item">
              <div className="timeline-header" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }} onClick={() => { AudioManager.playClick(); setExpandedTaskId(isExpanded ? null : task.id); }}>
                <div className="timeline-title" style={{ flex: 1, minWidth: 0 }}>
                  <span>{isCompleted ? '✅' : '⏳'}</span>
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t(task.name)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <span className="timeline-time" style={{ fontSize: '13px' }}>{formatTime(taskTime)}</span>
                  <span style={{ color: '#666', fontSize: '12px', width: '16px', textAlign: 'center' }}>{isExpanded ? '▲' : '▼'}</span>
                </div>
              </div>

              {isExpanded && (
                <div className="timeline-content" style={{ padding: '16px' }}>
                  {task.stages.map((stage: any) => {
                    const stageTime = taskSessions.filter((s: any) => s.stageId === stage.id).reduce((sum: number, s: any) => sum + s.activeSeconds, 0);
                    const isEditingThisNote = editingNoteStageId === stage.id;

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

                        <div style={{ marginTop: '8px', background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '4px' }}>
                          {isEditingThisNote ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <textarea
                                autoFocus
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                                placeholder={t('placeholder_add_note')}
                                style={{ width: '100%', minHeight: '60px', background: 'rgba(0,0,0,0.5)', border: '1px solid #3b82f6', color: '#fff', borderRadius: '4px', padding: '6px', fontSize: '12px', outline: 'none', resize: 'vertical' }}
                              />
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <button className="mini-btn" style={{ background: 'transparent', border: '1px solid #555', color: '#aaa' }} onClick={() => setEditingNoteStageId(null)}>{t('cancel')}</button>
                                <button className="mini-btn" style={{ background: '#3b82f6', border: 'none', color: '#fff' }} onClick={() => handleSaveNote(task.id, stage.id)}>{t('save')}</button>
                              </div>
                            </div>
                          ) : (
                            <div
                              onClick={() => { setEditingNoteStageId(stage.id); setNoteText(stage.note || ''); }}
                              style={{ fontSize: '12px', color: stage.note ? '#ccc' : '#666', cursor: 'pointer', fontStyle: stage.note ? 'normal' : 'italic', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                            >
                              <span style={{ whiteSpace: 'pre-wrap' }}>{stage.note || t('add_note_hint')}</span>
                              <span style={{ fontSize: '10px', opacity: 0.5 }}>📝</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {(!needsRebuild || task.name !== 'part_legacy') && (
                    <button className="mini-btn" style={{ width: '100%', marginTop: '12px', background: '#3b82f6', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold' }} onClick={() => { AudioManager.playClick(); handleJumpToFocus(task.id, task.stages.find((s: any) => s.status !== 'Completed')?.id || task.stages[0].id); }}>
                      ⏱ {t('start_focus')}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: '16px', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff' }}>🎨 {t('report_select_style')}</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['cyber', 'minimal', 'glitch'] as ShareCardTemplate[]).map(tpl => (
            <button
              key={tpl}
              onClick={() => { AudioManager.playClick(); setTemplate(tpl); }}
              disabled={isGenerating}
              style={{
                flex: 1, padding: '8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold',
                cursor: isGenerating ? 'not-allowed' : 'pointer',
                background: template === tpl ? '#3b82f6' : 'rgba(255,255,255,0.05)',
                color: template === tpl ? '#fff' : '#aaa',
                border: `1px solid ${template === tpl ? '#3b82f6' : 'rgba(255,255,255,0.1)'}`,
                opacity: isGenerating ? 0.5 : 1,
              }}
            >
              {tpl === 'cyber' ? t('report_cyber') : tpl === 'minimal' ? t('report_minimal') : t('report_glitch')}
            </button>
          ))}
        </div>
        <button
          className="btn start"
          style={{ width: '100%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', border: 'none', padding: '12px', fontWeight: 'bold', opacity: isGenerating ? 0.6 : 1 }}
          onClick={handleGenerateShareCard}
          disabled={isGenerating}
        >
          {isGenerating ? `⏳ ${saveProgress}` : `📸 ${t('btn_gen_report')}`}
        </button>
      </div>
    </div>
  );
};