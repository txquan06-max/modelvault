import { AudioManager } from '../core/AudioManager';
import { FocusPanel } from '../components/FocusPanel';

export const FocusView = (props: any) => {
  const {
    t, i18n, isAddingModel, setIsAddingModel, isAddingTask, setIsAddingTask,
    timerState, isFinishingPart, currentModelId, newModelNameInput, setNewModelNameInput,
    selectedGunpla, setSelectedGunpla, searchResults, setSearchResults, newModelGrade, setNewModelGrade,
    newModelSeriesInput, setNewModelSeriesInput, useDefaultTasks, setUseDefaultTasks, newTaskName, setNewTaskName,
    handleAddModel, handleAddTask, handleFocus,
    isWholeBuild, setIsWholeBuild // 🌟 接收新属性
  } = props;

  const isZh = i18n.language === 'zh';

  return (
    <div className="view-content">
      <div className="add-controls">
        <button className="add-btn-large" onClick={() => { AudioManager.playClick(); setIsAddingModel(true); }} disabled={timerState !== 'Idle' || isFinishingPart}>+ {t('addModel')}</button>
        <button className="add-btn-large" onClick={() => { AudioManager.playClick(); setIsAddingTask(true); }} disabled={timerState !== 'Idle' || !currentModelId || isFinishingPart}>+ {t('addTask')}</button>
      </div>

      {isAddingModel && (
        <div className="inline-form vertical-form" style={{ position: 'relative' }}>
          <div className="search-autocomplete">
            <input id="new-model-name" autoFocus placeholder={t('modelName')} value={newModelNameInput} onChange={e => { setNewModelNameInput(e.target.value); setSelectedGunpla(null); }} onBlur={() => setTimeout(() => setSearchResults([]), 200)} onFocus={handleFocus} />
            {searchResults.length > 0 && (
              <div className="autocomplete-dropdown">
                {searchResults.map((item: any, idx: number) => {
                  const displayName = isZh ? item.name.zh : item.name.en;
                  const displaySeries = isZh ? item.series.zh : item.series.en;
                  return (
                    <div key={idx} className="autocomplete-item" onClick={() => { AudioManager.playClick(); setNewModelNameInput(displayName); setNewModelSeriesInput(displaySeries); setNewModelGrade(item.grade); setSelectedGunpla(item); setSearchResults([]); }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span className="ac-grade">{item.grade}</span><strong style={{ color: '#fff' }}>{displayName}</strong></div>
                      <div className="ac-series">| {displaySeries}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <select id="new-model-grade" value={newModelGrade} onChange={e => { AudioManager.playClick(); setNewModelGrade(e.target.value); }}>{['HG', 'RG', 'MG', 'MGEX', 'MGSD', 'FM', 'PG'].map(g => <option key={g} value={g}>{g}</option>)}</select>
          <input id="new-model-series" placeholder={t('series')} value={newModelSeriesInput} onChange={e => setNewModelSeriesInput(e.target.value)} disabled={!!selectedGunpla} onFocus={handleFocus} />
          
          <label className="checkbox-label">
            <input type="checkbox" checked={useDefaultTasks} onChange={e => { AudioManager.playClick(); setUseDefaultTasks(e.target.checked); }} />
            {t('useDefaultTasks')}
          </label>

          {/* 🌟 整体制作模式选择 */}
          {useDefaultTasks && (
            <label className="checkbox-label">
              <input type="checkbox" checked={isWholeBuild} onChange={e => { AudioManager.playClick(); setIsWholeBuild(e.target.checked); }} />
              {t('whole_build')}
            </label>
          )}

          <div style={{display:'flex', gap:'8px', width:'100%', marginTop: '8px'}}>
            <button className="btn start" style={{flex: 1, padding: '8px'}} onClick={handleAddModel}>{t('save')}</button>
            <button className="btn no" style={{flex: 1, padding: '8px'}} onClick={() => { AudioManager.playClick(); setIsAddingModel(false); setSearchResults([]); }}>{t('cancel')}</button>
          </div>
        </div>
      )}

      {isAddingTask && (
        <div className="inline-form">
          <input id="new-task-name" autoFocus placeholder={t('taskName')} value={newTaskName} onChange={e => setNewTaskName(e.target.value)} onKeyDown={e => {
            if (e.key === 'Enter' && newTaskName.trim()) {
              AudioManager.playClick();
              handleAddTask(newTaskName.trim());
              setNewTaskName(''); 
              setIsAddingTask(false);
            }
          }} onFocus={handleFocus} />
          <button onClick={() => { AudioManager.playClick(); setIsAddingTask(false); }}>{t('cancel')}</button>
        </div>
      )}
      
      <FocusPanel {...props} isPip={false} />
    </div>
  );
};