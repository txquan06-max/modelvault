import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AudioManager } from '../core/AudioManager';
import { SessionManager } from '../core/SessionManager';
import { DailyQuestManager, type DailyQuest } from '../core/DailyQuestManager';
import { StatsChart } from '../components/StatsChart';
import { ModelManager } from '../core/ModelManager';
import { UserManager } from '../core/UserManager';
import { StorageManager, FILE_SUBDIRS } from '../core/StorageManager';
import { AchievementManager } from '../core/AchievementManager';
import { GunplaSearch, type GunplaItem } from '../core/GunplaDB';
import { useAppStore } from '../store/useAppStore';
import { formatTime, handleFocusScroll } from '../utils/format';

const isTauri = typeof window !== 'undefined' && !!(window as any).__TAURI_INTERNALS__;

export const ProfileView = () => {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === 'zh';
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const {
    username, setUsername, level, levelProgress, coinsBalance,
    earnedTitles, equippedTitle, setEquippedTitle,
    bgMain, setBgMain, bgPip, setBgPip,
    audioSettings, setAudioSettings,
    customAudios, setCustomAudios,
    webChatInterval, setWebChatInterval,
    pipChatInterval, setPipChatInterval, storageEstimate,
    isAssetsMounted, setIsAssetsMounted, refreshData,
    showToast,
  } = useAppStore();

  const [quests, setQuests] = useState<DailyQuest[]>([]);
  const [snapshots, setSnapshots] = useState<{ index: number; timestamp: number | null; size: number }[]>([]);
  const [showSnapshots, setShowSnapshots] = useState(false);
  const [restoringIndex, setRestoringIndex] = useState<number | null>(null);
  const [isUploadingWakeup, setIsUploadingWakeup] = useState(false);

  const [showLegacyForm, setShowLegacyForm] = useState(false);
  const [legacyInput, setLegacyInput] = useState('');
  const [legacyResults, setLegacyResults] = useState<GunplaItem[]>([]);
  const [legacyList, setLegacyList] = useState<(GunplaItem & { coverImage?: string })[]>([]);
  const [isLegacySearching, setIsLegacySearching] = useState(false);
  const [legacySearchTrigger, setLegacySearchTrigger] = useState(0);

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [clearAssets, setClearAssets] = useState(false);

  const [showModelDetails, setShowModelDetails] = useState(false);
  const [showTimeDetails, setShowTimeDetails] = useState(false);

  // 🌟 检查更新状态
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'latest' | 'available' | 'error'>('idle');
  const [updateErrorMsg, setUpdateErrorMsg] = useState('');

  useEffect(() => {
    setQuests(DailyQuestManager.getTodayQuests());
  }, []);

  useEffect(() => {
    if (!showSnapshots) return;
    StorageManager.listSnapshots().then((list: any[]) => setSnapshots(list));
  }, [showSnapshots]);

  useEffect(() => {
    const query = legacyInput.trim();
    if (query.length < 1) {
      setLegacyResults([]);
      setIsLegacySearching(false);
      return;
    }
    let cancelled = false;
    setIsLegacySearching(true);
    const timer = setTimeout(() => {
      GunplaSearch.search(query)
        .then((results) => {
          if (!cancelled) {
            setLegacyResults(results.slice(0, 15));
            setIsLegacySearching(false);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setLegacyResults([]);
            setIsLegacySearching(false);
          }
        });
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [legacyInput, legacySearchTrigger]);

  const handleClaim = (questId: string) => {
    AudioManager.playAchievement();
    if (DailyQuestManager.claimReward(questId)) {
      showToast(t('toast_quest_claimed'));
      setQuests(DailyQuestManager.getTodayQuests());
      refreshData();
    }
  };

  const handleRestoreSnapshot = async (index: number) => {
    AudioManager.playClick();
    setRestoringIndex(index);
    const success = await StorageManager.restoreSnapshot(index);
    if (success) {
      showToast(t('toast_reset_success'));
      setTimeout(() => window.location.reload(), 1000);
    } else {
      showToast(t('toast_reset_fail'));
      setRestoringIndex(null);
    }
  };

  const handleWakeupUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const maxSize = isAssetsMounted ? 2 * 1024 * 1024 : 300 * 1024;
    if (file.size > maxSize) {
      showToast(isAssetsMounted ? t('toast_audio_too_large') : (isZh ? '未挂载图库时音频最大 300KB' : 'Max 300KB without gallery mount'));
      return;
    }
    
    setIsUploadingWakeup(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      StorageManager.setCustomWakeupSound(base64);
      setIsUploadingWakeup(false);
      showToast(t('toast_wakeup_updated'));
      AudioManager.playWakeup();
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const currentWakeupSound = StorageManager.getCustomWakeupSound();

  const updateAudioSetting = (type: string, style: string) => {
    const newSettings = { ...audioSettings, [type]: style };
    setAudioSettings(newSettings);
    if (style !== 'off') AudioManager.previewSound(type as any);
  };

  const typingLabel = (() => {
    const raw = t('audioTyping');
    if (raw === 'audioTyping') return isZh ? '打字机音效' : 'Typing Sound';
    return raw;
  })();

  const handleBgFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'main' | 'pip') => {
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
        if (w > 1920) { h = Math.round((h * 1920) / w); w = 1920; }
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
          const filename = `${FILE_SUBDIRS.BACKGROUND}/bg_${type}_${Date.now()}.${ext}`;
          const localPath = await StorageManager.saveFileToLocal(filename, finalBlob);
          const finalUrl = localPath || canvas.toDataURL(`image/${ext}`, 0.7);
          if (type === 'main') { setBgMain(finalUrl); } else { setBgPip(finalUrl); }
          showToast(t('toast_bg_updated'));
        }, 'image/webp', 0.6);
      };
    };
    e.target.value = '';
  };

  const handleAudioUpload = (type: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const maxSize = isAssetsMounted ? 2 * 1024 * 1024 : 300 * 1024;
    if (file.size > maxSize) {
      showToast(isAssetsMounted ? t('toast_audio_too_large') : (isZh ? '未挂载图库时音频最大 300KB' : 'Max 300KB without gallery mount'));
      return;
    }

    if (isAssetsMounted) {
      const filename = `${FILE_SUBDIRS.AUDIO}/audio_${type}_${Date.now()}.mp3`;
      StorageManager.saveFileToLocal(filename, file).then(async (localPath) => {
        if (localPath) {
          const newAudios = { ...customAudios, [type]: localPath };
          setCustomAudios(newAudios);
          setAudioSettings({ ...audioSettings, [type]: 'custom' });
          await AudioManager.preloadCustomAudios();
          showToast(t('toast_audio_updated'));
        } else {
          showToast(t('toast_local_mount_fail'));
        }
      });
    } else {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = ev.target?.result as string;
        const newAudios = { ...customAudios, [type]: base64 };
        setCustomAudios(newAudios);
        setAudioSettings({ ...audioSettings, [type]: 'custom' });
        showToast(t('toast_audio_updated'));
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const exportData = () => {
    AudioManager.playClick();
    const data = StorageManager.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `modelvault_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    AudioManager.playClick();
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        const success = await StorageManager.importAll(data);
        if (success) { showToast(t('importSuccess')); setTimeout(() => window.location.reload(), 1000); }
        else showToast(t('importError'));
      } catch (err) { showToast(t('importError')); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetData = async () => {
    AudioManager.playClick();
    setIsResetting(true);

    try {
      if (clearAssets && isAssetsMounted) {
        const allModels = ModelManager.getAllModels();
        const filesToDelete: string[] = [];

        allModels.forEach(m => {
          if (m.coverImage?.startsWith('local://')) filesToDelete.push(m.coverImage);
          m.galleryPhotos?.forEach(url => { if (url.startsWith('local://')) filesToDelete.push(url); });
          m.tasks.forEach(task => {
            task.stages.forEach(stage => {
              if (stage.photoUrl?.startsWith('local://')) filesToDelete.push(stage.photoUrl);
              stage.processPhotos?.forEach(url => { if (url.startsWith('local://')) filesToDelete.push(url); });
            });
          });
        });

        const bgMainUrl = StorageManager.getBgMain();
        const bgPipUrl = StorageManager.getBgPip();
        if (bgMainUrl?.startsWith('local://')) filesToDelete.push(bgMainUrl);
        if (bgPipUrl?.startsWith('local://')) filesToDelete.push(bgPipUrl);

        const audios = StorageManager.getCustomAudios();
        Object.values(audios).forEach(url => { if (typeof url === 'string' && url.startsWith('local://')) filesToDelete.push(url); });

        await Promise.all(filesToDelete.map(url => StorageManager.deleteLocalFile(url)));
      }
    } catch (e) {
      console.error('清理物理文件失败:', e);
    }

    try { await StorageManager.resetAll(); } catch (e) { console.error(e); }
    window.location.href = window.location.origin + window.location.pathname;
  };

  const addToLegacyList = (item: GunplaItem) => {
    if (!legacyList.some((i: any) => i.name.en === item.name.en)) {
      setLegacyList([...legacyList, item]);
    } else {
      showToast(t('toast_legacy_added'));
    }
  };

  const removeLegacyItem = (id: string) => {
    setLegacyList(prev => prev.filter(i => i.id !== id));
  };

  const handleLegacyCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    showToast(t('processing'));
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async (ev) => {
      const newList = [...legacyList];
      newList[index].coverImage = ev.target?.result as string;
      setLegacyList(newList);
    };
    e.target.value = '';
  };

  const handleLegacyImport = () => {
    if (legacyList.length === 0) return;
    AudioManager.playClick();
    const result = ModelManager.importLegacyModelsFromList(legacyList);
    if (result.count > 0) {
      AudioManager.playFinishPart();
      showToast(t('importedSuccess', { count: result.count }));
      setLegacyList([]);
      refreshData();
      AchievementManager.checkAll();
    }
  };

  const buyTitle = (id: string) => {
    const result = UserManager.buyTitle(id);
    if (result.success) {
      AudioManager.playAchievement();
      showToast(t('titleUnlocked'));
      refreshData();
      AchievementManager.checkAll();
    } else {
      AudioManager.playClick();
      showToast(t('notEnoughCoins'));
    }
  };

  // 🌟 检查更新逻辑
  const handleCheckUpdate = async () => {
    if (!isTauri) {
      showToast(t('toast_pin_desktop_only'));
      return;
    }
    setCheckingUpdate(true);
    setUpdateStatus('idle');
    setUpdateErrorMsg('');
    AudioManager.playClick();

    try {
      const { check } = await import('@tauri-apps/plugin-updater');
      const update = await check();
      if (update) {
        setUpdateStatus('available');
        window.dispatchEvent(new CustomEvent('tauri-update-available', { detail: update }));
      } else {
        setUpdateStatus('latest');
      }
    } catch (err: any) {
      console.error('[Tauri] Manual update check failed:', err);
      setUpdateStatus('error');
      let msg = err?.message || String(err);
      if (msg.includes('not found') || msg.includes('plugin updater not found')) {
        setUpdateErrorMsg(isZh ? '当前环境不支持自动更新（移动端/未配置）' : 'Auto-update not supported in this environment');
      } else if (msg.includes('network') || msg.includes('fetch') || msg.includes('timeout')) {
        setUpdateErrorMsg(isZh ? '网络连接失败，请检查代理或网络环境' : 'Network error, check proxy or connection');
      } else if (msg.includes('signature') || msg.includes('pubkey')) {
        setUpdateErrorMsg(isZh ? '签名校验失败 (pubkey 不匹配)' : 'Signature verification failed');
      } else {
        setUpdateErrorMsg(msg.substring(0, 50));
      }
    } finally {
      setCheckingUpdate(false);
    }
  };

  const allCompleted = quests.length > 0 && quests.every(q => q.claimed);
  const modelStats = ModelManager.getModelStats();
  const timeStats = ModelManager.getTimeStats();
  const titles = UserManager.getTitleLibrary();
  const equippedTitleDef = titles.find(t => t.id === equippedTitle);
  const earnedAchievements = AchievementManager.getEarnedList();
  const allSessions = SessionManager.getAllSessions();

  return (
    <div className="view-content profile-view">
      <div className="profile-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="avatar" style={{ flexShrink: 0 }}>🧑‍🔧</div>
          <div className="profile-info" style={{ flex: 1 }}>
            <input id="username-input" type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="username-input" onFocus={handleFocusScroll} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
              <span style={{ fontSize: '12px', color: '#f59e0b', fontWeight: 'bold', background: 'rgba(245, 158, 11, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>Lv.{level}</span>
              {equippedTitleDef && <span style={{ fontSize: '12px', color: equippedTitleDef.color, fontWeight: 'bold' }}>[{t(equippedTitleDef.nameKey)}]</span>}
            </div>
          </div>
        </div>
        <div style={{ width: '100%', height: '8px', background: 'rgba(0,0,0,0.5)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ width: `${levelProgress.percent}%`, height: '100%', background: `linear-gradient(90deg, #3b82f6, #8b5cf6)`, borderRadius: '4px', transition: 'width 0.3s' }} />
        </div>
      </div>

      <div className="custom-section" style={{ background: 'linear-gradient(145deg, rgba(59,130,246,0.1), rgba(0,0,0,0.2))', border: '1px solid rgba(59,130,246,0.3)' }}>
        <h4 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>📋 {t('daily_quests')}</span>
          {allCompleted && <span style={{ fontSize: '11px', color: '#10b981', background: 'rgba(16,185,129,0.2)', padding: '2px 6px', borderRadius: '4px' }}>✨ {t('quest_all_done')}</span>}
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {quests.map(quest => (
            <div key={quest.id} style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '8px', borderLeft: `3px solid ${quest.completed ? '#10b981' : '#3b82f6'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: quest.completed ? '#10b981' : '#fff' }}>
                  {isZh ? quest.titleZh : quest.titleEn}
                </span>
                <span style={{ fontSize: '12px', color: '#f59e0b', fontWeight: 'bold' }}>+{quest.reward} 🪙</span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${(quest.progress / quest.target) * 100}%`, height: '100%', background: quest.completed ? '#10b981' : '#3b82f6', transition: 'width 0.3s' }} />
                </div>
                <span style={{ fontSize: '11px', color: '#aaa', minWidth: '40px', textAlign: 'right' }}>
                  {quest.type === 'focus_time' ? `${Math.floor(quest.progress / 60)}/${Math.floor(quest.target / 60)}m` : `${quest.progress}/${quest.target}`}
                </span>
                
                {quest.completed && !quest.claimed ? (
                  <button className="mini-btn" onClick={() => handleClaim(quest.id)} style={{ background: '#f59e0b', color: '#000', border: 'none', fontWeight: 'bold', animation: 'pulse 2s infinite' }}>
                    {t('quest_claim')}
                  </button>
                ) : quest.claimed ? (
                  <span style={{ fontSize: '12px', color: '#10b981', minWidth: '40px', textAlign: 'center' }}>✓</span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="custom-section" style={{ paddingBottom: '16px', overflow: 'hidden' }}>
        <StatsChart sessions={allSessions} stageTime={timeStats.stageTime} i18n={i18n} />
      </div>

      <div className="stats-grid">
        <div className="stat-card" onClick={() => { AudioManager.playClick(); setShowModelDetails(!showModelDetails); }}>
          <div className="stat-label">{t('totalModels')}</div>
          <div className="stat-value">{modelStats.total}</div>
          {showModelDetails && (
            <div className="stat-details">
              {['HG', 'RG', 'MG', 'PG'].map(grade => modelStats[grade] > 0 ? (
                <div key={grade} className="detail-row"><span>{grade}</span> <span>{modelStats[grade]}</span></div>
              ) : null)}
            </div>
          )}
        </div>
        <div className="stat-card" onClick={() => { AudioManager.playClick(); setShowTimeDetails(!showTimeDetails); }}>
          <div className="stat-label">{t('totalTime')}</div>
          <div className="stat-value">{Math.floor(timeStats.totalSeconds / 60)}m</div>
          {showTimeDetails && (
            <div className="stat-details">
              {Object.entries(timeStats.stageTime).map(([stageKey, seconds]) => (seconds as number) > 0 ? (
                <div key={stageKey} className="detail-row"><span>{t(stageKey)}</span> <span>{Math.floor((seconds as number) / 60)}m</span></div>
              ) : null)}
            </div>
          )}
        </div>
      </div>

      <div className="custom-section" style={{ border: '1px dashed #10b981' }}>
        <h4>🛡️ {t('data_expansion_title')}</h4>
        <p style={{ fontSize: '11px', color: '#aaa', marginBottom: '10px' }}>{t('data_expansion_desc')}</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '6px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ fontSize: '12px' }}>
              <div>{t('quota_label')}: {storageEstimate.quota} GB</div>
              <div style={{ color: '#10b981' }}>{t('used_label')}: {storageEstimate.usage} GB</div>
            </div>
            <button id="tour-gallery-mount" className="mini-btn" onClick={async () => {
              AudioManager.playClick();
              const success = await StorageManager.selectAssetsFolder();
              if (success) { setIsAssetsMounted(true); showToast(t('toast_local_mount_success')); }
              else showToast(t('toast_local_mount_fail'));
            }} style={{ background: isAssetsMounted ? '#10b981' : '#555', flexShrink: 0 }}>
              {isAssetsMounted ? t('mounted') : t('mount_gallery')}
            </button>
          </div>
        </div>
      </div>

      <div className="custom-section" style={{ border: '1px dashed #3b82f6' }}>
        <h4>📦 {t('legacyImport')}</h4>
        <p style={{ fontSize: '11px', color: '#aaa', marginBottom: '10px' }}>{t('legacyDesc')}</p>
        {!showLegacyForm ? (
          <button className="btn start" style={{ width: '100%', padding: '8px' }} onClick={() => { AudioManager.playClick(); setShowLegacyForm(true); }}>{t('legacyImport')}</button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="search-autocomplete">
              <input 
                autoFocus 
                placeholder={t('legacy_search_placeholder')} 
                value={legacyInput} 
                onChange={e => setLegacyInput(e.target.value)} 
                onKeyDown={e => { if (e.key === 'Enter' && legacyResults.length > 0) addToLegacyList(legacyResults[0]); }} 
                onBlur={() => setTimeout(() => setLegacyResults([]), 200)} 
                onFocus={(e: any) => { handleFocusScroll(e); setLegacySearchTrigger(s => s + 1); }} 
              />
              {legacyInput.trim().length >= 1 && (
                <div className="autocomplete-dropdown" style={{ zIndex: 999 }}>
                  {isLegacySearching && legacyResults.length === 0 && (
                    <div className="autocomplete-item" style={{ textAlign: 'center', color: '#aaa', fontStyle: 'italic', cursor: 'default' }}>
                      🔄 {t('search_loading')}
                    </div>
                  )}
                  {!isLegacySearching && legacyResults.length === 0 && (
                    <div className="autocomplete-item" style={{ textAlign: 'center', color: '#666', fontStyle: 'italic', cursor: 'default' }}>
                      ❌ {t('search_empty')}
                    </div>
                  )}
                  {legacyResults.map((item: any, idx: number) => {
                    const displayName = isZh ? item.name.zh : item.name.en;
                    const displaySeries = isZh ? item.series.zh : item.series.en;
                    return (
                      <div key={idx} className="autocomplete-item" onClick={() => addToLegacyList(item)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span className="ac-grade">{item.grade}</span><strong style={{ color: '#fff' }}>{displayName}</strong></div>
                        <div className="ac-series">| {displaySeries}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {legacyList.length > 0 && (
              <div className="legacy-temp-list">
                {legacyList.map((item: any, idx: number) => {
                  const displayName = isZh ? item.name.zh : item.name.en;
                  return (
                    <div key={idx} className="legacy-temp-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <span><span className="ac-grade">{item.grade}</span> {displayName}</span>
                        <button onClick={() => removeLegacyItem(item.id)}>✕</button>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', width: '100%', alignItems: 'center', flexWrap: 'wrap' }}>
                        <label className="mini-btn" style={{ flex: 1, textAlign: 'center', cursor: 'pointer', margin: 0, minWidth: '120px' }}>
                          {item.coverImage ? t('legacy_cover_added') : t('legacy_add_cover')}
                          <input type="file" accept="image/*" onChange={(e) => handleLegacyCoverUpload(e, idx)} style={{ display: 'none' }} />
                        </label>
                        {item.coverImage && <img src={item.coverImage} alt="cover" style={{ width: '32px', height: '32px', objectFit: 'cover', borderRadius: '4px' }} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
              <button className="btn start" style={{ flex: 1, padding: '6px', minWidth: '100px' }} onClick={handleLegacyImport} disabled={legacyList.length === 0}>{t('importBtn')} ({legacyList.length})</button>
              <button className="btn no" style={{ flex: 1, padding: '6px', minWidth: '100px' }} onClick={() => { AudioManager.playClick(); setShowLegacyForm(false); setLegacyList([]); setLegacyInput(''); }}>{t('cancel')}</button>
            </div>
          </div>
        )}
      </div>

      <div className="custom-section">
        <h4>⚙️ {t('customization')}</h4>

        <div className="custom-row">
          <span>{t('reminderInterval')}:</span>
          <select value={StorageManager.getReminderInterval()} onChange={(e) => { AudioManager.playClick(); StorageManager.setReminderInterval(Number(e.target.value)); }}>
            <option value={0}>{t('audioOff')}</option>
            <option value={15 * 60}>15m</option>
            <option value={30 * 60}>30m</option>
            <option value={45 * 60}>45m</option>
            <option value={60 * 60}>60m</option>
          </select>
        </div>

        <div className="custom-row">
          <span>{t('web_ai_freq')}:</span>
          <select value={webChatInterval} onChange={(e) => { AudioManager.playClick(); const val = Number(e.target.value); setWebChatInterval(val); }}>
            <option value={5000}>5s</option>
            <option value={8000}>8s ({t('default')})</option>
            <option value={15000}>15s</option>
            <option value={30000}>30s</option>
            <option value={60000}>60s</option>
          </select>
        </div>

        <div className="custom-row">
          <span>{t('pip_ai_freq')}:</span>
          <select value={pipChatInterval} onChange={(e) => { AudioManager.playClick(); const val = Number(e.target.value); setPipChatInterval(val); }}>
            <option value={30000}>30s</option>
            <option value={60000}>60s ({t('default')})</option>
            <option value={120000}>120s</option>
            <option value={300000}>300s</option>
          </select>
        </div>

        <div className="custom-row">
          <span>{t('bgMain')}:</span>
          <div style={{ display: 'flex', gap: '8px', width: '100%', flexWrap: 'wrap' }}>
            <label className="mini-btn" style={{ flex: 1, textAlign: 'center', cursor: 'pointer', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '120px' }}>
              📁 {t('uploadImage')}<input type="file" accept="image/*" onChange={(e) => handleBgFileUpload(e, 'main')} style={{ display: 'none' }} />
            </label>
            {bgMain && <button className="mini-btn" style={{ color: '#ef4444', flexShrink: 0 }} onClick={() => { AudioManager.playClick(); setBgMain(''); }}>{t('clear')}</button>}
          </div>
        </div>

        <div className="custom-row">
          <span>{t('bgPip')}:</span>
          <div style={{ display: 'flex', gap: '8px', width: '100%', flexWrap: 'wrap' }}>
            <label className="mini-btn" style={{ flex: 1, textAlign: 'center', cursor: 'pointer', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '120px' }}>
              📁 {t('uploadImage')}<input type="file" accept="image/*" onChange={(e) => handleBgFileUpload(e, 'pip')} style={{ display: 'none' }} />
            </label>
            {bgPip && <button className="mini-btn" style={{ color: '#ef4444', flexShrink: 0 }} onClick={() => { AudioManager.playClick(); setBgPip(''); }}>{t('clear')}</button>}
          </div>
        </div>

        <div className="custom-row" style={{ borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '12px', marginTop: '12px' }}>
          <span>{t('custom_wakeup_sound')}:</span>
          <div style={{ display: 'flex', gap: '8px', width: '100%', flexWrap: 'wrap', alignItems: 'center' }}>
            <label className="mini-btn" style={{ flex: 1, textAlign: 'center', cursor: isUploadingWakeup ? 'not-allowed' : 'pointer', opacity: isUploadingWakeup ? 0.5 : 1, margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '120px' }}>
              🎵 {isUploadingWakeup ? t('processing') : (currentWakeupSound ? t('replace_sound') : t('upload_sound'))}
              <input type="file" accept="audio/*" onChange={handleWakeupUpload} style={{ display: 'none' }} disabled={isUploadingWakeup} />
            </label>
            {currentWakeupSound && (
              <>
                <button className="mini-btn" style={{ background: '#3b82f6', flexShrink: 0 }} onClick={() => { AudioManager.playWakeup(); }}>{t('test_sound')}</button>
                <button className="mini-btn" style={{ color: '#ef4444', flexShrink: 0 }} onClick={() => { StorageManager.setCustomWakeupSound(''); showToast(t('toast_wakeup_reset')); }}>{t('clear')}</button>
              </>
            )}
          </div>
        </div>

        <div className="audio-settings" style={{ marginTop: '12px' }}>
          {(['click', 'typing', 'start', 'pause', 'complete', 'finishPart', 'stage', 'timebox', 'achievement'] as const).map(type => {
            const labelMap: any = {
              click: t('audioClick'), typing: typingLabel, start: t('audioStart'), pause: t('audioPause'),
              complete: t('audioComplete'), finishPart: t('audioFinishPart'), stage: t('audioStage'),
              timebox: t('audioTimebox'), achievement: t('audioAchievement')
            };
            return (
              <div key={type} className="audio-row">
                <span>{labelMap[type]}</span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <select value={audioSettings[type] || 'default'} onChange={e => updateAudioSetting(type, e.target.value)}>
                    <option value="default">{t('audioDefault')}</option>
                    <option value="chiptune">{t('audio8Bit')}</option>
                    <option value="soft">{t('audioSoft')}</option>
                    <option value="off">{t('audioOff')}</option>
                    {customAudios[type] && <option value="custom">{t('audioCustom')}</option>}
                  </select>
                  <label className="mini-btn" style={{ padding: '2px 6px', cursor: 'pointer', margin: 0 }} title="Upload MP3/WAV">
                    🎵<input type="file" accept="audio/*" onChange={(e) => handleAudioUpload(type, e)} style={{ display: 'none' }} />
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="shop-section">
        <div className="shop-header"><h4>🏪 {t('titlesShop')}</h4><span>🪙 {coinsBalance}</span></div>
        <div className="title-list" style={{ maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
          {titles.map((title: any) => {
            const isOwned = earnedTitles.includes(title.id);
            const canAfford = coinsBalance >= title.cost;
            const meetsCondition = title.checkCondition();
            return (
              <div key={title.id} className={`title-item ${isOwned ? 'owned' : ''}`}>
                <div className="title-info">
                  <div className="title-name" style={{ color: title.color, textShadow: `0 0 10px ${title.color}40` }}>{t(title.nameKey)}</div>
                  <div className="title-cond">{t(title.descKey)}</div>
                </div>
                {isOwned ? (
                  <button className="mini-btn" onClick={() => setEquippedTitle(title.id)} disabled={equippedTitle === title.id}>{equippedTitle === title.id ? t('equipped') : t('equip')}</button>
                ) : (
                  <button className="mini-btn buy-btn" onClick={() => buyTitle(title.id)} disabled={!canAfford || !meetsCondition}>{title.cost} 🪙</button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="achievements-section">
        <h4>🏆 {t('achievements')}</h4>
        {earnedAchievements.length === 0 ? (<div className="empty-ach">{t('emptyAchievements')}</div>) : (
          <div className="ach-list" style={{ maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
            {earnedAchievements.map((a: any) => (
              <div key={a.id} className="ach-item">
                <span className="ach-icon">🏆</span>
                <div className="ach-info">
                  <div className="ach-name">{t(a.nameKey)}</div>
                  <div className="ach-desc">{t(a.descKey)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="data-backup-section">
        <h4>{t('dataBackup')} <span style={{ float: 'right', fontSize: '11px', color: '#888' }}>Used: {StorageManager.getStorageUsage()} MB</span></h4>
        
        {/* 🌟 修改：只有桌面端才显示检查更新 */}
        {isTauri && !isMobile && (
          <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid #3b82f6', padding: '12px', borderRadius: '8px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff' }}>🔄 {isZh ? '版本更新' : 'Update'}</span>
              <button 
                className="mini-btn" 
                style={{ background: '#3b82f6', color: '#fff', border: 'none' }}
                onClick={handleCheckUpdate}
                disabled={checkingUpdate}
              >
                {checkingUpdate ? (isZh ? '检查中...' : 'Checking...') : (isZh ? '检查更新' : 'Check Update')}
              </button>
            </div>
            {updateStatus === 'latest' && (
              <div style={{ fontSize: '12px', color: '#10b981' }}>✅ {isZh ? '当前已是最新版本' : 'You are up to date!'}</div>
            )}
            {updateStatus === 'available' && (
              <div style={{ fontSize: '12px', color: '#f59e0b' }}>✨ {isZh ? '发现新版本，请查看弹窗' : 'New version found, check dialog.'}</div>
            )}
            {updateStatus === 'error' && (
              <div style={{ fontSize: '12px', color: '#ef4444' }}>❌ {isZh ? '检查失败：' : 'Failed: '}{updateErrorMsg}</div>
            )}
          </div>
        )}

        <div className="backup-actions" style={{ marginBottom: '16px', flexWrap: 'wrap' }}>
          <button className="backup-btn" style={{ flex: 1, minWidth: '100px' }} onClick={exportData}>{t('exportData')}</button>
          <label className="backup-btn import-label" style={{ flex: 1, minWidth: '100px', display: 'flex', justifyContent: 'center' }}>{t('importData')}<input type="file" accept=".json" onChange={importData} style={{ display: 'none' }} /></label>
        </div>

        <div style={{ borderTop: '1px dashed #444', paddingTop: '16px', marginBottom: '16px' }}>
          <button 
            className="backup-btn" 
            style={{ width: '100%', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', borderColor: '#3b82f6', marginBottom: showSnapshots ? '12px' : 0 }}
            onClick={() => { AudioManager.playClick(); setShowSnapshots(!showSnapshots); }}
          >
            🕰️ {showSnapshots ? t('hide_snapshots') : t('view_snapshots')}
          </button>
          
          {showSnapshots && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px' }}>
              {snapshots.length === 0 ? (
                <div style={{ fontSize: '12px', color: '#888', textAlign: 'center' }}>{t('no_snapshots')}</div>
              ) : (
                snapshots.map(snap => (
                  <div key={snap.index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '4px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ fontSize: '12px', color: '#ccc' }}>
                      <div style={{ fontWeight: 'bold', color: '#f59e0b' }}>{t('backup_index', { index: snap.index })}</div>
                      <div style={{ fontSize: '10px' }}>{snap.timestamp ? new Date(snap.timestamp).toLocaleString() : t('unknown_time')} · {(snap.size / 1024).toFixed(1)} KB</div>
                    </div>
                    {restoringIndex === snap.index ? (
                      <span style={{ fontSize: '12px', color: '#3b82f6' }}>{t('restoring')}</span>
                    ) : (
                      <button 
                        className="mini-btn" 
                        style={{ background: '#3b82f6', color: '#fff', border: 'none' }} 
                        onClick={() => handleRestoreSnapshot(snap.index)}
                      >
                        {t('restore_snapshot')}
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div style={{ borderTop: '1px dashed #444', paddingTop: '16px', marginTop: '8px' }}>
          <h4 style={{ color: '#ef4444', marginBottom: '8px', fontSize: '12px' }}>⚠️ {t('dangerZone')}</h4>
          {!showResetConfirm ? (
            <button className="backup-btn" style={{ width: '100%', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderColor: '#ef4444' }} onClick={() => { AudioManager.playClick(); setShowResetConfirm(true); }}>{t('resetData')}</button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <p style={{ fontSize: '12px', color: '#ccc', margin: '0 0 8px 0' }}>{t('resetConfirm')}</p>
              
              {isAssetsMounted && (
                <label className="checkbox-label" style={{ marginBottom: '8px' }}>
                  <input type="checkbox" checked={clearAssets} onChange={e => setClearAssets(e.target.checked)} />
                  {t('reset_clear_assets')}
                </label>
              )}

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button className="btn yes" style={{ background: '#ef4444', flex: 1, padding: '6px', minWidth: '100px' }} onClick={handleResetData} disabled={isResetting}>{isResetting ? t('clearing') : t('confirm')}</button>
                <button className="btn no" style={{ flex: 1, padding: '6px', minWidth: '100px' }} onClick={() => { AudioManager.playClick(); setShowResetConfirm(false); }} disabled={isResetting}>{t('cancel')}</button>
              </div>
            </div>
          )}
        </div>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '12px', color: '#666' }}>
          <p style={{ margin: '0 0 6px 0' }}>ModelJourney v0.1.3 (Desktop)</p>
          <a href="https://github.com/txquan06-max/modelvault" target="_blank" rel="noreferrer" style={{ color: '#3b82f6', textDecoration: 'none' }}>🐞 {t('feedback')}</a>
        </div>
      </div>
    </div>
  );
};