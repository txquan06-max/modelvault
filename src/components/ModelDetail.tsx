import { AudioManager } from '../core/AudioManager';
import { SessionManager } from '../core/SessionManager';
import { StorageManager, FILE_SUBDIRS } from '../core/StorageManager';
import { ModelManager } from '../core/ModelManager';
import { DailyQuestManager } from '../core/DailyQuestManager';
import { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
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

// 🌟 顶部相册缩略图组件
const GalleryPhoto = ({ url, onClick, onRemove }: { url: string, onClick: () => void, onRemove: (e: React.MouseEvent) => void }) => {
  const resolvedUrl = useLocalImageSrc(url);
  return (
    <div style={{ width: '160px', height: '180px', borderRadius: '12px', overflow: 'hidden', position: 'relative', flexShrink: 0, background: '#222', scrollSnapAlign: 'start' }}>
      {resolvedUrl ? (
        <img src={resolvedUrl} alt="gallery" style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }} onClick={onClick} />
      ) : (
        <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#666', fontSize: '12px' }}>加载中</div>
      )}
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(e); }}
        style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.7)', color: '#ef4444', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
      >
        ✕
      </button>
    </div>
  );
};

// 工序内的小缩略图组件
const PhotoThumbnail = ({ photoUrl, onClick, onRemove }: { photoUrl: string, onClick: () => void, onRemove: (e: React.MouseEvent) => void }) => {
  const url = useLocalImageSrc(photoUrl);
  return (
    <div style={{ position: 'relative', width: '80px', height: '60px', flexShrink: 0, borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', background: '#222' }} onClick={onClick}>
      {url ? (
        <img src={url} alt="progress" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '12px', color: '#666' }}>...</div>
      )}
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(e); }}
        style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(0,0,0,0.6)', color: '#ef4444', border: 'none', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
      >
        ✕
      </button>
    </div>
  );
};

const STAGE_COLORS: Record<string, string> = {
  stage_assembly: '#3b82f6',
  stage_scribing: '#8b5cf6',
  stage_lining: '#10b981',
  stage_painting: '#f59e0b',
  stage_topcoat: '#ef4444',
};

