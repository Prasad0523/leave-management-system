import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { leaveApi, aiApi } from '../api/api';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [workload, setWorkload] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [absentees, setAbsentees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deptStats, setDeptStats] = useState([]);
  const [templates, setTemplates] = useState({});

  useEffect(() => {
    const promises = [
      leaveApi.getAll().catch(() => []),
      aiApi.getNotifications().catch(() => []),
      aiApi.getHolidays(5).catch(() => []),
      aiApi.getReasonTemplates().catch(() => ({})),
      user.role === 'admin' ? aiApi.getDepartmentStats().catch(() => []) : 
      user.role === 'faculty' ? aiApi.getDepartmentStats().catch(() => []) : 
      Promise.resolve(null),
    ];
    if (user.role === 'faculty' || user.role === 'admin') {
      promises.push(aiApi.getFacultyWorkload().catch(() => null));
      promises.push(aiApi.getTodaysAbsentees().catch(() => []));
    }
    Promise.all(promises).then(([l, n, h, t, d, w, a]) => {
      setLeaves(l);
      setNotifications(n);
      setHolidays(h);
      if (t) setTemplates(t);
      if (d) setDeptStats(d);
      if (w) setWorkload(w);
      if (a) setAbsentees(a);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  const attendancePct = user.total_classes > 0
    ? Math.round((user.attended_classes / user.total_classes) * 100)
    : null;
  const pendingLeaves = leaves.filter(l => l.status === 'pending');
  const approvedLeaves = leaves.filter(l => l.status === 'approved');
  const rejectedLeaves = leaves.filter(l => l.status === 'rejected');
  const recentLeaves = leaves.slice(0, 5);

  const getStatusIcon = (s) => s === 'pending' ? '\u23F3' : s === 'approved' ? '\u2705' : '\u274C';

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Welcome back, {user.name}!</p>
        </div>
        <Link to="/leave-request" className="btn btn-primary">+ New Leave Request</Link>
      </div>

      <div className="grid-4" style={{marginBottom:'2rem'}}>
        <div className="card stat-card">
          <div className="stat-icon">{'\uD83D\uDCCB'}</div>
          <div className="stat-value">{leaves.length}</div>
          <div className="stat-label">Total Leaves</div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon">{'\u23F3'}</div>
          <div className="stat-value" style={{color:'#d97706'}}>{pendingLeaves.length}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon">{'\u2705'}</div>
          <div className="stat-value" style={{color:'#16a34a'}}>{approvedLeaves.length}</div>
          <div className="stat-label">Approved</div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon">{'\u274C'}</div>
          <div className="stat-value" style={{color:'#dc2626'}}>{rejectedLeaves.length}</div>
          <div className="stat-label">Rejected</div>
        </div>
      </div>

      <div className="card" style={{marginBottom:'1.5rem'}}>
        <div className="card-header"><h2>{'\u26A1'} Quick Actions</h2></div>
        <div style={{display:'flex',gap:'0.75rem',flexWrap:'wrap'}}>
          <Link to="/leave-request" className="btn btn-primary">{'\uD83D\uDCDD'} New Leave</Link>
          <Link to="/my-leaves" className="btn btn-outline">{'\uD83D\uDCCB'} My Leaves</Link>
          {user.role !== 'student' && <Link to="/pending-approvals" className="btn btn-outline">{'\uD83D\uDC64'} Pending Approvals</Link>}
          {user.role === 'admin' && <Link to="/admin" className="btn btn-outline">{'\uD83D\uDC65'} Admin Panel</Link>}
          <Link to="/ai-assistant" className="btn btn-outline">{'\uD83E\uDD16'} AI Assistant</Link>
          {user.role === 'student' && (
            <Link to="/ai-assistant" className="btn btn-warning">{'\uD83D\uDCDA'} Check Attendance Impact</Link>
          )}
        </div>
      </div>

      {user.role === 'student' && attendancePct !== null && (
        <div className="card" style={{marginBottom:'1.5rem', borderLeft:`5px solid ${attendancePct < 75 ? '#dc2626' : attendancePct < 80 ? '#d97706' : '#16a34a'}`}}>
          <div className="card-header"><h2>{'\uD83D\uDCDA'} My Attendance</h2></div>
          <div style={{display:'flex', alignItems:'center', gap:'1.5rem', flexWrap:'wrap'}}>
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:'2.5rem',fontWeight:800,color: attendancePct < 75 ? '#dc2626' : attendancePct < 80 ? '#d97706' : '#16a34a'}}>
                {attendancePct}%
              </div>
              <div style={{fontSize:'0.8rem',color:'#64748b'}}>Attendance</div>
            </div>
            <div style={{fontSize:'0.85rem',color:'#475569',lineHeight:1.8}}>
              <div>{'\uD83D\uDCC5'} Classes held: <strong>{user.total_classes}</strong></div>
              <div>{'\u2705'} Attended: <strong>{user.attended_classes}</strong></div>
              <div>{'\u274C'} Missed: <strong>{user.total_classes - user.attended_classes}</strong></div>
            </div>
            {attendancePct < 75 && (
              <div className="alert alert-error" style={{margin:0,flex:1}}>
                {'\u26A0\uFE0F'} Attendance below 75% threshold! Please be regular.
              </div>
            )}
            {attendancePct >= 75 && attendancePct < 80 && (
              <div className="alert alert-info" style={{margin:0,flex:1}}>
                {'\uD83D\uDCA1'} Attendance is adequate but be careful not to fall below 75%.
              </div>
            )}
          </div>
        </div>
      )}

      {workload && (
        <div className="card" style={{marginBottom:'1.5rem'}}>
          <div className="card-header"><h2>{'\uD83C\uDF93'} {user.role === 'admin' ? 'System-wide Overview' : `${user.department} Overview`}</h2></div>
          {user.role === 'admin' && deptStats.length > 0 ? (
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))', gap:'1rem'}}>
              {deptStats.map((s, i) => {
                const colors = ['#2563eb','#7c3aed','#059669','#d97706','#dc2626','#0891b2','#4f46e5','#db2777'];
                const color = colors[i % colors.length];
                const rate = s.total_leaves > 0 ? Math.round((s.approved / s.total_leaves) * 100) : 0;
                return (
                  <div key={s.department} className="card" style={{padding:'1rem', borderTop:`3px solid ${color}`, textAlign:'center'}}>
                    <div style={{fontWeight:600,fontSize:'0.9rem',color,marginBottom:'0.75rem'}}>{s.department}</div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.5rem',fontSize:'0.78rem'}}>
                      <div><strong style={{fontSize:'1.1rem',color:'#0f172a'}}>{s.total_leaves}</strong><br/><span style={{color:'#64748b'}}>Leaves</span></div>
                      <div><strong style={{fontSize:'1.1rem',color:'#6366f1'}}>{s.total_students}</strong><br/><span style={{color:'#64748b'}}>Students</span></div>
                      <div><strong style={{fontSize:'1.1rem',color:'#16a34a'}}>{s.approved}</strong><br/><span style={{color:'#64748b'}}>Approved</span></div>
                      <div><strong style={{fontSize:'1.1rem',color:'#dc2626'}}>{s.rejected}</strong><br/><span style={{color:'#64748b'}}>Rejected</span></div>
                    </div>
                    <div style={{marginTop:'0.6rem',fontSize:'0.75rem',color:'#64748b'}}>
                      Pending: <strong style={{color:'#d97706'}}>{s.pending}</strong> {'\u2022'} Attendance: <strong style={{color: s.avg_attendance < 75 ? '#dc2626' : s.avg_attendance < 80 ? '#d97706' : '#16a34a'}}>{s.avg_attendance || 'N/A'}%</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <>
              {user.role === 'faculty' && workload.year_stats && (
                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:'0.75rem', marginBottom:'1rem'}}>
                  {workload.year_stats.map(yr => {
                    const colors = { FE: '#2563eb', SE: '#7c3aed', TE: '#059669', BE: '#d97706' };
                    const color = colors[yr.year] || '#2563eb';
                    return (
                      <div key={yr.year} className="card" style={{padding:'0.85rem', borderTop:`3px solid ${color}`, textAlign:'center'}}>
                        <div style={{fontWeight:700,fontSize:'0.95rem',color,marginBottom:'0.5rem'}}>{yr.year} - {user.department}</div>
                        <div style={{fontSize:'0.78rem',color:'#475569',lineHeight:1.8}}>
                          <div>Students: <strong>{yr.total_students}</strong></div>
                          <div>Attendance: <strong style={{color: yr.avg_attendance < 75 ? '#dc2626' : yr.avg_attendance < 80 ? '#d97706' : '#16a34a'}}>{yr.avg_attendance}%</strong></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="grid-4">
                <div className="card stat-card" style={{padding:'1rem'}}>
                  <div className="stat-value" style={{fontSize:'1.5rem',color:'#d97706'}}>{workload.pending_count}</div>
                  <div className="stat-label">Pending Approvals</div>
                </div>
                <div className="card stat-card" style={{padding:'1rem'}}>
                  <div className="stat-value" style={{fontSize:'1.5rem',color:'#2563eb'}}>{workload.today_absent}</div>
                  <div className="stat-label">Absent Today</div>
                </div>
                <div className="card stat-card" style={{padding:'1rem'}}>
                  <div className="stat-value" style={{fontSize:'1.5rem',color: workload.avg_attendance < 75 ? '#dc2626' : workload.avg_attendance < 80 ? '#d97706' : '#16a34a'}}>{workload.avg_attendance || 0}%</div>
                  <div className="stat-label">Avg Attendance</div>
                </div>
                <div className="card stat-card" style={{padding:'1rem'}}>
                  <div className="stat-value" style={{fontSize:'1.5rem',color:'#6366f1'}}>{workload.total_students}</div>
                  <div className="stat-label">Total Students</div>
                </div>
              </div>
              {absentees.length > 0 && (
                <div style={{marginTop:'0.75rem',fontSize:'0.85rem',color:'#475569'}}>
                  <strong>Today's absentees:</strong> {absentees.map(a => a.department ? `${a.name} (${a.department})` : a.name).join(', ')}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {notifications.length > 0 && (
        <div className="card" style={{marginBottom:'1.5rem'}}>
          <div className="card-header"><h2>{'\uD83D\uDD14'} Notifications</h2></div>
          {notifications.map((n, i) => (
            <div key={i} className="ai-suggestion" style={{borderLeft:`4px solid ${n.type === 'warning' ? '#d97706' : n.type === 'error' ? '#dc2626' : n.type === 'success' ? '#16a34a' : '#2563eb'}`}}>
              <strong>{n.title}</strong>
              <p style={{fontSize:'0.85rem',color:'#475569',marginTop:'0.2rem'}}>{n.message}</p>
            </div>
          ))}
        </div>
      )}

      {holidays.length > 0 && (
        <div className="card" style={{marginBottom:'1.5rem'}}>
          <div className="card-header"><h2>{'\uD83D\uDCC5'} Upcoming Holidays</h2></div>
          <div style={{display:'flex',gap:'0.75rem',flexWrap:'wrap'}}>
            {holidays.map((h, i) => (
              <span key={i} className="accred-badge" style={{fontSize:'0.78rem',padding:'4px 12px'}}>
                {new Date(h.date).toLocaleDateString('en-IN', {day:'numeric', month:'short'})} — {h.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {user.role === 'student' && Object.keys(templates).length > 0 && (
        <div className="card" style={{marginBottom:'1.5rem'}}>
          <div className="card-header"><h2>{'\uD83D\uDCDD'} Quick Reason Templates</h2></div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'1rem'}}>
            {Object.entries(templates).map(([type, reasons]) => (
              <div key={type}>
                <div style={{fontWeight:600,fontSize:'0.8rem',textTransform:'capitalize',color:'#2563eb',marginBottom:'0.35rem'}}>{type}</div>
                <div style={{fontSize:'0.75rem',color:'#475569',lineHeight:1.6}}>
                  {reasons.slice(0, 3).map((r, i) => (
                    <div key={i} style={{padding:'0.15rem 0'}}>{'\u2022'} {r}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{marginTop:'0.75rem',fontSize:'0.8rem'}}>
            <Link to="/leave-request" className="btn btn-sm btn-primary">{'\uD83D\uDCDD'} Submit Leave</Link>
          </div>
        </div>
      )}

      {leaves.length > 0 && (
        <div className="card" style={{marginBottom:'1.5rem'}}>
          <div className="card-header"><h2>{'\uD83D\uDCCA'} Leave Type Breakdown</h2></div>
          <div style={{display:'flex',gap:'1rem',flexWrap:'wrap'}}>
            {['sick', 'casual', 'personal', 'emergency', 'other'].map(type => {
              const count = leaves.filter(l => l.leave_type === type).length;
              if (count === 0) return null;
              return (
                <span key={type} className="accred-badge" style={{fontSize:'0.85rem',padding:'5px 14px',background:'#f1f5f9',color:'#334155',border:'1px solid #e2e8f0'}}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}: {count}
                </span>
              );
            })}
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h2>Recent Leave Activity</h2>
          <Link to="/my-leaves" className="btn btn-outline btn-sm">View All</Link>
        </div>
        {recentLeaves.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">{'\uD83D\uDCDD'}</div>
            <h3>No leave records yet</h3>
            <p>Submit your first leave request to get started.</p>
          </div>
        ) : (
          recentLeaves.map(leave => (
            <div key={leave.id} className={`leave-card card ${leave.status}`} style={{marginBottom:'0.75rem'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                <div>
                  <strong style={{textTransform:'capitalize'}}>{leave.leave_type} Leave</strong>
                  {user.role !== 'student' && <span style={{marginLeft:'0.5rem',color:'#64748b',fontSize:'0.85rem'}}>by {leave.user_name}</span>}
                </div>
                <span className={`status-badge ${leave.status}`}>{getStatusIcon(leave.status)} {leave.status}</span>
              </div>
              <div className="leave-meta">
                <span>{'\uD83D\uDCC5'} {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}</span>
                {leave.approver_name && <span>{'\uD83D\uDC64'} by {leave.approver_name}</span>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
