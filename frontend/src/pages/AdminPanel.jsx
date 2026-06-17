import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { aiApi, leaveApi, authApi } from '../api/api';
import PieChart from '../components/PieChart';

export default function AdminPanel() {
  const navigate = useNavigate();
  const [stats, setStats] = useState([]);
  const [yearStats, setYearStats] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [processing, setProcessing] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selected, setSelected] = useState(new Set());
  const [confirm, setConfirm] = useState(null);

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    Promise.all([
      aiApi.getDepartmentStats(),
      aiApi.getYearStats(),
      authApi.getUsers()
    ])
      .then(([deptStats, yearData, userData]) => {
        setStats(deptStats);
        setYearStats(yearData);
        setUsers(userData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateUser = (id, changes) => setUsers(prev => prev.map(u => u.id === id ? { ...u, ...changes } : u));
  const removeUser = (id) => setUsers(prev => prev.filter(u => u.id !== id));

  const handleApprove = async (id) => {
    setProcessing(id);
    try {
      await authApi.approveRegistration(id);
      updateUser(id, { status: 'approved' });
      showToast('User approved.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id) => {
    setProcessing(id);
    try {
      await authApi.rejectRegistration(id);
      updateUser(id, { status: 'rejected' });
      showToast('User rejected.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setProcessing(null);
    }
  };

  const handleRemove = async (id) => {
    setProcessing(id);
    try {
      await authApi.deleteUser(id);
      removeUser(id);
      setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
      showToast('User removed.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setProcessing(null);
      setConfirm(null);
    }
  };

  const handleBulk = async (action) => {
    const ids = [...selected];
    if (!ids.length) return;
    setConfirm({ action, ids, label: action === 'approve' ? 'Approve' : action === 'reject' ? 'Reject' : 'Remove' });
  };

  const executeBulk = async () => {
    const { action, ids } = confirm;
    setProcessing('bulk');
    try {
      for (const id of ids) {
        if (action === 'approve') { await authApi.approveRegistration(id); updateUser(id, { status: 'approved' }); }
        else if (action === 'reject') { await authApi.rejectRegistration(id); updateUser(id, { status: 'rejected' }); }
        else { await authApi.deleteUser(id); removeUser(id); }
      }
      showToast(`${ids.length} user(s) ${action}d.`, 'success');
      setSelected(new Set());
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setProcessing(null);
      setConfirm(null);
    }
  };

  const toggleSelect = (id) => {
    setSelected(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) { setSelected(new Set()); }
    else { setSelected(new Set(filtered.map(u => u.id))); }
  };

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  const totalLeaves = stats.reduce((s, d) => s + d.total_leaves, 0);
  const totalApproved = stats.reduce((s, d) => s + d.approved, 0);
  const totalRejected = stats.reduce((s, d) => s + d.rejected, 0);
  const totalPending = stats.reduce((s, d) => s + d.pending, 0);

  const deptPieData = stats.map(s => ({ label: s.department, value: s.total_leaves }));
  const yearPieData = yearStats.map(s => ({ label: s.year, value: s.total_leaves }));

  const exportCSV = async () => {
    try {
      const leaves = await leaveApi.getAll();
      const headers = ['ID', 'Student', 'Department', 'Type', 'Start Date', 'End Date', 'Reason', 'Status', 'Approved By', 'Comment'];
      const rows = leaves.map(l => [
        l.id, l.user_name, l.department, l.leave_type, l.start_date, l.end_date,
        `"${(l.reason || '').replace(/"/g, '""')}"`,
        l.status, l.approver_name || '', `"${(l.faculty_comment || '').replace(/"/g, '""')}"`
      ]);
      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leave-report-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      showToast('Export failed: ' + err.message, 'error');
    }
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.department.toLowerCase().includes(q);
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const statusStyle = (s) => ({
    padding:'2px 10px',borderRadius:'100px',fontSize:'0.7rem',fontWeight:600,
    background: s === 'approved' ? '#d1fae5' : s === 'pending' ? '#fef3c7' : '#fee2e2',
    color: s === 'approved' ? '#065f46' : s === 'pending' ? '#92400e' : '#991b1b'
  });

  return (
    <div className="container">
      {toast && (
        <div className={`alert alert-${toast.type}`} style={{position:'sticky',top:'1rem',zIndex:100,animation:'slideDown 0.3s ease',marginBottom:'1rem'}}>
          {toast.message}
        </div>
      )}

      {confirm && (
        <div className="modal-overlay" onClick={() => setConfirm(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3>{confirm.label} {confirm.ids.length} user(s)?</h3>
            <p style={{color:'#64748b',fontSize:'0.85rem',margin:'0.5rem 0 1rem'}}>
              {confirm.action === 'remove' ? 'This cannot be undone.' : `Mark ${confirm.ids.length} registration(s) as ${confirm.action}d.`}
            </p>
            <div style={{display:'flex',gap:'0.5rem',justifyContent:'flex-end'}}>
              <button className="btn btn-outline" onClick={() => setConfirm(null)}>Cancel</button>
              <button className={`btn ${confirm.action === 'remove' ? 'btn-danger' : 'btn-primary'}`} onClick={executeBulk} disabled={processing === 'bulk'}>
                {processing === 'bulk' ? 'Processing...' : `Yes, ${confirm.label}`}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="page-header">
        <h1>Admin Panel</h1>
        <button className="btn btn-primary" onClick={exportCSV}>{'\u2B07'} Export Leave Report (CSV)</button>
      </div>

      <div className="grid-4" style={{marginBottom:'2rem'}}>
        <div className="card stat-card">
          <div className="stat-icon">{'\uD83D\uDCCB'}</div>
          <div className="stat-value">{totalLeaves}</div>
          <div className="stat-label">Total Leaves System-wide</div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon">{'\u2705'}</div>
          <div className="stat-value" style={{color:'#16a34a'}}>{totalApproved}</div>
          <div className="stat-label">Approved</div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon">{'\u274C'}</div>
          <div className="stat-value" style={{color:'#dc2626'}}>{totalRejected}</div>
          <div className="stat-label">Rejected</div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon">{'\u23F3'}</div>
          <div className="stat-value" style={{color:'#d97706'}}>{totalPending}</div>
          <div className="stat-label">Pending</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Department-wise Leave Statistics</h2>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Department</th>
                <th>Total Leaves</th>
                <th>Approved</th>
                <th>Rejected</th>
                <th>Pending</th>
                <th>Avg Days</th>
                <th>Approval Rate</th>
              </tr>
            </thead>
            <tbody>
              {stats.map(s => (
                <tr key={s.department}>
                  <td><strong>{s.department}</strong></td>
                  <td>{s.total_leaves}</td>
                  <td style={{color:'#16a34a'}}>{s.approved}</td>
                  <td style={{color:'#dc2626'}}>{s.rejected}</td>
                  <td>{s.pending}</td>
                  <td>{s.avg_days || '-'}</td>
                  <td>
                    {s.total_leaves > 0
                      ? `${Math.round((s.approved / s.total_leaves) * 100)}%`
                      : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid-3" style={{marginBottom:'2rem', marginTop:'1.5rem'}}>
        <PieChart data={deptPieData} title="Department-wise Distribution" />
        <PieChart data={yearPieData} title="Year-wise Distribution" />
      </div>

      <div className="card" style={{marginTop:'1rem'}}>
        <div className="card-header">
          <h2>System Management</h2>
        </div>
        <div className="grid-3">
          <div className="card" style={{cursor:'pointer'}} onClick={() => navigate('/pending-approvals')}>
            <strong>{'\uD83D\uDCCB'} Pending Approvals</strong>
            <p style={{fontSize:'0.85rem',color:'#64748b',marginTop:'0.25rem'}}>Review all pending leave requests</p>
          </div>
          <div className="card" style={{cursor:'pointer'}} onClick={exportCSV}>
            <strong>{'\u2B07'} Export Report</strong>
            <p style={{fontSize:'0.85rem',color:'#64748b',marginTop:'0.25rem'}}>Download all leave data as CSV</p>
          </div>
          <div className="card">
            <strong>{'\uD83D\uDC65'} User Management</strong>
            <p style={{fontSize:'0.85rem',color:'#64748b',marginTop:'0.25rem'}}>Manage registered students & faculty below</p>
          </div>
        </div>
      </div>

      <div className="card" style={{marginTop:'1.5rem'}}>
        <div className="card-header">
          <h2>Registered Users</h2>
          <span style={{fontSize:'0.8rem',color:'#64748b'}}>{filtered.length} of {users.length} &middot; {users.filter(u => u.status === 'pending').length} pending</span>
        </div>

        <div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap',alignItems:'center',padding:'0 1.5rem 1rem',borderBottom:'1px solid #f1f5f9'}}>
          <div style={{position:'relative',flex:1,minWidth:'180px'}}>
            <svg style={{position:'absolute',left:'10px',top:'50%',transform:'translateY(-50%)',width:'16px',height:'16px',color:'#94a3b8',pointerEvents:'none'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input placeholder="Search by name, email, department..." value={search} onChange={e => setSearch(e.target.value)} style={{width:'100%',padding:'0.5rem 0.5rem 0.5rem 2rem',border:'2px solid #e2e8f0',borderRadius:'8px',fontSize:'0.8rem',outline:'none'}} />
          </div>
          {['all','student','faculty'].map(r => (
            <button key={r} className={`btn btn-sm ${roleFilter === r ? 'btn-primary' : 'btn-outline'}`} onClick={() => { setRoleFilter(r); setSelected(new Set()); }} style={{textTransform:'capitalize'}}>
              {r === 'all' ? 'All' : r}
            </button>
          ))}
        </div>

        {selected.size > 0 && (
          <div style={{display:'flex',alignItems:'center',gap:'0.5rem',padding:'0.75rem 1.5rem',background:'#f8fafc',borderBottom:'1px solid #e2e8f0',fontSize:'0.82rem'}}>
            <span style={{fontWeight:600,color:'#475569'}}>{selected.size} selected</span>
            <button className="btn btn-sm btn-primary" onClick={() => handleBulk('approve')} disabled={processing === 'bulk'}>Approve All</button>
            <button className="btn btn-sm btn-danger" onClick={() => handleBulk('reject')} disabled={processing === 'bulk'}>Reject All</button>
            <button className="btn btn-sm" style={{background:'#fee2e2',color:'#991b1b',border:'1px solid #fecaca'}} onClick={() => handleBulk('remove')} disabled={processing === 'bulk'}>Remove All</button>
            <button className="btn btn-sm btn-outline" style={{marginLeft:'auto'}} onClick={() => setSelected(new Set())}>Clear</button>
          </div>
        )}

        <div className="table-wrap" style={{borderTop:'none'}}>
          <table>
            <thead>
              <tr>
                <th style={{width:'36px'}}>
                  <input type="checkbox" onChange={toggleSelectAll} checked={selected.size === filtered.length && filtered.length > 0} />
                </th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Department</th>
                <th>Year</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} style={{background: selected.has(u.id) ? '#f0f4ff' : undefined}}>
                  <td><input type="checkbox" checked={selected.has(u.id)} onChange={() => toggleSelect(u.id)} /></td>
                  <td><strong>{u.name}</strong></td>
                  <td style={{fontSize:'0.82rem',color:'#64748b'}}>{u.email}</td>
                  <td><span className={`role-badge ${u.role}`} style={{fontSize:'0.55rem'}}>{u.role}</span></td>
                  <td style={{fontSize:'0.82rem'}}>{u.department}</td>
                  <td>{u.student_year || '-'}</td>
                  <td><span style={statusStyle(u.status)}>{u.status}</span></td>
                  <td>
                    <div style={{display:'flex',gap:'0.3rem',alignItems:'center',flexWrap:'wrap'}}>
                      {u.status === 'pending' ? (
                        <>
                          <button className="btn btn-sm btn-primary" style={{fontSize:'0.65rem',padding:'0.2rem 0.55rem'}} onClick={() => handleApprove(u.id)} disabled={processing === u.id}>Approve</button>
                          <button className="btn btn-sm btn-danger" style={{fontSize:'0.65rem',padding:'0.2rem 0.55rem'}} onClick={() => handleReject(u.id)} disabled={processing === u.id}>Reject</button>
                        </>
                      ) : (
                        <span style={{fontSize:'0.72rem',color:'#94a3b8',fontWeight:500}}>{u.status === 'approved' ? 'Active' : 'Inactive'}</span>
                      )}
                      <button className="btn btn-sm" style={{fontSize:'0.62rem',padding:'0.2rem 0.5rem',background:'#fee2e2',color:'#991b1b',border:'1px solid #fecaca',borderRadius:'6px'}}
                        onClick={() => setConfirm({ action:'remove', ids:[u.id], label:`Remove "${u.name}"` })} disabled={processing === u.id}>
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
