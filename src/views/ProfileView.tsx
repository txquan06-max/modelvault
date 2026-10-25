import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AudioManager } from '../core/AudioManager';
import { SessionManager } from '../core/SessionManager';
import { DailyQuestManager, type DailyQuest } from '../core/DailyQuestManager';
import { StatsChart } from '../components/StatsChart'; 
import { ModelManager } from '../core/ModelManager';
import { UserManager } from '../core/UserManager';
import { StorageManager } from '../core/StorageManager';
import { useAppStore } from '../store/useAppStore';

export const ProfileView = (props: any) => {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === 'zh';

  const {
    username, setUsername, level, levelProgress, coinsBalance,
    earnedTitles, equippedTitle, setEquippedTitle,
    bgMain, setBgMain, bgPip, setBgPip, audioSettings, setAudioSettings,
    customAudios, webChatInterval, setWebChatInterval,
    pipChatInterval, setPipChatInterval, storageEstimate,
    isAssetsMounted, setIsAssetsMounted, refreshData
  } = useAppStore();

  const {
    showToast, handleFocus, showLegacyForm, setShowLegacyForm, legacyInput, setLegacyInput,
    legacyResults, setLegacyResults, legacyList, setLegacyList, removeLegacyItem,
    handleLegacyCoverUpload, handleLegacyImport, addToLegacyList,
    // 🌟 新增：历史补录搜索状态与触发器
    isLegacySearching, triggerLegacySearch,
    showResetConfirm, setShowResetConfirm, handleResetData, isResetting,
    showModelDetails, setShowModelDetails, showTimeDetails, setShowTimeDetails, exportData, importData, handleBgFileUpload, handleAudioUpload,
    earnedAchievements, buyTitle
  } = props;

  const allSessions = SessionManager.getAllSessions();
  const [quests, setQuests] = useState<DailyQuest[]>([]);
  const [snapshots, setSnapshots] = useState<{ index: number; timestamp: number | null; size: number }[]>([]);
  const [showSnapshots, setShowSnapshots] = useState(false);
  const [restoringIndex, setRestoringIndex] = useState<number | null>(null);
  const [isUploadingWakeup, setIsUploadingWakeup] = useState(false);

  useEffect(() => {
    setQuests(DailyQuestManager.getTodayQuests());
  }, []);

  useEffect(() => {
    if (!showSnapshots) return;
    StorageManager.listSnapshots().then((list: any[]) => setSnapshots(list));
  }, [showSnapshots]);

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
    if (file.size > 2 * 1024 * 1024) { showToast(isZh ? '音频文件太大（最大2MB）' : 'Audio file too large (max 2MB)'); return; }
    
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

  const allCompleted = quests.length > 0 && quests.every(q => q.claimed);
  const modelStats = ModelManager.getModelStats();
  const timeStats = ModelManager.getTimeStats();
  const titles = UserManager.getTitleLibrary();
  const equippedTitleDef = titles.find(t => t.id === equippedTitle);

  return (
    <div className="view-content profile-view">
      <div className="profile-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="avatar" style={{ flexShrink: 0 }}>🧑‍🔧</div>
          <div className="profile-info" style={{ flex: 1 }}>
            <input id="username-input" type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="username-input" onFocus={handleFocus} />
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
          <span>📋 {isZh ? '每日委托' : 'Daily Quests'}</span>
          {allCompleted && <span style={{ fontSize: '11px', color: '#10b981', background: 'rgba(16,185,129,0.2)', padding: '2px 6px', borderRadius: '4px' }}>✨ {isZh ? '今日大满贯' : 'All Done'}</span>}
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
                    {isZh ? '领取' : 'Claim'}
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
            <button className="mini-btn" onClick={async () => {
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
                placeholder={isZh ? '搜索并回车添加...' : 'Search and press Enter...'} 
                value={legacyInput} 
                onChange={e => setLegacyInput(e.target.value)} 
                onKeyDown={e => { if (e.key === 'Enter' && legacyResults.length > 0) addToLegacyList(legacyResults[0]); }} 
                onBlur={() => setTimeout(() => setLegacyResults([]), 200)} 
                // 🌟 修复：blur 清空后重新聚焦时重新触发搜索
                onFocus={(e: any) => { handleFocus(e); triggerLegacySearch?.(); }} 
              />
              {/* 🌟 修复：状态机渲染（搜索中 / 无结果 / 结果列表），并放宽展示条件 */}
              {legacyInput.trim().length >= 2 && (
                <div className="autocomplete-dropdown" style={{ zIndex: 999 }}>
                  {isLegacySearching && legacyResults.length === 0 && (
                    <div className="autocomplete-item" style={{ textAlign: 'center', color: '#aaa', fontStyle: 'italic', cursor: 'default' }}>
                      🔄 {isZh ? '搜索中...' : 'Searching...'}
                    </div>
                  )}
                  {!isLegacySearching && legacyResults.length === 0 && (
                    <div className="autocomplete-item" style={{ textAlign: 'center', color: '#666', fontStyle: 'italic', cursor: 'default' }}>
                      ❌ {isZh ? '未找到匹配的机体，请换个关键字' : 'No matching kits. Try another keyword.'}
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
                          {item.coverImage ? (isZh ? '✅ 已添加封面' : '✅ Cover Added') : (isZh ? '📷 添加封面图 (可选)' : '📷 Add Cover (Optional)')}
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
            <option value={8000}>8s ({isZh ? '默认' : 'Default'})</option>
            <option value={15000}>15s</option>
            <option value={30000}>30s</option>
            <option value={60000}>60s</option>
          </select>
        </div>

        <div className="custom-row">
          <span>{t('pip_ai_freq')}:</span>
          <select value={pipChatInterval} onChange={(e) => { AudioManager.playClick(); const val = Number(e.target.value); setPipChatInterval(val); }}>
            <option value={30000}>30s</option>
            <option value={60000}>60s ({isZh ? '默认' : 'Default'})</option>
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
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button className="btn yes" style={{ background: '#ef4444', flex: 1, padding: '6px', minWidth: '100px' }} onClick={handleResetData} disabled={isResetting}>{isResetting ? t('clearing') : t('confirm')}</button>
                <button className="btn no" style={{ flex: 1, padding: '6px', minWidth: '100px' }} onClick={() => { AudioManager.playClick(); setShowResetConfirm(false); }} disabled={isResetting}>{t('cancel')}</button>
              </div>
            </div>
          )}
        </div>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '12px', color: '#666' }}>
          <p style={{ margin: '0 0 6px 0' }}>ModelVault Beta v0.4.0 (Desktop)</p>
          <a href="https://github.com/txquan06-max/modelvault" target="_blank" rel="noreferrer" style={{ color: '#3b82f6', textDecoration: 'none' }}>🐞 {t('feedback')}</a>
        </div>
      </div>
    </div>
  );
};