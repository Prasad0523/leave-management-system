import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'student', department: '', student_year: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const departments = ['Computer Engineering', 'Mechanical Engineering', 'Electrical Engineering', 'Civil Engineering', 'Electronics Engineering'];
  const years = ['FE', 'SE', 'TE', 'BE'];

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      await register({
        name: form.name, email: form.email, password: form.password,
        role: form.role, department: form.department,
        student_year: form.student_year || undefined
      });
      setSuccess('Registration submitted for approval. You will be able to login once approved by faculty.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg-shapes">
        <div className="login-shape s1"></div>
        <div className="login-shape s2"></div>
        <div className="login-shape s3"></div>
      </div>
      <div className="login-card">
        <div className="login-card-header">
          <div className="login-card-logo">
            <svg viewBox="0 0 100 100" fill="none"><path d="M30 55 L50 35 L70 55" stroke="#2563eb" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/><path d="M38 55 L38 68 L62 68 L62 55" stroke="#2563eb" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <h2>Adsul's Technical Campus</h2>
          <p className="login-card-trust">Sakeshwar Gramin Vikas Seva Sanstha's</p>
          <div className="login-card-badges">
            <span>AICTE</span><span>SPPU Pune</span><span>NAAC B++</span>
          </div>
        </div>
        <div className="login-card-body">
          <h1>Create Account</h1>
          <p className="login-card-sub">Join Adsul's Technical Campus Leave Management</p>
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}
          <form onSubmit={handleSubmit}>
            <div className="login-field">
              <svg className="login-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <input name="name" value={form.name} onChange={handleChange} placeholder="Full name" required />
            </div>
            <div className="login-field">
              <svg className="login-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="Email address" required />
            </div>
            <div className="login-field" style={{display:'flex',gap:'0.5rem',flexWrap:'wrap'}}>
              <div style={{flex:1}}>
                <select name="role" value={form.role} onChange={handleChange} style={{width:'100%',padding:'0.75rem 0.85rem 0.75rem 0.85rem',border:'2px solid #e2e8f0',borderRadius:'12px',fontSize:'0.88rem',background:'#f8fafc',outline:'none'}}>
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                </select>
              </div>
              <div style={{flex:1}}>
                <select name="department" value={form.department} onChange={handleChange} style={{width:'100%',padding:'0.75rem 0.85rem',border:'2px solid #e2e8f0',borderRadius:'12px',fontSize:'0.88rem',background:'#f8fafc',outline:'none'}}>
                  <option value="">Department</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            {form.role === 'student' && (
              <div className="login-field">
                <select name="student_year" value={form.student_year} onChange={handleChange} style={{width:'100%',padding:'0.75rem 0.85rem',border:'2px solid #e2e8f0',borderRadius:'12px',fontSize:'0.88rem',background:'#f8fafc',outline:'none'}}>
                  <option value="">Select year</option>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            )}
            <div className="login-field">
              <svg className="login-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="Password" required />
            </div>
            <div className="login-field">
              <svg className="login-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="Confirm password" required />
            </div>
            <button type="submit" className="login-submit" disabled={loading}>
              {loading ? 'Submitting...' : 'Create Account'}
            </button>
          </form>
        </div>
        <div className="login-card-footer">
          {success ? (
            <Link to="/login">Go to Sign In</Link>
          ) : (
            <>Already have an account? <Link to="/login">Sign In</Link></>
          )}
        </div>
      </div>
    </div>
  );
}
