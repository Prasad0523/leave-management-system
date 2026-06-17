import { useState, useEffect } from 'react';
import { leaveApi } from '../api/api';
import { useAuth } from '../context/AuthContext';

export default function MyLeaves() {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');

  useEffect(() => { loadLeaves(); }, []);

  const loadLeaves = async () => {
    try {
      const data = await leaveApi.getAll();
      setLeaves(data);
    } catch (err) {}
    finally { setLoading(false); }
  };

  const filtered = leaves
    .filter(l => filter === 'all' || l.status === filter)
    .filter(l => yearFilter === 'all' || l.student_year === yearFilter);

  const getStatusIcon = (s) => s === 'pending' ? '\u23F3' : s === 'approved' ? '\u2705' : '\u274C';

  const years = [...new Set(leaves.filter(l => l.student_year).map(l => l.student_year))].sort();

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>Leave Records</h1>
          <p style={{color:'#64748b',fontSize:'0.85rem'}}>{filtered.length} record(s)</p>
        </div>
        <div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap'}}>
          {['all', 'pending', 'approved', 'rejected'].map(f => (
            <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
          {years.length > 0 && (
            <select value={yearFilter} onChange={e => setYearFilter(e.target.value)} className="btn btn-sm btn-outline" style={{padding:'0.35rem 0.85rem',border:'2px solid #e2e8f0',borderRadius:'8px',background:'white',fontSize:'0.78rem',cursor:'pointer'}}>
              <option value="all">All Years</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">{'\uD83D\uDCDD'}</div>
            <h3>No leaves found</h3>
            <p>No matching leave records.</p>
          </div>
        </div>
      ) : (
        <div className="table-wrap" style={{padding:0,border:'none',background:'transparent'}}>
          <table className="leaves-table">
            <thead>
              <tr>
                {user.role !== 'student' && <th>Student</th>}
                {user.role !== 'student' && <th>Dept</th>}
                {user.role !== 'student' && <th>Year</th>}
                <th>Type</th>
                <th>Period</th>
                <th>Days</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Remark</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(leave => (
                <tr key={leave.id}>
                  {user.role !== 'student' && <td><span className="leave-student">{leave.user_name}</span></td>}
                  {user.role !== 'student' && <td style={{fontSize:'0.8rem',color:'#64748b'}}>{leave.department}</td>}
                  {user.role !== 'student' && <td style={{fontSize:'0.8rem',color:'#64748b'}}><span className={`role-badge ${leave.student_year === 'FE' ? 'student' : leave.student_year === 'SE' ? 'faculty' : 'admin'}`} style={{fontSize:'0.55rem',padding:'2px 8px'}}>{leave.student_year}</span></td>}
                  <td><span className="leave-type">{leave.leave_type}</span></td>
                  <td className="leave-dates">
                    {new Date(leave.start_date).toLocaleDateString('en-IN', {day:'numeric', month:'short'})}
                    {leave.start_date !== leave.end_date ? ` - ${new Date(leave.end_date).toLocaleDateString('en-IN', {day:'numeric', month:'short'})}` : ''}
                  </td>
                  <td className="leave-days">{Math.ceil((new Date(leave.end_date) - new Date(leave.start_date)) / (1000*60*60*24)) + 1}</td>
                  <td className="leave-reason-cell" title={leave.reason}>{leave.reason}</td>
                  <td><span className={`status-badge ${leave.status}`}>{getStatusIcon(leave.status)} {leave.status}</span></td>
                  <td className="leave-remark" title={leave.faculty_comment || leave.approver_name || ''}>
                    {leave.faculty_comment || leave.approver_name || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
