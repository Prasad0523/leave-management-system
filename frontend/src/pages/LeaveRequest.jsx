import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { leaveApi, aiApi } from '../api/api';

export default function LeaveRequest() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ leave_type: 'casual', start_date: '', end_date: '', reason: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState({});
  const [attendanceImpact, setAttendanceImpact] = useState(null);
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    aiApi.getReasonTemplates().then(setTemplates).catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (name === 'start_date' || name === 'end_date') {
      setAttendanceImpact(null);
    }
  };

  const selectTemplate = (text) => {
    setForm(prev => ({ ...prev, reason: text }));
    setShowTemplates(false);
  };

  const checkAttendance = async () => {
    if (!form.start_date) return;
    try {
      const result = await aiApi.getAttendanceImpact(form.start_date, form.end_date || form.start_date);
      setAttendanceImpact(result);
    } catch (err) {
      setAttendanceImpact(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await leaveApi.create(form);
      setSuccess('Leave request submitted successfully!');
      setTimeout(() => navigate('/my-leaves'), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1>New Leave Request</h1>
      </div>
      <div style={{maxWidth:'640px'}}>
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {attendanceImpact && (
          <div className="card" style={{marginBottom:'1.5rem', borderLeft:`5px solid ${attendanceImpact.below_75 ? '#dc2626' : '#d97706'}`, background: attendanceImpact.below_75 ? '#fef2f2' : '#fffbeb'}}>
            <div className="card-header"><h2>{'\uD83D\uDCDA'} Attendance Impact</h2></div>
            <div style={{display:'flex', gap:'1rem', flexWrap:'wrap', fontSize:'0.9rem'}}>
              <div>Current: <strong>{attendanceImpact.current_attendance}%</strong></div>
              <div>{'\u2192'}</div>
              <div>After leave: <strong style={{color: attendanceImpact.below_75 ? '#dc2626' : '#d97706'}}>{attendanceImpact.predicted_attendance}%</strong></div>
              <div>({attendanceImpact.drop}% drop, ~{attendanceImpact.missed_classes} classes)</div>
            </div>
            {attendanceImpact.below_75 && (
              <div className="alert alert-error" style={{marginTop:'0.5rem',marginBottom:0}}>{attendanceImpact.message}</div>
            )}
          </div>
        )}

        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Leave Type</label>
              <select name="leave_type" value={form.leave_type} onChange={handleChange}>
                <option value="sick">Sick Leave</option>
                <option value="casual">Casual Leave</option>
                <option value="personal">Personal Leave</option>
                <option value="emergency">Emergency Leave</option>
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Start Date</label>
                <input type="date" name="start_date" value={form.start_date} onChange={handleChange} required onBlur={checkAttendance} />
              </div>
              <div className="form-group">
                <label>End Date</label>
                <input type="date" name="end_date" value={form.end_date} onChange={handleChange} required onBlur={checkAttendance} />
              </div>
            </div>
            <div className="form-group">
              <label>Reason</label>
              <div style={{display:'flex', gap:'0.5rem', marginBottom:'0.5rem'}}>
                <button type="button" className="btn btn-sm btn-outline" onClick={() => setShowTemplates(!showTemplates)}>
                  {'\uD83D\uDCDD'} Quick Templates
                </button>
              </div>
              {showTemplates && templates[form.leave_type] && (
                <div style={{marginBottom:'0.75rem', padding:'0.75rem', background:'#f8fafc', borderRadius:'8px', border:'1px solid #e2e8f0'}}>
                  <div style={{fontSize:'0.8rem', color:'#64748b', marginBottom:'0.5rem'}}>Select a template reason:</div>
                  {templates[form.leave_type].map((t, i) => (
                    <div key={i}
                      style={{padding:'0.4rem 0.65rem', cursor:'pointer', borderRadius:'6px', fontSize:'0.85rem', marginBottom:'0.25rem', transition:'background 0.2s'}}
                      onClick={() => selectTemplate(t)}
                      onMouseEnter={e => e.target.style.background='#eef2ff'}
                      onMouseLeave={e => e.target.style.background='transparent'}
                    >
                      {'\u2022'} {t}
                    </div>
                  ))}
                </div>
              )}
              <textarea name="reason" value={form.reason} onChange={handleChange} placeholder="Describe the reason for your leave..." required />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Leave Request'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
