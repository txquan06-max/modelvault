import React from 'react';

interface StatsChartProps {
  sessions: any[];
  stageTime: Record<string, number>;
  i18n: any;
}

const toLocalDateStr = (ts: number): string => {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const StatsChart: React.FC<StatsChartProps> = ({ sessions, stageTime, i18n }) => {
  const isZh = i18n.language === 'zh';

  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = toLocalDateStr(d.getTime());
    const daySessions = sessions.filter((s) => toLocalDateStr(s.startedAt) === dateStr);
    const totalSec = daySessions.reduce((sum, s) => sum + s.activeSeconds, 0);
    return { label: `${d.getMonth() + 1}/${d.getDate()}`, value: totalSec };
  });

  const maxSec = Math.max(...days.map((d) => d.value), 3600);

  const width = 400;
  const height = 140;
  const paddingX = 30;
  const paddingY = 20;
  
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  const points = days.map((d, i) => {
    const x = paddingX + (i / 6) * chartWidth;
    const y = height - paddingY - (d.value / maxSec) * chartHeight;
    return { x, y, ...d };
  });

  const linePath = points.reduce((acc, p, i, a) => {
    if (i === 0) return `M ${p.x},${p.y}`;
    const prev = a[i - 1];
    const cp1x = prev.x + (p.x - prev.x) / 2;
    const cp1y = prev.y;
    const cp2x = prev.x + (p.x - prev.x) / 2;
    const cp2y = p.y;
    return `${acc} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p.x},${p.y}`;
  }, '');

  const areaPath = `${linePath} L ${points[6].x},${height - paddingY} L ${points[0].x},${height - paddingY} Z`;

  const radarData = [
    { key: 'stage_assembly', label: isZh ? '素组' : 'Assembly', value: stageTime['stage_assembly'] || 0 },
    { key: 'stage_scribing', label: isZh ? '刻线' : 'Scribing', value: stageTime['stage_scribing'] || 0 },
    { key: 'stage_lining', label: isZh ? '渗线' : 'Lining', value: stageTime['stage_lining'] || 0 },
    { key: 'stage_painting', label: isZh ? '补色' : 'Painting', value: stageTime['stage_painting'] || 0 },
    { key: 'stage_topcoat', label: isZh ? '保护漆' : 'Topcoat', value: stageTime['stage_topcoat'] || 0 },
  ];

  const maxRadarValue = Math.max(...radarData.map(d => d.value), 1);
  const radarRadius = 50;
  const radarCenter = 70;
  const numSides = radarData.length;

  const getRadarPoints = (values: number[]) => {
    return values.map((val, i) => {
      const angle = (Math.PI * 2 * i) / numSides - Math.PI / 2;
      const r = (val / maxRadarValue) * radarRadius;
      return `${radarCenter + r * Math.cos(angle)},${radarCenter + r * Math.sin(angle)}`;
    }).join(' ');
  };

  const dataRadarPoints = radarData.map(d => d.value);

  const dominantStage = [...radarData].sort((a, b) => b.value - a.value)[0];
  let title = isZh ? '均衡胶佬' : 'Balanced Builder';
  if (dominantStage.value > 0) {
    if (dominantStage.key === 'stage_assembly') title = isZh ? '素组狂魔' : 'OOB Maniac';
    if (dominantStage.key === 'stage_scribing') title = isZh ? '刻线大师' : 'Scribing Master';
    if (dominantStage.key === 'stage_lining') title = isZh ? '渗线艺术家' : 'Lining Artist';
    if (dominantStage.key === 'stage_painting') title = isZh ? '涂装大佬' : 'Painting Pro';
    if (dominantStage.key === 'stage_topcoat') title = isZh ? '消光护法' : 'Topcoat Guardian';
  }

  return (
    <div style={{ display: 'flex', gap: '20px', alignItems: 'center', justifyContent: 'center', marginTop: '10px', flexWrap: 'wrap' }}>
      
      <div style={{ flex: '1 1 300px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '10px' }}>
        <h5 style={{ margin: '0 0 10px 0', color: '#ccc', fontSize: '12px' }}>📈 {isZh ? '近 7 天专注势能' : '7-Day Focus Energy'}</h5>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(59, 130, 246, 0.4)" />
              <stop offset="100%" stopColor="rgba(59, 130, 246, 0)" />
            </linearGradient>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {[0, 0.5, 1].map((p, i) => (
            <line key={i} x1={paddingX} y1={height - paddingY - p * chartHeight} x2={width - paddingX} y2={height - paddingY - p * chartHeight} stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4 4" />
          ))}

          <path d={areaPath} fill="url(#areaGradient)" />
          <path d={linePath} fill="none" stroke="url(#lineGradient)" strokeWidth="3" filter="url(#glow)" />

          {points.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={4} fill="#3b82f6" stroke="#fff" strokeWidth="2" />
              {p.value > 0 && (
                <text x={p.x} y={p.y - 10} fill="#10b981" fontSize="10" textAnchor="middle" fontWeight="bold">
                  {Math.floor(p.value / 60)}m
                </text>
              )}
              <text x={p.x} y={height - 2} fill="#666" fontSize="9" textAnchor="middle">
                {i === 6 ? (isZh ? '今日' : 'Today') : p.label}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div style={{ flex: '0 0 140px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h5 style={{ margin: '0 0 10px 0', color: '#f59e0b', fontSize: '12px' }}>🎯 {title}</h5>
        <svg viewBox="0 0 140 140" style={{ width: '130px', height: '130px', overflow: 'visible' }}>
          {[0.33, 0.66, 1].map((scale, idx) => (
            <polygon 
              key={idx} 
              points={getRadarPoints(Array(numSides).fill(radarRadius * scale))} 
              fill="none" 
              stroke="rgba(255,255,255,0.1)" 
              strokeWidth="1" 
            />
          ))}
          {radarData.map((_, i) => {
            const angle = (Math.PI * 2 * i) / numSides - Math.PI / 2;
            const x = radarCenter + radarRadius * Math.cos(angle);
            const y = radarCenter + radarRadius * Math.sin(angle);
            return <line key={i} x1={radarCenter} y1={radarCenter} x2={x} y2={y} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />;
          })}
          <polygon 
            points={getRadarPoints(dataRadarPoints)} 
            fill="rgba(245, 158, 11, 0.3)" 
            stroke="#f59e0b" 
            strokeWidth="2" 
            filter="url(#glow)"
          />
          {radarData.map((d, i) => {
            const angle = (Math.PI * 2 * i) / numSides - Math.PI / 2;
            const x = radarCenter + (radarRadius + 15) * Math.cos(angle);
            const y = radarCenter + (radarRadius + 15) * Math.sin(angle);
            return (
              <text key={i} x={x} y={y} fill="#aaa" fontSize="9" textAnchor="middle" alignmentBaseline="middle">
                {d.label}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
};