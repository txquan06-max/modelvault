import { useState } from 'react';
import { CORE_DB, type GunplaItem } from '../core/GunplaDB';
import { AudioManager } from '../core/AudioManager';

export const GundamGalleryView = ({ i18n, models }: any) => {
  const isZh = i18n.language === 'zh';
  const [filter, setFilter] = useState<'all' | 'collected' | 'uncollected'>('all');
  const [seriesFilter, setSeriesFilter] = useState<string>('all');

  // 显式声明 string 数组，解决 unknown 类型报错
  const allSeries = Array.from(new Set(CORE_DB.map((item: GunplaItem) => isZh ? item.series.zh : item.series.en))).sort() as string[];

  const galleryData = CORE_DB.map((dbItem: GunplaItem) => {
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
  const totalDB = CORE_DB.length;

  return (
    <div className="view-content" style={{ width: '100%', padding: '10px' }}>
      <h2 style={{ fontSize: '18px', color: '#fff', marginBottom: '16px', borderLeft: '4px solid #f59e0b', paddingLeft: '10px' }}>
        {isZh ? '高达图鉴收集' : 'Gundam Archive'}
        <span style={{ fontSize: '12px', color: '#f59e0b', marginLeft: '10px', fontWeight: 'normal' }}>
          {totalCollected} / {totalDB}
        </span>
      </h2>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px', paddingBottom: '40px' }}>
        {filteredData.map((item, idx) => {
          const name = isZh ? item.name.zh : item.name.en;
          const series = isZh ? item.series.zh : item.series.en;
          
          return (
            <div 
              key={idx}
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
                overflow: 'hidden'
              }}
            >
              {item.isCollected && item.userModel?.coverImage && (
                 <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${item.userModel.coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.2, zIndex: 0 }} />
              )}
              <div style={{ zIndex: 1 }}>
                <div style={{ fontSize: '10px', color: item.isCollected ? '#f59e0b' : '#888', fontWeight: 'bold', marginBottom: '4px' }}>{item.grade}</div>
                <div style={{ fontSize: '12px', color: '#fff', fontWeight: 'bold', lineHeight: 1.2, marginBottom: '4px' }}>{name}</div>
                <div style={{ fontSize: '9px', color: '#aaa', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>{series}</div>
                {item.isCollected && (
                  <div style={{ fontSize: '9px', color: item.status === 'Completed' ? '#10b981' : '#3b82f6', marginTop: '4px', background: 'rgba(0,0,0,0.5)', padding: '2px 4px', borderRadius: '4px' }}>
                    {item.status === 'Completed' ? (isZh ? '已完成' : 'Completed') : (isZh ? '进行中' : 'In Progress')}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};