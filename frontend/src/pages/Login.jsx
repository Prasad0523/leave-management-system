import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
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
          <h1>Welcome Back</h1>
          <p className="login-card-sub">Sign in to your account</p>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="login-field">
              <svg className="login-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" required />
            </div>
            <div className="login-field">
              <svg className="login-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />
            </div>
            <button type="submit" className="login-submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
        <div className="login-card-footer">
          Don't have an account? <Link to="/register">Register</Link>
        </div>
      </div>
    </div>
  );
}
