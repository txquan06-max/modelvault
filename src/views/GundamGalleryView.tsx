import { useState, useEffect, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { GunplaSearch, type GunplaItem } from '../core/GunplaDB';
import { AudioManager } from '../core/AudioManager';

export const GundamGalleryView = ({ i18n, models }: any) => {
  const isZh = i18n.language === 'zh';
  const [filter, setFilter] = useState<'all' | 'collected' | 'uncollected'>('all');
  const [seriesFilter, setSeriesFilter] = useState<string>('all');
  const [dbData, setDbData] = useState<GunplaItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 虚拟列表容器引用和宽度状态
  const parentRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // 监听容器宽度，动态计算列数
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

  // 异步加载图鉴数据
  useEffect(() => {
    GunplaSearch.getAll().then(data => {
      setDbData(data);
      setLoading(false);
    });
  }, []);

  const allSeries = Array.from(new Set(dbData.map((item: GunplaItem) => isZh ? item.series.zh : item.series.en))).sort() as string[];

  const galleryData = dbData.map((dbItem: GunplaItem) => {
    const userModel = models.find((m: any) => 
      (m.name.en === dbItem.name.en || m.name.zh === dbItem.name.zh) && m.grade === dbItem.grade
    );
    return {
      ...dbItem,
      userModel,
      isCollected: !!userModel,
      status: userModel?.status || 'None'
    };
  });

  const filteredData = galleryData.filter(item => {
    const matchFilter = filter === 'all' ? true : filter === 'collected' ? item.isCollected : !item.isCollected;
    const matchSeries = seriesFilter === 'all' ? true : (isZh ? item.series.zh : item.series.en) === seriesFilter;
    return matchFilter && matchSeries;
  });

  const totalCollected = galleryData.filter(i => i.isCollected).length;
  const totalDB = dbData.length;

  // --- 虚拟网格计算逻辑 ---
  const minColumnWidth = 100; // 每个卡片最小宽度
  const gap = 10; // 间距
  const columnCount = containerWidth > 0 ? Math.max(1, Math.floor((containerWidth + gap) / (minColumnWidth + gap))) : 2;
  const rowCount = Math.ceil(filteredData.length / columnCount);

  // 将一维数据按列数切分成行
  const rows = [];
  for (let i = 0; i < rowCount; i++) {
    rows.push(filteredData.slice(i * columnCount, i * columnCount + columnCount));
  }

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120, // 预估每行高度 (卡片高度+间距)
    overscan: 5,
  });

  if (loading) {
    return (
      <div className="view-content" style={{ width: '100%', padding: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <div style={{ color: '#f59e0b', fontSize: '14px', fontWeight: 'bold', animation: 'pulse 2s infinite' }}>
          ⏳ {isZh ? '正在加载机体图鉴...' : 'Loading Mecha Archive...'}
        </div>
      </div>
    );
  }

  return (
    <div className="view-content" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: '10px' }}>
      <h2 style={{ fontSize: '18px', color: '#fff', marginBottom: '16px', borderLeft: '4px solid #f59e0b', paddingLeft: '10px', flexShrink: 0 }}>
        {isZh ? '高达图鉴收集' : 'Gundam Archive'}
        <span style={{ fontSize: '12px', color: '#f59e0b', marginLeft: '10px', fontWeight: 'normal' }}>
          {totalCollected} / {totalDB}
        </span>
      </h2>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap', flexShrink: 0 }}>
        {(['all', 'collected', 'uncollected'] as const).map(f => (
          <button 
            key={f} 
            onClick={() => { AudioManager.playClick(); setFilter(f); }}
            style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '12px', border: 'none', cursor: 'pointer', background: filter === f ? '#f59e0b' : 'rgba(255,255,255,0.1)', color: filter === f ? '#000' : '#fff', fontWeight: 'bold' }}
          >
            {f === 'all' ? (isZh ? '全部' : 'All') : f === 'collected' ? (isZh ? '已收集' : 'Collected') : (isZh ? '未收集' : 'Uncollected')}
          </button>
        ))}
        <select 
          value={seriesFilter} 
          onChange={e => { AudioManager.playClick(); setSeriesFilter(e.target.value); }}
          style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '12px', background: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid #555', outline: 'none' }}
        >
          <option value="all">{isZh ? '所有系列' : 'All Series'}</option>
          {allSeries.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* 虚拟滚动容器 */}
      <div 
        ref={parentRef} 
        style={{ flex: 1, overflowY: 'auto', position: 'relative', paddingRight: '4px' }}
      >
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
                {rowItems.map((item, idx) => {
                  const name = isZh ? item.name.zh : item.name.en;
                  const series = isZh ? item.series.zh : item.series.en;
                  
                  return (
                    <div 
                      key={item.id || idx}
                      onClick={() => { if (item.isCollected) AudioManager.playClick(); }}
                      style={{
                        background: item.isCollected ? 'rgba(245, 158, 11, 0.1)' : 'rgba(20,20,20,0.8)',
                        border: `1px solid ${item.isCollected ? '#f59e0b' : '#333'}`,
                        borderRadius: '8px',
                        padding: '10px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        cursor: item.isCollected ? 'pointer' : 'default',
                        opacity: item.isCollected ? 1 : 0.4,
                        position: 'relative',
                        overflow: 'hidden',
                        height: '110px' // 固定高度保证虚拟滚动顺滑
                      }}
                    >
                      {item.isCollected && item.userModel?.coverImage && (
                         <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${item.userModel.coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.2, zIndex: 0 }} />
                      )}
                      <div style={{ zIndex: 1, width: '100%' }}>
                        <div style={{ fontSize: '10px', color: item.isCollected ? '#f59e0b' : '#888', fontWeight: 'bold', marginBottom: '4px' }}>{item.grade}</div>
                        <div style={{ fontSize: '12px', color: '#fff', fontWeight: 'bold', lineHeight: 1.2, marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
                        <div style={{ fontSize: '9px', color: '#aaa', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>{series}</div>
                        {item.isCollected && (
                          <div style={{ fontSize: '9px', color: item.status === 'Completed' ? '#10b981' : '#3b82f6', marginTop: '4px', background: 'rgba(0,0,0,0.5)', padding: '2px 4px', borderRadius: '4px', display: 'inline-block' }}>
                            {item.status === 'Completed' ? (isZh ? '已完成' : 'Completed') : (isZh ? '进行中' : 'In Progress')}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};