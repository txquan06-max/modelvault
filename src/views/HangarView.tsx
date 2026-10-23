import { useState, useEffect } from 'react';
import { AudioManager } from '../core/AudioManager';
import { StorageManager } from '../core/StorageManager';
import { SessionManager } from '../core/SessionManager'; // 🌟 引入

const LocalCover = ({ image, fallback }: { image: string, fallback: string }) => {
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

  if (!url) return <span>{fallback}</span>;
  return <div style={{ width: '100%', height: '100%', backgroundImage: `url(${url})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />;
};

export const HangarView = ({ t, i18n, models, getModelName, getModelSeries, setViewingModelId, setExpandedTaskId, setActiveTab, setCurrentModelId }: any) => {
  const [activeSubTab, setActiveSubTab] = useState<'completed' | 'backlog'>('completed');
  const isZh = i18n.language === 'zh';

  const completedModels = models.filter((m: any) => m.status === 'Completed' || m.isRebuilding).sort((a: any, b: any) => a.grade.localeCompare(b.grade));
  const backlogModels = models.filter((m: any) => m.status === 'NotStarted' || m.status === 'InProgress').sort((a: any, b: any) => b.createdAt - a.createdAt);

  const displayList = activeSubTab === 'completed' ? completedModels : backlogModels;
  const allSessions = SessionManager.getAllSessions();

  // 🌟 辅助函数：计算模型总耗时
  const getModelTotalTime = (model: any) => {
    const taskIds = model.tasks.map((t: any) => t.id);
    const totalSec = allSessions.filter((s: any) => taskIds.includes(s.taskId)).reduce((sum: number, s: any) => sum + s.activeSeconds, 0);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  return (
    <div className="view-content hangar-view" style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%' }}>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
        <button 
          className={`tab ${activeSubTab === 'completed' ? 'active' : ''}`}
          style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: activeSubTab === 'completed' ? '#3b82f6' : 'rgba(255,255,255,0.05)', color: '#fff', fontWeight: 'bold' }}
          onClick={() => { AudioManager.playClick(); setActiveSubTab('completed'); }}
        >
          🏆 {isZh ? '已完成格纳库' : 'Completed'}
        </button>
        <button 
          className={`tab ${activeSubTab === 'backlog' ? 'active' : ''}`}
          style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: activeSubTab === 'backlog' ? '#f59e0b' : 'rgba(255,255,255,0.05)', color: '#fff', fontWeight: 'bold' }}
          onClick={() => { AudioManager.playClick(); setActiveSubTab('backlog'); }}
        >
          📦 {isZh ? '堆积区 / 待拼' : 'Backlog'}
        </button>
      </div>

      {displayList.length === 0 ? (
        <div className="empty-state">
          {activeSubTab === 'completed' 
            ? t('emptyHangar') 
            : (isZh ? '你的堆积区空空如也，赶紧去买模型吧！' : 'Your backlog is empty. Time to buy more kits!')}
        </div>
      ) : (
        <div className="hangar-grid" style={{ flex: 1, overflowY: 'auto', alignContent: 'start' }}>
          {displayList.map((model: any) => (
            <div 
              key={model.id} 
              className="hangar-card" 
              onClick={() => { 
                AudioManager.playClick(); 
                if (activeSubTab === 'completed') {
                  setViewingModelId(model.id); 
                  setExpandedTaskId(null); 
                } else {
                  setCurrentModelId(model.id);
                  setActiveTab('focus');
                }
              }} 
              style={{ cursor: 'pointer', border: activeSubTab === 'backlog' ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid #555' }}
            >
              <div className="hangar-cover">
                {model.coverImage ? <LocalCover image={model.coverImage} fallback="📷" /> : <span>📷 {t('noImage')}</span>}
                {model.isRebuilding && <span className="rebuild-badge-overlay">🔧 {t('rebuilding')}</span>}
                {activeSubTab === 'backlog' && model.status === 'InProgress' && <span className="rebuild-badge-overlay" style={{ background: '#3b82f6', color: '#fff' }}>{isZh ? '拼装中' : 'In Progress'}</span>}
              </div>
              <div className="hangar-info">
                <div className="hangar-grade" style={{ color: activeSubTab === 'backlog' ? '#f59e0b' : '#3b82f6', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{model.grade}</span>
                  {/* 🌟 显示该模型总耗时 */}
                  <span style={{ color: '#10b981', fontWeight: 'bold' }}>⏱ {getModelTotalTime(model)}</span>
                </div>
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