const StageDistributionChart = ({
  stageTime,
  formatTime,
  t,
}: {
  stageTime: Record<string, number>;
  formatTime: (sec: number) => string;
  t: (key: string) => string;
}) => {
  const entries = Object.keys(STAGE_COLORS)
    .map(key => ({ key, time: stageTime[key] || 0, color: STAGE_COLORS[key] }))
    .filter(e => e.time > 0);

  const total = entries.reduce((sum, e) => sum + e.time, 0);
  if (total === 0) return null;

  return (
    <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '8px' }}>
        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
          📊 {t('stage_distribution_title')}
          <span style={{ fontSize: '10px', color: '#666', fontWeight: 'normal' }}>
            ({t('stage_distribution_subtitle')})
          </span>
        </div>
        <div style={{ fontSize: '13px', color: '#3b82f6', fontWeight: 'bold', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
          {formatTime(total)}
        </div>
      </div>

      <div style={{ display: 'flex', width: '100%', height: '14px', borderRadius: '7px', overflow: 'hidden', background: 'rgba(255,255,255,0.05)', marginBottom: '14px', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)' }}>
        {entries.map(e => {
          const percent = (e.time / total) * 100;
          return (
            <div
              key={e.key}
              title={`${t(e.key)}: ${formatTime(e.time)} (${percent.toFixed(1)}%)`}
              style={{ width: `${percent}%`, height: '100%', background: e.color, transition: 'width 0.3s', cursor: 'help', minWidth: percent > 0 ? '2px' : 0 }}
            />
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '8px' }}>
        {entries.map(e => {
          const percent = (e.time / total) * 100;
          return (
            <div key={e.key} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: e.color, flexShrink: 0, boxShadow: `0 0 6px ${e.color}60` }} />
              <span style={{ color: '#ccc', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t(e.key)}</span>
              <span style={{ color: '#fff', fontWeight: 'bold', fontVariantNumeric: 'tabular-nums' }}>{formatTime(e.time)}</span>
              <span style={{ color: '#666', fontSize: '10px', minWidth: '34px', textAlign: 'right' }}>{percent.toFixed(0)}%</span>
            </div>
          );
        })}
      </div>
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

  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);
  const previewResolvedUrl = useLocalImageSrc(previewPhotoUrl || undefined);

  // 删除确认
  const [deletePhotoConfirm, setDeletePhotoConfirm] = useState<{ taskId: string, stageId: string, photoUrl: string } | null>(null);
  const [deleteGalleryConfirm, setDeleteGalleryConfirm] = useState<string | null>(null);

  const stageTimeStats = useMemo(() => {
    const stageTime: Record<string, number> = {};
    const taskIds = viewingModel.tasks.map((t: any) => t.id);
    allSessions
      .filter((s: any) => taskIds.includes(s.taskId) && s.stageId)
      .forEach((s: any) => {
        const key = ModelManager.getStageNameKey(s.taskId, s.stageId);
        if (key) stageTime[key] = (stageTime[key] || 0) + s.activeSeconds;
      });
    return stageTime;
  }, [viewingModel, allSessions]);

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

  // 🌟 顶部通用相册上传
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    showToast(t('processing'));

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async (ev) => {
      const img = new Image();
      img.src = ev.target?.result as string;
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        let w = img.width; let h = img.height;
        if (w > 1280) { h = Math.round((h * 1280) / w); w = 1280; }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d')?.drawImage(img, 0, 0, w, h);
        canvas.toBlob(async (blob) => {
          let finalBlob = blob;
          let ext = 'webp';
          if (!blob) {
            finalBlob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/jpeg', 0.7));
            ext = 'jpg';
          }
          if (!finalBlob) return;
          
          const filename = `${FILE_SUBDIRS.PROGRESS}/gallery_${Date.now()}.${ext}`;
          const localPath = await StorageManager.saveFileToLocal(filename, finalBlob);
          const finalUrl = localPath || canvas.toDataURL(`image/${ext}`, 0.7);
          
          const updated = ModelManager.addModelGalleryPhoto(viewingModel.id, finalUrl);
          setModels(updated);
          refreshData();
          showToast(t('toast_photo_added'));
          useAppStore.getState().triggerAutoBackup();
        }, 'image/webp', 0.6);
      };
    };
    e.target.value = '';
  };

  const confirmRemoveGallery = () => {
    if (!deleteGalleryConfirm) return;
    AudioManager.playClick();
    const updated = ModelManager.removeModelGalleryPhoto(viewingModel.id, deleteGalleryConfirm);
    setModels(updated);
    refreshData();
    setDeleteGalleryConfirm(null);
    showToast(t('toast_deleted'));
    useAppStore.getState().triggerAutoBackup();
  };

  // 🌟 工序内专属相册上传
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, taskId: string, stageId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    showToast(t('processing'));

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async (ev) => {
      const img = new Image();
      img.src = ev.target?.result as string;
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        let w = img.width; let h = img.height;
        if (w > 1280) { h = Math.round((h * 1280) / w); w = 1280; }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d')?.drawImage(img, 0, 0, w, h);
        canvas.toBlob(async (blob) => {
          let finalBlob = blob;
          let ext = 'webp';
          if (!blob) {
            finalBlob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/jpeg', 0.7));
            ext = 'jpg';
          }
          if (!finalBlob) return;
          
          const filename = `${FILE_SUBDIRS.PROGRESS}/progress_${Date.now()}.${ext}`;
          const localPath = await StorageManager.saveFileToLocal(filename, finalBlob);
          const finalUrl = localPath || canvas.toDataURL(`image/${ext}`, 0.7);
          
          const updated = ModelManager.addStagePhoto(taskId, stageId, finalUrl);
          setModels(updated);
          refreshData();
          showToast(t('toast_photo_added'));
          useAppStore.getState().triggerAutoBackup();
        }, 'image/webp', 0.6);
      };
    };
    e.target.value = '';
  };

  const confirmRemovePhoto = () => {
    if (!deletePhotoConfirm) return;
    const { taskId, stageId, photoUrl } = deletePhotoConfirm;
    AudioManager.playClick();
    const updated = ModelManager.removeStagePhoto(taskId, stageId, photoUrl);
    setModels(updated);
    refreshData();
    setDeletePhotoConfirm(null);
    showToast(t('toast_deleted'));
    useAppStore.getState().triggerAutoBackup();
  };

  const handleGenerateShareCard = async () => {
    if (isGenerating) return;
    AudioManager.playClick();
    setIsGenerating(true);
    setSaveProgress(t('report_rendering'));

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
      const filename = `${FILE_SUBDIRS.REPORT}/ModelVault_${safeName}_${Date.now()}.jpg`;

      if (isTauriEnv) {
        setSaveProgress(t('report_saving'));
        const localPath = await StorageManager.saveFileToLocal(filename, blob);
        if (localPath) {
          AudioManager.playFinishPart();
          showToast(`✅ ${t('toast_report_saved_to_gallery')}`);
        } else {
          showToast(t('toast_gallery_not_mounted'));
        }
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
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
      {/* 🌟 顶部：相册轮播区 */}
      <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch', marginBottom: '16px' }}>
        
        {/* 1. 封面卡片 */}
        <div 
          className="detail-hero" 
          style={{ minWidth: '85%', width: '85%', height: '180px', flexShrink: 0, scrollSnapAlign: 'start', backgroundImage: coverPreviewUrl ? `url(${coverPreviewUrl})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: '12px', position: 'relative', cursor: 'pointer' }}
          onClick={() => setIsEditingCover(true)}
        >
          <div className="detail-hero-info" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px', background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)' }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff' }}>{isZh ? viewingModel.name.zh : viewingModel.name.en}</div>
            <div style={{ fontSize: '12px', color: '#ccc', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
              <span>{viewingModel.grade} | {isZh ? viewingModel.series.zh : viewingModel.series.en}</span>
              <span>{t('totalTime')}: {formatTime(viewingModelTotalSec)}</span>
            </div>
          </div>
          <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.6)', borderRadius: '6px', padding: '4px 8px', fontSize: '11px', color: '#fff', fontWeight: 'bold' }}>📷 {t('btn_cover')}</div>
        </div>

        {/* 2. 相册照片 */}
        {viewingModel.galleryPhotos?.map((url: string) => (
          <GalleryPhoto
            key={url}
            url={url}
            onClick={() => setPreviewPhotoUrl(url)}
            onRemove={() => setDeleteGalleryConfirm(url)}
          />
        ))}

        {/* 3. 上传按钮 */}
        <label style={{ width: '160px', height: '180px', flexShrink: 0, scrollSnapAlign: 'start', borderRadius: '12px', border: '2px dashed #555', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', background: 'rgba(0,0,0,0.3)', color: '#888', gap: '8px' }}>
          <span style={{ fontSize: '32px' }}>+</span>
          <span style={{ fontSize: '12px' }}>{t('add_progress_photo')}</span>
          <input type="file" accept="image/*" onChange={handleGalleryUpload} style={{ display: 'none' }} />
        </label>

      </div>

      <StageDistributionChart stageTime={stageTimeStats} formatTime={formatTime} t={t} />

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
                    const photos = stage.processPhotos || [];

                    return (
                      <div key={stage.id} className={`stage-detail-item ${stage.status === 'Completed' ? 'done' : ''}`}>
                        <div className={`stage-detail-header ${stage.status === 'Completed' ? 'done' : ''}`}>
                          <span>{t(stage.nameKey)}</span>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            {stageTime > 0 && <span style={{ color: '#10b981', fontWeight: 'bold' }}>⏱ {formatTime(stageTime)}</span>}
                            <span>{stage.status === 'Completed' ? 'Done' : (stage.status === 'InProgress' ? 'In Progress' : 'Pending')}</span>
                          </div>
                        </div>

                        {/* 工序专属照片 */}
                        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginTop: '8px' }}>
                          {photos.map((url: string, idx: number) => (
                            <PhotoThumbnail
                              key={idx}
                              photoUrl={url}
                              onClick={() => setPreviewPhotoUrl(url)}
                              onRemove={() => setDeletePhotoConfirm({ taskId: task.id, stageId: stage.id, photoUrl: url })}
                            />
                          ))}
                          <label style={{ width: '80px', height: '60px', flexShrink: 0, borderRadius: '6px', border: '1px dashed #555', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', background: 'rgba(0,0,0,0.3)', color: '#888', fontSize: '20px' }} title={t('add_stage_photo')}>
                            +
                            <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, task.id, stage.id)} style={{ display: 'none' }} />
                          </label>
                        </div>

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

      {/* 大图预览弹窗 */}
      {previewPhotoUrl && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 99999, display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'zoom-out' }} onClick={() => setPreviewPhotoUrl(null)}>
          {previewResolvedUrl ? (
            <img src={previewResolvedUrl} alt="preview" style={{ maxWidth: '95vw', maxHeight: '95vh', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 0 50px rgba(0,0,0,0.5)' }} />
          ) : (
            <div style={{ color: '#fff' }}>{t('loading')}</div>
          )}
        </div>,
        document.body
      )}

      {/* 删除相册图确认 */}
      {deleteGalleryConfirm && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 99999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
          <div style={{ background: '#2d2d2d', padding: '20px', borderRadius: '12px', border: '1px solid #444', maxWidth: '320px', width: '100%' }}>
            <h3 style={{ color: '#ef4444', marginTop: 0, marginBottom: '12px', fontSize: '16px' }}>⚠️ {t('photo_delete_title')}</h3>
            <p style={{ fontSize: '13px', color: '#ccc', marginBottom: '20px', lineHeight: 1.5 }}>
              {t('photo_delete_desc')}
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn yes" style={{ flex: 1, background: '#ef4444' }} onClick={confirmRemoveGallery}>{t('confirm')}</button>
              <button className="btn no" style={{ flex: 1 }} onClick={() => { AudioManager.playClick(); setDeleteGalleryConfirm(null); }}>{t('cancel')}</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 删除工序图确认 */}
      {deletePhotoConfirm && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 99999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
          <div style={{ background: '#2d2d2d', padding: '20px', borderRadius: '12px', border: '1px solid #444', maxWidth: '320px', width: '100%' }}>
            <h3 style={{ color: '#ef4444', marginTop: 0, marginBottom: '12px', fontSize: '16px' }}>⚠️ {t('photo_delete_title')}</h3>
            <p style={{ fontSize: '13px', color: '#ccc', marginBottom: '20px', lineHeight: 1.5 }}>
              {t('photo_delete_desc')}
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn yes" style={{ flex: 1, background: '#ef4444' }} onClick={confirmRemovePhoto}>{t('confirm')}</button>
              <button className="btn no" style={{ flex: 1 }} onClick={() => { AudioManager.playClick(); setDeletePhotoConfirm(null); }}>{t('cancel')}</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};