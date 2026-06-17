export default function PieChart({ data, title, size = 220 }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const radius = size / 2 - 20;
  const center = size / 2;
  let cumulative = 0;

  const slices = data.map((d, i) => {
    const startAngle = (cumulative / total) * 360;
    cumulative += d.value;
    const endAngle = (cumulative / total) * 360;
    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((endAngle - 90) * Math.PI) / 180;
    const x1 = center + radius * Math.cos(startRad);
    const y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad);
    const y2 = center + radius * Math.sin(endRad);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    const path = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    const colors = ['#2563eb', '#059669', '#d97706', '#8b5cf6', '#ef4444', '#06b6d4', '#f59e0b'];
    return { path, color: colors[i % colors.length], ...d };
  });

  const legend = data.map((d, i) => {
    const colors = ['#2563eb', '#059669', '#d97706', '#8b5cf6', '#ef4444', '#06b6d4', '#f59e0b'];
    return { color: colors[i % colors.length], ...d };
  });

  return (
    <div className="card" style={{textAlign:'center'}}>
      {title && <div className="card-header" style={{justifyContent:'center'}}><h3>{title}</h3></div>}
      <div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'1.5rem', flexWrap:'wrap'}}>
        <svg width="100%" style={{maxWidth:size}} viewBox={`0 0 ${size} ${size}`}>
          {slices.map((s, i) => (
            <path key={i} d={s.path} fill={s.color} stroke="white" strokeWidth="2">
              <title>{s.label}: {s.value} ({Math.round((s.value/total)*100)}%)</title>
            </path>
          ))}
          <circle cx={center} cy={center} r={radius * 0.4} fill="white" />
          <text x={center} y={center - 5} textAnchor="middle" fontSize="11" fontWeight="700" fill="#1e293b">{total}</text>
          <text x={center} y={center + 10} textAnchor="middle" fontSize="8" fill="#64748b">Total</text>
        </svg>
        <div style={{textAlign:'left', fontSize:'0.82rem'}}>
          {legend.map((l, i) => (
            <div key={i} style={{display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.35rem'}}>
              <span style={{width:12,height:12,borderRadius:3,background:l.color,display:'inline-block'}}></span>
              <span style={{color:'#475569'}}>{l.label}</span>
              <span style={{fontWeight:600,color:'#0f172a',minWidth:'30px',textAlign:'right'}}>{l.value}</span>
              <span style={{color:'#94a3b8',minWidth:'35px',textAlign:'right'}}>({Math.round((l.value/total)*100)}%)</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
