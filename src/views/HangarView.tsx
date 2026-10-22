import { AudioManager } from '../core/AudioManager';

export const HangarView = ({ t, completedModels, getModelName, getModelSeries, setViewingModelId, setExpandedTaskId }: any) => {
  return (
    <div className="view-content hangar-view">
      {completedModels.length === 0 ? (
        <div className="empty-state">{t('emptyHangar')}</div>
      ) : (
        <div className="hangar-grid">
          {completedModels.sort((a: any, b: any) => a.grade.localeCompare(b.grade)).map((model: any) => (
            <div key={model.id} className="hangar-card" onClick={() => { AudioManager.playClick(); setViewingModelId(model.id); setExpandedTaskId(null); }} style={{ cursor: 'pointer' }}>
              <div className="hangar-cover" style={{ backgroundImage: model.coverImage ? `url(${model.coverImage})` : 'none' }}>
                {!model.coverImage && <span>📷 {t('noImage')}</span>}
                {model.isRebuilding && <span className="rebuild-badge-overlay">🔧 {t('rebuilding')}</span>}
              </div>
              <div className="hangar-info">
                <div className="hangar-grade">{model.grade}</div>
                <div className="hangar-name" title={getModelName(model)}>{getModelName(model)}</div>
                <div className="hangar-series" title={getModelSeries(model)}>{getModelSeries(model)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};