import { AudioManager } from '../core/AudioManager';
import { SessionManager } from '../core/SessionManager';

// 🌟 新增：赛博风 SVG 柱状图组件
const WeeklyChart = ({ sessions }: { sessions: any[] }) => {
  // 获取近7天的日期标签和对应时长
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().slice(0, 10);
    const daySessions = sessions.filter(s => new Date(s.startedAt).toISOString().slice(0, 10) === dateStr);
    const totalSec = daySessions.reduce((sum, s) => sum + s.activeSeconds, 0);
    return { label: `${d.getMonth() + 1}/${d.getDate()}`, totalSec };
  });

  const maxSec = Math.max(...days.map(d => d.totalSec), 3600); // 最小刻度1小时

  return (
    <div style={{ width: '100%', height: '120px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '10px 0', marginTop: '10px' }}>
      {days.map((day, i) => {
        const heightPercent = (day.totalSec / maxSec) * 100;
        const isToday = i === 6;
        return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
            <div style={{ fontSize: '10px', color: isToday ? '#3b82f6' : '#888', marginBottom: '4px' }}>
              {day.totalSec > 0 ? `${Math.floor(day.totalSec / 60)}m` : ''}
            </div>
            <div style={{ width: '20px', height: '80px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
              <div style={{ 
                width: '100%', 
                height: `${Math.max(heightPercent, 2)}%`, 
                background: isToday ? 'linear-gradient(to top, #3b82f6, #8b5cf6)' : 'rgba(59, 130, 246, 0.4)',
                boxShadow: isToday ? '0 0 10px rgba(59,130,246,0.8)' : 'none',
                borderRadius: '4px',
                transition: 'height 1s cubic-bezier(0.4, 0, 0.2, 1)'
              }} />
            </div>
            <div style={{ fontSize: '10px', color: isToday ? '#fff' : '#666', marginTop: '6px', fontWeight: isToday ? 'bold' : 'normal' }}>
              {isToday ? '今日' : day.label}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const ProfileView = (props: any) => {
  const { 
    t, i18n, username, handleUsernameChange, equippedTitleDef, modelStats, timeStats, showModelDetails, setShowModelDetails,
    showTimeDetails, setShowTimeDetails, formatTime, showLegacyForm, setShowLegacyForm, legacyInput, setLegacyInput,
    legacyResults, addToLegacyList, legacyList, removeLegacyItem, handleLegacyCoverUpload, handleLegacyImport,
    bgMain, bgPip, handleBgFileUpload, reminderInterval, setReminderInterval, openPreview, audioSettings, updateAudioSetting,
    customAudios, handleAudioUpload, titles, earnedTitles, coinsBalance, buyTitle, equipTitle, equippedTitle,
    earnedAchievements, exportData, importData, showResetConfirm, setShowResetConfirm, handleResetData, isResetting,
    storageUsage, handleFocus, setLegacyResults, setBgMain, setBgPip, StorageManager,
    webChatInterval, setWebChatInterval, pipChatInterval, setPipChatInterval,
    storageEstimate, isAutoBackupEnabled, setIsAutoBackupEnabled, isAssetsMounted, setIsAssetsMounted
  } = props;

  const allSessions = SessionManager.getAllSessions();

  return (
    <div className="view-content profile-view">
      <div className="profile-header">
        <div className="avatar">🧑‍🔧</div>
        <div className="profile-info">
          <input id="username-input" type="text" value={username} onChange={handleUsernameChange} className="username-input" onFocus={handleFocus} />
          {equippedTitleDef && <div className="equipped-title" style={{ color: equippedTitleDef.color }}>[{t(equippedTitleDef.nameKey)}]</div>}
        </div>
      </div>

      {/* 🌟 新增：近 7 天肝度看板 */}
      <div className="custom-section" style={{ paddingBottom: '10px' }}>
        <h4>📊 {i18n.language === 'zh' ? '近 7 天专注势能' : '7-Day Focus Energy'}</h4>
        <WeeklyChart sessions={allSessions} />
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
          <div className="stat-value">{formatTime(timeStats.totalSeconds)}</div>
          {showTimeDetails && (
            <div className="stat-details">
              {Object.entries(timeStats.stageTime).map(([stageKey, seconds]) => (seconds as number) > 0 ? (
                <div key={stageKey} className="detail-row"><span>{t(stageKey)}</span> <span>{formatTime(seconds as number)}</span></div>
              ) : null)}
            </div>
          )}
        </div>
      </div>

      <div className="custom-section" style={{ border: '1px dashed #10b981' }}>
        <h4>🛡️ {i18n.language === 'zh' ? '本地数据安全与扩容' : 'Data Security & Expansion'}</h4>
        <p style={{ fontSize: '11px', color: '#aaa', marginBottom: '10px' }}>
          {i18n.language === 'zh' 
            ? '浏览器默认容量有限。绑定本地文件夹后，媒体文件将直接存入你的硬盘，容量无上限！' 
            : 'Browser storage is limited. Bind a local folder to store media directly on your disk!'}
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '6px' }}>
            <div style={{ fontSize: '12px' }}>
              <div>容量分配: {storageEstimate.quota} GB</div>
              <div style={{ color: '#10b981' }}>已用: {storageEstimate.usage} GB</div>
            </div>
            <button 
              className="mini-btn" 
              onClick={async () => {
                AudioManager.playClick();
                const success = await StorageManager.selectAssetsFolder();
                if (success) { setIsAssetsMounted(true); props.showToast('✅ 本地图库扩容已挂载！'); }
                else props.showToast('❌ 未选择文件夹或浏览器不支持');
              }}
              style={{ background: isAssetsMounted ? '#10b981' : '#555' }}
            >
              {isAssetsMounted ? '已挂载本地图库' : '📁 挂载本地图库 (扩容)'}
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '6px' }}>
            <div style={{ fontSize: '12px' }}>自动无感备份</div>
            <button 
              className="mini-btn" 
              onClick={async () => {
                AudioManager.playClick();
                const success = await StorageManager.selectBackupFolder();
                if (success) { setIsAutoBackupEnabled(true); props.showToast('✅ 自动备份已开启！'); }
                else props.showToast('❌ 未选择文件夹或浏览器不支持');
              }}
              style={{ background: isAutoBackupEnabled ? '#10b981' : '#555' }}
            >
              {isAutoBackupEnabled ? '自动备份中' : '📁 选择备份文件夹'}
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
                id="legacy-search-input"
                autoFocus 
                placeholder={i18n.language === 'zh' ? "搜索并回车添加..." : "Search and press Enter..."} 
                value={legacyInput} 
                onChange={e => setLegacyInput(e.target.value)} 
                onKeyDown={e => { if (e.key === 'Enter' && legacyResults.length > 0) addToLegacyList(legacyResults[0]); }}
                onBlur={() => setTimeout(() => setLegacyResults([]), 200)} 
                onFocus={handleFocus}
              />
              {legacyResults.length > 0 && (
                <div className="autocomplete-dropdown" style={{ zIndex: 999 }}>
                  {legacyResults.map((item: any, idx: number) => {
                    const displayName = i18n.language === 'zh' ? item.name.zh : item.name.en;
                    const displaySeries = i18n.language === 'zh' ? item.series.zh : item.series.en;
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
                  const displayName = i18n.language === 'zh' ? item.name.zh : item.name.en;
                  return (
                    <div key={idx} className="legacy-temp-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <span><span className="ac-grade">{item.grade}</span> {displayName}</span>
                        <button onClick={() => removeLegacyItem(item.id)}>✕</button>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', width: '100%', alignItems: 'center' }}>
                        <label className="mini-btn" style={{ flex: 1, textAlign: 'center', cursor: 'pointer', margin: 0 }}>
                          {item.coverImage ? '✅ 已添加封面' : '📷 添加封面图 (可选)'}
                          <input type="file" accept="image/*" onChange={(e) => handleLegacyCoverUpload(e, idx)} style={{ display: 'none' }} />
                        </label>
                        {item.coverImage && <img src={item.coverImage} style={{ width: '32px', height: '32px', objectFit: 'cover', borderRadius: '4px' }} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button className="btn start" style={{ flex: 1, padding: '6px' }} onClick={handleLegacyImport} disabled={legacyList.length === 0}>{t('importBtn')} ({legacyList.length})</button>
              <button className="btn no" style={{ flex: 1, padding: '6px' }} onClick={() => { AudioManager.playClick(); setShowLegacyForm(false); props.setLegacyList([]); setLegacyInput(''); }}>{t('cancel')}</button>
            </div>
          </div>
        )}
      </div>

      <div className="custom-section">
        <h4>⚙️ {t('customization')}</h4>
        
        <div className="custom-row">
          <span>{t('reminderInterval')}:</span>
          <select value={reminderInterval} onChange={(e) => { AudioManager.playClick(); const val = Number(e.target.value); setReminderInterval(val); StorageManager.setReminderInterval(val); }} style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid #666', color: '#fff', padding: '4px 8px', borderRadius: '4px', outline: 'none' }}>
            <option value={0}>{t('audioOff')}</option>
            <option value={15 * 60}>15m</option>
            <option value={30 * 60}>30m</option>
            <option value={45 * 60}>45m</option>
            <option value={60 * 60}>60m</option>
          </select>
        </div>

        <div className="custom-row">
          <span>{i18n.language === 'zh' ? '网页AI发言频率' : 'Web AI Chat Freq'}:</span>
          <select value={webChatInterval} onChange={(e) => { AudioManager.playClick(); const val = Number(e.target.value); setWebChatInterval(val); StorageManager.setWebChatInterval(val); }} style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid #666', color: '#fff', padding: '4px 8px', borderRadius: '4px', outline: 'none' }}>
            <option value={5000}>5s</option>
            <option value={8000}>8s ({i18n.language === 'zh' ? '默认' : 'Default'})</option>
            <option value={15000}>15s</option>
            <option value={30000}>30s</option>
            <option value={60000}>60s</option>
          </select>
        </div>

        <div className="custom-row">
          <span>{i18n.language === 'zh' ? '悬浮窗AI发言频率' : 'PiP AI Chat Freq'}:</span>
          <select value={pipChatInterval} onChange={(e) => { AudioManager.playClick(); const val = Number(e.target.value); setPipChatInterval(val); StorageManager.setPipChatInterval(val); }} style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid #666', color: '#fff', padding: '4px 8px', borderRadius: '4px', outline: 'none' }}>
            <option value={30000}>30s</option>
            <option value={60000}>60s ({i18n.language === 'zh' ? '默认' : 'Default'})</option>
            <option value={120000}>120s</option>
            <option value={300000}>300s</option>
          </select>
        </div>

        <div className="custom-row">
          <span>{t('bgMain')}:</span>
          <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
            <label className="mini-btn" style={{ flex: 1, textAlign: 'center', cursor: 'pointer', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              📁 {t('uploadImage')}<input type="file" accept="image/*" onChange={(e) => handleBgFileUpload(e, 'main')} style={{ display: 'none' }} />
            </label>
            {bgMain && <button className="mini-btn" style={{ color: '#ef4444' }} onClick={() => { AudioManager.playClick(); setBgMain(''); StorageManager.setBgMain(''); }}>{t('clear')}</button>}
          </div>
        </div>

        <div className="custom-row">
          <span>{t('bgPip')}:</span>
          <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
            <label className="mini-btn" style={{ flex: 1, textAlign: 'center', cursor: 'pointer', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              📁 {t('uploadImage')}<input type="file" accept="image/*" onChange={(e) => handleBgFileUpload(e, 'pip')} style={{ display: 'none' }} />
            </label>
            {bgPip && <button className="mini-btn" style={{ color: '#ef4444' }} onClick={() => { AudioManager.playClick(); setBgPip(''); StorageManager.setBgPip(''); }}>{t('clear')}</button>}
          </div>
        </div>

        <div className="custom-row">
          <button className="mini-btn" onClick={openPreview}>{t('previewBg')}</button>
        </div>
        
        <div className="audio-settings">
          {(['click', 'start', 'pause', 'complete', 'finishPart', 'stage', 'timebox', 'achievement'] as const).map(type => {
            const labelMap: any = { 
              click: t('audioClick'), start: t('audioStart'), pause: t('audioPause'), complete: t('audioComplete'), 
              finishPart: t('audioFinishPart'), stage: t('audioStage'), timebox: t('audioTimebox'), achievement: t('audioAchievement') 
            };
            return (
              <div key={type} className="audio-row">
                <span>{labelMap[type]}</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <select id={`audio-select-${type}`} value={audioSettings[type] || 'default'} onChange={e => updateAudioSetting(type, e.target.value)}>
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
            )
          })}
        </div>
      </div>

      <div className="shop-section">
        <div className="shop-header"><h4>🏪 {t('titlesShop')}</h4><span>🪙 {coinsBalance}</span></div>
        <div className="title-list">
          {titles.map((title: any) => {
            const isOwned = earnedTitles.includes(title.id);
            const canAfford = coinsBalance >= title.cost;
            const meetsCondition = title.checkCondition();
            return (
              <div key={title.id} className={`title-item ${isOwned ? 'owned' : ''}`}>
                <div className="title-info">
                  <div className="title-name" style={{ color: title.color, textShadow: `0 0 10px ${title.color}40` }}>
                    {t(title.nameKey)}
                  </div>
                  <div className="title-cond">{t(title.descKey)}</div>
                </div>
                {isOwned ? (
                  <button className="mini-btn" onClick={() => equipTitle(title.id)} disabled={equippedTitle === title.id}>{equippedTitle === title.id ? t('equipped') : t('equip')}</button>
                ) : (
                  <button className="mini-btn buy-btn" onClick={() => buyTitle(title.id)} disabled={!canAfford || !meetsCondition}>{title.cost} 🪙</button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="achievements-section">
        <h4>🏆 {t('achievements')}</h4>
        {earnedAchievements.length === 0 ? (<div className="empty-ach">{t('emptyAchievements')}</div>) : (
          <div className="ach-list">
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

      <div id="tour-install" className="data-backup-section">
        <h4>{t('dataBackup')} <span style={{float:'right', fontSize:'11px', color:'#888'}}>Used: {storageUsage} MB</span></h4>
        <div className="backup-actions" style={{ marginBottom: '16px' }}>
          <button className="backup-btn" onClick={exportData}>{t('exportData')}</button>
          <label className="backup-btn import-label">{t('importData')}<input type="file" accept=".json" onChange={importData} style={{ display: 'none' }} /></label>
        </div>
        
        <div style={{ borderTop: '1px dashed #444', paddingTop: '16px', marginTop: '8px' }}>
          <h4 style={{ color: '#ef4444', marginBottom: '8px', fontSize: '12px' }}>⚠️ {t('dangerZone')}</h4>
          {!showResetConfirm ? (
            <button className="backup-btn" style={{ width: '100%', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderColor: '#ef4444' }} onClick={() => { AudioManager.playClick(); setShowResetConfirm(true); }}>{t('resetData')}</button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <p style={{ fontSize: '12px', color: '#ccc', margin: '0 0 8px 0' }}>{t('resetConfirm')}</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn yes" style={{ background: '#ef4444', flex: 1, padding: '6px' }} onClick={handleResetData} disabled={isResetting}>{isResetting ? t('clearing') : t('confirm')}</button>
                <button className="btn no" style={{ flex: 1, padding: '6px' }} onClick={() => { AudioManager.playClick(); setShowResetConfirm(false); }} disabled={isResetting}>{t('cancel')}</button>
              </div>
            </div>
          )}
        </div>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '12px', color: '#666' }}>
          <p style={{ margin: '0 0 6px 0' }}>ModelVault Beta v0.1.0</p>
          <a href="https://github.com/你的Github用户名/modelvault-web/issues" target="_blank" rel="noreferrer" style={{ color: '#3b82f6', textDecoration: 'none' }}>🐞 {t('feedback')}</a>
        </div>
      </div>
    </div>
  );
};