import { useState } from 'react';
import { aiApi } from '../api/api';
import { useAuth } from '../context/AuthContext';

export default function AIAssistant() {
  const { user } = useAuth();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [impact, setImpact] = useState(null);
  const [holidays, setHolidays] = useState(null);
  const [absentees, setAbsentees] = useState(null);
  const [loading, setLoading] = useState({});

  const checkAttendance = async () => {
    if (!startDate) return;
    setLoading(prev => ({ ...prev, impact: true }));
    try {
      const result = await aiApi.getAttendanceImpact(startDate, endDate || startDate);
      setImpact(result);
    } catch (err) { setImpact({ message: 'Could not calculate impact.', error: true }); }
    finally { setLoading(prev => ({ ...prev, impact: false })); }
  };

  const loadHolidays = async () => {
    setLoading(prev => ({ ...prev, holidays: true }));
    try {
      const result = await aiApi.getHolidays(15);
      setHolidays(result);
    } catch (err) { setHolidays([]); }
    finally { setLoading(prev => ({ ...prev, holidays: false })); }
  };

  const loadAbsentees = async () => {
    if (user.role !== 'faculty' && user.role !== 'admin') return;
    setLoading(prev => ({ ...prev, absentees: true }));
    try {
      const result = await aiApi.getTodaysAbsentees();
      setAbsentees(result);
    } catch (err) { setAbsentees([]); }
    finally { setLoading(prev => ({ ...prev, absentees: false })); }
  };

  const card = (title, icon, content, loadingFlag, action) => (
    <div className="card" style={{marginBottom:'1.5rem'}}>
      <div className="card-header">
        <h2>{icon} {title}</h2>
        {action && (
          <button className="btn btn-sm btn-primary" onClick={action} disabled={loadingFlag}>
            {loadingFlag ? 'Loading...' : 'Run'}
          </button>
        )}
      </div>
      {content}
    </div>
  );

  return (
    <div className="container">
      <div className="page-header">
        <h1>AI Assistant</h1>
        <span style={{color:'#64748b',fontSize:'0.9rem'}}>Practical tools for leave management</span>
      </div>

      <div className="card ai-panel" style={{marginBottom:'1.5rem'}}>
        <div className="ai-header">
          <span>{'\uD83E\uDD16'}</span> Tools Overview
        </div>
        <div style={{display:'flex', gap:'1.5rem', flexWrap:'wrap', fontSize:'0.9rem', color:'#475569'}}>
          {user.role === 'student' && <div>{'\uD83D\uDCDA'} <strong>Attendance Predictor</strong> — Check how a leave will affect your attendance %</div>}
          <div>{'\uD83D\uDCC5'} <strong>Academic Calendar</strong> — View upcoming holidays and exam dates</div>
          {(user.role === 'faculty' || user.role === 'admin') && (
            <div>{'\uD83D\uDC65'} <strong>Today's Absentees</strong> — See which students are on leave today</div>
          )}
        </div>
      </div>

      <div className="grid-3" style={{gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))'}}>
        <div>
          {user.role === 'student' && card('Attendance Predictor', '\uD83D\uDCDA',
            <div>
              <p style={{fontSize:'0.85rem',color:'#475569',marginBottom:'0.75rem'}}>
                Select dates to see how this leave will impact your attendance percentage.
              </p>
              <div className="form-row" style={{marginBottom:'0.75rem'}}>
                <div className="form-group" style={{margin:0}}>
                  <label>Start Date</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="form-group" style={{margin:0}}>
                  <label>End Date</label>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>
              {impact && !impact.unavailable && (
                <div className="ai-suggestion" style={{borderLeft:`4px solid ${impact.below_75 ? '#dc2626' : '#d97706'}`}}>
                  <div style={{display:'flex', justifyContent:'space-around', textAlign:'center', marginBottom:'0.5rem'}}>
                    <div>
                      <div style={{fontSize:'1.5rem',fontWeight:700,color:'#2563eb'}}>{impact.current_attendance}%</div>
                      <div style={{fontSize:'0.75rem',color:'#64748b'}}>Current</div>
                    </div>
                    <div style={{fontSize:'1.5rem',color:'#94a3b8'}}>{'\u2192'}</div>
                    <div>
                      <div style={{fontSize:'1.5rem',fontWeight:700,color: impact.below_75 ? '#dc2626' : '#d97706'}}>{impact.predicted_attendance}%</div>
                      <div style={{fontSize:'0.75rem',color:'#64748b'}}>After Leave</div>
                    </div>
                  </div>
                  {impact.drop > 0 && (
                    <p style={{textAlign:'center',fontSize:'0.85rem',color:'#475569',marginBottom:'0.25rem'}}>
                      {impact.drop}% drop \u2022 ~{impact.missed_classes} classes missed over {impact.estimated_days} day(s)
                    </p>
                  )}
                  {impact.below_75 && (
                    <div className="alert alert-error" style={{margin:0, padding:'0.5rem 0.75rem', fontSize:'0.85rem'}}>
                      {'\u26A0\uFE0F'} {impact.message}
                    </div>
                  )}
                  {!impact.below_75 && impact.message && (
                    <div className="alert alert-info" style={{margin:0, padding:'0.5rem 0.75rem', fontSize:'0.85rem'}}>
                      {impact.message}
                    </div>
                  )}
                  <details style={{marginTop:'0.75rem',cursor:'pointer'}}>
                    <summary style={{fontSize:'0.8rem',color:'#64748b',fontWeight:600}}>{'\uD83D\uDCA1'} How is this calculated?</summary>
                    <div style={{fontSize:'0.78rem',color:'#475569',lineHeight:1.8,marginTop:'0.5rem',padding:'0.5rem',background:'#f8fafc',borderRadius:'8px'}}>
                      <div><strong>Step 1:</strong> Current attendance = <code>attended / total</code> = {impact.current_attendance}%</div>
                      <div><strong>Step 2:</strong> Est. classes/day = <code>total_classes / 180</code> (semester length)</div>
                      <div><strong>Step 3:</strong> Missed classes = {impact.estimated_days} days × est. classes/day = ~{impact.missed_classes}</div>
                      <div><strong>Step 4:</strong> New total = current total + missed classes</div>
                      <div><strong>Step 5:</strong> New attendance = <code>attended / new total</code> = {impact.predicted_attendance}%</div>
                      <div style={{marginTop:'0.35rem',color:'#64748b'}}>75% is the minimum required attendance threshold.</div>
                    </div>
                  </details>
                </div>
              )}
              {impact?.unavailable && <p style={{color:'#64748b',fontSize:'0.85rem'}}>{impact.message}</p>}
            </div>,
            loading.impact,
            checkAttendance
          )}

          {(user.role === 'faculty' || user.role === 'admin') && card('Today\'s Absentees', '\uD83D\uDC65',
            absentees ? (
              absentees.length > 0 ? (
                <div>
                  <p style={{fontSize:'0.85rem',color:'#475569',marginBottom:'0.5rem'}}>
                    {absentees.length} student(s) on approved leave today:
                  </p>
                  {absentees.map((a, i) => (
                    <div key={i} className="ai-suggestion" style={{fontSize:'0.85rem',padding:'0.5rem 0.75rem'}}>
                      <strong>{a.name}</strong> ({a.student_year}) — {a.leave_type}: {a.reason}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{color:'#16a34a',fontWeight:600}}>{'\u2705'} No students absent today.</p>
              )
            ) : (
              <p style={{color:'#64748b',fontSize:'0.9rem'}}>Click "Run" to see today's absentees.</p>
            ),
            loading.absentees,
            user.role === 'student' ? null : loadAbsentees
          )}
        </div>

        <div>
          {card('Academic Calendar', '\uD83D\uDCC5',
            holidays ? (
              holidays.length > 0 ? (
                <div>
                  {holidays.filter(h => h.type !== 'exam').map((h, i) => (
                    <div key={i} className="ai-suggestion" style={{display:'flex',justifyContent:'space-between',fontSize:'0.85rem',padding:'0.5rem 0.75rem'}}>
                      <span><strong>{new Date(h.date).toLocaleDateString('en-IN', {day:'numeric', month:'short', year:'numeric'})}</strong> — {h.name}</span>
                      <span className={`role-badge ${h.type === 'national' ? 'admin' : h.type === 'festival' ? 'faculty' : 'student'}`} style={{fontSize:'0.55rem'}}>{h.type}</span>
                    </div>
                  ))}
                  {holidays.filter(h => h.type === 'exam').length > 0 && (
                    <div style={{marginTop:'0.75rem'}}>
                      <strong style={{fontSize:'0.85rem',color:'#dc2626'}}>{'\uD83D\uDCDD'} Exam Dates:</strong>
                      {holidays.filter(h => h.type === 'exam').map((h, i) => (
                        <div key={i} style={{fontSize:'0.85rem',color:'#475569',padding:'0.25rem 0'}}>
                          {new Date(h.date).toLocaleDateString('en-IN', {day:'numeric', month:'short', year:'numeric'})} — {h.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p style={{color:'#64748b'}}>No upcoming holidays found.</p>
              )
            ) : (
              <p style={{color:'#64748b',fontSize:'0.9rem'}}>Click "Run" to view upcoming holidays and exam dates.</p>
            ),
            loading.holidays,
            loadHolidays
          )}

          <div className="card ai-panel">
            <div className="card-header">
              <h2>{'\uD83D\uDCA1'} Pro Tips</h2>
            </div>
            <ul style={{paddingLeft:'1.25rem',fontSize:'0.85rem',color:'#475569',lineHeight:2}}>
              <li>Check attendance impact <strong>before</strong> submitting a leave</li>
              <li>Use reason templates for faster submission</li>
              <li>Monitor your attendance to stay above 75%</li>
              <li>Faculty: use bulk approval for multiple leaves at once</li>
              <li>Check the academic calendar before planning leaves</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
