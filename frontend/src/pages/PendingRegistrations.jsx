import { useState, useEffect } from 'react';
import { authApi } from '../api/api';
import { useAuth } from '../context/AuthContext';

export default function PendingRegistrations() {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const data = await authApi.getPendingRegistrations();
      setRegistrations(data);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    setProcessing(id);
    setMessage({ type: '', text: '' });
    try {
      if (action === 'approve') {
        await authApi.approveRegistration(id);
      } else {
        await authApi.rejectRegistration(id);
      }
      setRegistrations(prev => prev.filter(r => r.id !== id));
      setMessage({ type: 'success', text: `Registration ${action}d successfully.` });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setProcessing(null);
    }
  };

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div className="container">
      <div className="page-header">
        <h1>Pending Registrations</h1>
        <p style={{color:'#64748b',fontSize:'0.85rem'}}>{registrations.length} pending</p>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type}`} style={{marginBottom:'1rem'}}>
          {message.text}
        </div>
      )}

      {registrations.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">{'\u2705'}</div>
            <h3>All caught up!</h3>
            <p>No pending registrations to review.</p>
          </div>
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
          {registrations.map(reg => (
            <div key={reg.id} className="card" style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'1rem'}}>
              <div>
                <h3 style={{marginBottom:'0.25rem',fontSize:'1rem'}}>{reg.name}</h3>
                <p style={{fontSize:'0.8rem',color:'#64748b',margin:0}}>
                  {reg.email} &middot; {reg.role} &middot; {reg.department}
                  {reg.student_year && <span> &middot; {reg.student_year}</span>}
                </p>
                <p style={{fontSize:'0.7rem',color:'#94a3b8',marginTop:'0.25rem'}}>
                  Registered: {new Date(reg.created_at).toLocaleDateString('en-IN', {day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'})}
                </p>
              </div>
              <div style={{display:'flex',gap:'0.5rem'}}>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => handleAction(reg.id, 'approve')}
                  disabled={processing === reg.id}
                >
                  {processing === reg.id ? '...' : 'Approve'}
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => handleAction(reg.id, 'reject')}
                  disabled={processing === reg.id}
                >
                  {processing === reg.id ? '...' : 'Reject'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
