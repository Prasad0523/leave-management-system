import { useState, useEffect } from 'react';
import { leaveApi } from '../api/api';

export default function PendingApprovals() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [modal, setModal] = useState(null);
  const [singleModal, setSingleModal] = useState(null);
  const [comment, setComment] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => { loadPending(); }, []);

  const loadPending = async () => {
    try {
      const data = await leaveApi.getPending();
      setLeaves(data);
    } catch (err) {}
    finally { setLoading(false); }
  };

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === leaves.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(leaves.map(l => l.id)));
    }
  };

  const openModal = (action) => {
    if (selected.size === 0) return showToast('Select at least one leave request.', 'error');
    setModal({ action });
    setComment('');
  };

  const handleBulkAction = async () => {
    if (!modal) return;
    try {
      const result = await leaveApi.bulkAction([...selected], modal.action, comment);
      showToast(result.message, 'success');
      setModal(null);
      setSelected(new Set());
      loadPending();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleSingleAction = async (id, action) => {
    setSingleModal({ id, action });
    setComment('');
  };

  const confirmSingleAction = async () => {
    const { id, action } = singleModal;
    try {
      if (action === 'approve') {
        await leaveApi.approve(id, comment || undefined);
      } else {
        await leaveApi.reject(id, comment || undefined);
      }
      showToast(`Leave ${action}d successfully!`, 'success');
      setSingleModal(null);
      loadPending();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div className="container">
      {toast && (
        <div className={`alert alert-${toast.type}`} style={{position:'sticky',top:'1rem',zIndex:100,animation:'slideDown 0.3s ease',marginBottom:'1rem'}}>
          {toast.message}
        </div>
      )}
      <div className="page-header">
        <div>
          <h1>Pending Approvals</h1>
          <p style={{color:'#64748b',fontSize:'0.9rem'}}>{leaves.length} pending request(s) | {selected.size} selected</p>
        </div>
        <div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap'}}>
          <button className="btn btn-sm btn-outline" onClick={toggleSelectAll}>
            {selected.size === leaves.length ? 'Deselect All' : 'Select All'}
          </button>
          <button className="btn btn-sm btn-success" onClick={() => openModal('approve')} disabled={selected.size === 0}>
            Bulk Approve ({selected.size})
          </button>
          <button className="btn btn-sm btn-danger" onClick={() => openModal('reject')} disabled={selected.size === 0}>
            Bulk Reject ({selected.size})
          </button>
        </div>
      </div>

      {leaves.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">{'\u2705'}</div>
            <h3>All caught up!</h3>
            <p>No pending leave requests to review.</p>
          </div>
        </div>
      ) : (
        leaves.map(leave => {
          const attPct = leave.total_classes > 0 ? Math.round((leave.attended_classes / leave.total_classes) * 100) : null;
          return (
            <div key={leave.id} className="leave-card card pending" style={{marginBottom:'0.75rem', cursor:'pointer'}} onClick={() => toggleSelect(leave.id)}>
              <div style={{display:'flex', alignItems:'flex-start', gap:'0.75rem'}}>
                <input type="checkbox" checked={selected.has(leave.id)} onChange={() => toggleSelect(leave.id)} style={{marginTop:'0.3rem',width:'18px',height:'18px',accentColor:'#2563eb'}} />
                <div style={{flex:1}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:'0.5rem'}}>
                    <div>
                      <strong style={{textTransform:'capitalize',fontSize:'1rem'}}>{leave.leave_type} Leave</strong>
                      <span style={{marginLeft:'0.5rem',fontSize:'0.85rem',color:'#475569'}}>
                        {leave.user_name} \u2022 {leave.department} {leave.student_year ? `\u2022 ${leave.student_year}` : ''}
                      </span>
                    </div>
                    {attPct !== null && (
                      <span className={`status-badge ${attPct < 75 ? 'rejected' : attPct < 80 ? 'pending' : 'approved'}`} style={{fontSize:'0.7rem'}}>
                        Attendance: {attPct}%
                      </span>
                    )}
                  </div>
                  <div className="leave-meta">
                    <span>{'\uD83D\uDCC5'} {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}</span>
                    <span>{'\uD83D\uDCCB'} {Math.ceil((new Date(leave.end_date) - new Date(leave.start_date)) / (1000*60*60*24)) + 1} day(s)</span>
                  </div>
                  <div className="leave-reason" style={{fontSize:'0.85rem',marginTop:'0.5rem'}}>{leave.reason}</div>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:'0.35rem'}}>
                  <button className="btn btn-sm btn-success" style={{fontSize:'0.7rem',padding:'0.25rem 0.6rem'}} onClick={(e) => { e.stopPropagation(); handleSingleAction(leave.id, 'approve'); }}>
                    {'\u2705'} Approve
                  </button>
                  <button className="btn btn-sm btn-danger" style={{fontSize:'0.7rem',padding:'0.25rem 0.6rem'}} onClick={(e) => { e.stopPropagation(); handleSingleAction(leave.id, 'reject'); }}>
                    {'\u274C'} Reject
                  </button>
                </div>
              </div>
            </div>
          );
        })
      )}

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{modal.action === 'approve' ? 'Bulk Approve' : 'Bulk Reject'} ({selected.size} leaves)</h2>
            <div className="form-group">
              <label>Comment (optional, applies to all selected)</label>
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a comment for all selected leaves..." />
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button>
              <button className={`btn ${modal.action === 'approve' ? 'btn-success' : 'btn-danger'}`} onClick={handleBulkAction}>
                {modal.action === 'approve' ? `Approve ${selected.size}` : `Reject ${selected.size}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {singleModal && (
        <div className="modal-overlay" onClick={() => setSingleModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{singleModal.action === 'approve' ? 'Approve' : 'Reject'} Leave</h2>
            <p style={{fontSize:'0.85rem',color:'#475569',marginBottom:'1rem'}}>
              Are you sure you want to {singleModal.action} this leave request?
            </p>
            <div className="form-group">
              <label>Comment (optional)</label>
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a comment..." />
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setSingleModal(null)}>Cancel</button>
              <button className={`btn ${singleModal.action === 'approve' ? 'btn-success' : 'btn-danger'}`} onClick={confirmSingleAction}>
                {singleModal.action === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
