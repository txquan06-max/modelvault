import { useState, useEffect, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useTranslation } from 'react-i18next';
import { AudioManager } from '../core/AudioManager';
import { StorageManager } from '../core/StorageManager';
import { SessionManager } from '../core/SessionManager';
import { useAppStore } from '../store/useAppStore';

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

const Card3D = ({ model, activeSubTab, onClick, t, getModelName, getModelSeries, getModelTotalTime }: any) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});
  const [glare, setGlare] = useState<React.CSSProperties>({ opacity: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = ((y - centerY) / centerY) * -12; 
    const rotateY = ((x - centerX) / centerX) * 12;

    setStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`,
      transition: 'transform 0.1s ease-out',
      boxShadow: activeSubTab === 'completed' 
        ? `0 15px 30px rgba(59, 130, 246, 0.2), inset 0 0 0 1px rgba(59, 130, 246, 0.5)` 
        : `0 15px 30px rgba(245, 158, 11, 0.2), inset 0 0 0 1px rgba(245, 158, 11, 0.5)`
    });

    setGlare({
      opacity: 1,
      background: `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.15) 0%, transparent 60%)`
    });
  };

  const handleMouseLeave = () => {
    setStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
      transition: 'transform 0.4s ease-out, box-shadow 0.4s ease-out',
      boxShadow: activeSubTab === 'backlog' ? '0 4px 10px rgba(0,0,0,0.3)' : '0 4px 10px rgba(0,0,0,0.3)'
    });
    setGlare({ opacity: 0 });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className="hangar-card"
      style={{
        ...style,
        cursor: 'pointer',
        border: activeSubTab === 'backlog' ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid #555',
        height: '100%',
        position: 'relative',
        transformStyle: 'preserve-3d'
      }}
    >
      <div style={{ position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none', transition: 'opacity 0.2s', ...glare }} />
      
      <div className="hangar-cover" style={{ transform: 'translateZ(20px)' }}>
        {model.coverImage ? <LocalCover image={model.coverImage} fallback="📷" /> : <span>📷 {t('noImage')}</span>}
        {model.isRebuilding && <span className="rebuild-badge-overlay">🔧 {t('rebuilding')}</span>}
        {activeSubTab === 'backlog' && model.status === 'InProgress' && <span className="rebuild-badge-overlay" style={{ background: '#3b82f6', color: '#fff' }}>{t('statusInProgress')}</span>}
      </div>
      <div className="hangar-info" style={{ transform: 'translateZ(30px)' }}>
        <div className="hangar-grade" style={{ color: activeSubTab === 'backlog' ? '#f59e0b' : '#3b82f6', display: 'flex', justifyContent: 'space-between' }}>
          <span>{model.grade}</span>
          <span style={{ color: '#10b981', fontWeight: 'bold' }}>⏱ {getModelTotalTime(model)}</span>
        </div>
        <div className="hangar-name" title={getModelName(model)}>{getModelName(model)}</div>
        <div className="hangar-series" title={getModelSeries(model)}>{getModelSeries(model)}</div>
      </div>
    </div>
  );
};

export const HangarView = (props: any) => {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === 'zh';

  const { models, setCurrentModelId, setActiveTab } = useAppStore();
  const { setViewingModelId, setExpandedTaskId } = props;

  const [activeSubTab, setActiveSubTab] = useState<'completed' | 'backlog'>('completed');
  
  const parentRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    if (!parentRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    resizeObserver.observe(parentRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const completedModels = models
    .filter((m: any) => m.status === 'Completed' || m.isRebuilding)
    .sort((a: any, b: any) => a.grade.localeCompare(b.grade));

  const backlogModels = models
    .filter((m: any) => m.status === 'NotStarted' || m.status === 'InProgress')
    .sort((a: any, b: any) => {
      const aP = a.status === 'InProgress' ? 0 : 1;
      const bP = b.status === 'InProgress' ? 0 : 1;
      if (aP !== bP) return aP - bP;
      return a.grade.localeCompare(b.grade);
    });

  const displayList = activeSubTab === 'completed' ? completedModels : backlogModels;
  const allSessions = SessionManager.getAllSessions();

  const getModelTotalTime = (model: any) => {
    const taskIds = model.tasks.map((t: any) => t.id);
    const totalSec = allSessions.filter((s: any) => taskIds.includes(s.taskId)).reduce((sum: number, s: any) => sum + s.activeSeconds, 0);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const getModelName = (m: any) => isZh ? m.name.zh : m.name.en;
  const getModelSeries = (m: any) => isZh ? m.series.zh : m.series.en;

  const minColumnWidth = 160; 
  const gap = 16;
  const columnCount = containerWidth > 0 ? Math.max(1, Math.floor((containerWidth + gap) / (minColumnWidth + gap))) : 2;
  const rowCount = Math.ceil(displayList.length / columnCount);

  const rows: any[][] = [];
  for (let i = 0; i < rowCount; i++) {
    rows.push(displayList.slice(i * columnCount, i * columnCount + columnCount));
  }

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200, 
    overscan: 5,
  });

  return (
    <div className="view-content hangar-view" style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%' }}>
      <div style={{ perspective: '1200px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px', flexShrink: 0 }}>
          <button 
            className={`tab ${activeSubTab === 'completed' ? 'active' : ''}`}
            style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: activeSubTab === 'completed' ? '#3b82f6' : 'rgba(255,255,255,0.05)', color: '#fff', fontWeight: 'bold', transition: 'all 0.3s' }}
            onClick={() => { AudioManager.playClick(); setActiveSubTab('completed'); }}
          >
            🏆 {t('hangar_completed')}
          </button>
          <button 
            className={`tab ${activeSubTab === 'backlog' ? 'active' : ''}`}
            style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: activeSubTab === 'backlog' ? '#f59e0b' : 'rgba(255,255,255,0.05)', color: '#fff', fontWeight: 'bold', transition: 'all 0.3s' }}
            onClick={() => { AudioManager.playClick(); setActiveSubTab('backlog'); }}
          >
            📦 {t('hangar_backlog')}
          </button>
        </div>

        {displayList.length === 0 ? (
          <div className="empty-state">
            {activeSubTab === 'completed' 
              ? t('emptyHangar') 
              : t('hangar_empty_backlog')}
          </div>
        ) : (
          <div ref={parentRef} style={{ flex: 1, overflowY: 'auto', position: 'relative', paddingRight: '4px' }}>
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const rowItems = rows[virtualRow.index];
                return (
                  <div
                    key={virtualRow.key}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      display: 'grid',
                      gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
                      gap: `${gap}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    {rowItems.map((model: any) => (
                      <Card3D 
                        key={model.id}
                        model={model}
                        activeSubTab={activeSubTab}
                        t={t}
                        getModelName={getModelName}
                        getModelSeries={getModelSeries}
                        getModelTotalTime={getModelTotalTime}
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
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};