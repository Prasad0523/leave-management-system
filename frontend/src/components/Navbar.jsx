import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/api';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const menuRef = useRef();

  useEffect(() => {
    if (user && ['faculty', 'admin'].includes(user.role)) {
      authApi.getPendingRegistrations().then(data => setPendingCount(data.length)).catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    const handleClick = (e) => {
      if (mobileOpen && menuRef.current && !menuRef.current.contains(e.target)) {
        setMobileOpen(false);
      }
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [mobileOpen]);

  const isActive = (path) => location.pathname === path ? 'active' : '';

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', show: true },
    { to: '/leave-request', label: 'New Leave', show: true },
    { to: '/my-leaves', label: 'My Leaves', show: true },
    { to: '/pending-approvals', label: 'Approvals', show: user.role === 'faculty' || user.role === 'admin' },
    { to: '/admin', label: 'Admin', show: user.role === 'admin' },
    { to: '/pending-registrations', label: 'Registrations', show: user.role === 'faculty' || user.role === 'admin', badge: pendingCount },
    { to: '/ai-assistant', label: 'AI Assistant', show: true },
  ];

  return (
    <div className="navbar-wrapper">
      <div className="navbar-top">
        <div className="navbar-top-inner">
          <div className="navbar-top-center">
            <div className="college-text">
              <span className="trust-name">Sakeshwar Gramin Vikas Seva Sanstha's</span>
              <span className="college-name">ADSUL'S TECHNICAL CAMPUS</span>
            </div>
            <div className="navbar-top-badges">
              <span className="accred-badge">AICTE</span>
              <span className="accred-badge">SPPU Pune</span>
              <span className="accred-badge">NAAC B++</span>
            </div>
          </div>
          <button className="hamburger" onClick={() => setMobileOpen(!mobileOpen)}>
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>
      <nav className="navbar-bottom">
        <div className="navbar-bottom-inner">
          <div className="navbar-nav">
            {navLinks.filter(l => l.show).map(link => (
              <Link key={link.to} to={link.to} className={isActive(link.to)} onClick={() => setMobileOpen(false)} style={{position:'relative'}}>
                <span>{link.label}</span>
                {link.badge > 0 && <span className="navbar-badge">{link.badge}</span>}
              </Link>
            ))}
          </div>
          <div className="navbar-user">
            <Link to="/profile" className="navbar-avatar" style={{textDecoration:'none',display:'flex',alignItems:'center',justifyContent:'center'}}>{user.name.charAt(0)}</Link>
            <Link to="/profile" style={{textDecoration:'none'}}><span className="user-name">{user.name}</span></Link>
            <span className={`role-badge ${user.role}`}>{user.role}</span>
            <button onClick={logout} className="logout-btn">Logout</button>
          </div>
        </div>
      </nav>
      {mobileOpen && (
        <div className="mobile-menu" ref={menuRef}>
          {navLinks.filter(l => l.show).map(link => (
            <Link key={link.to} to={link.to} className={isActive(link.to)} onClick={() => setMobileOpen(false)} style={{position:'relative'}}>
              {link.label}
              {link.badge > 0 && <span className="navbar-badge">{link.badge}</span>}
            </Link>
          ))}
          <div className="mobile-menu-user">
            <Link to="/profile" onClick={() => setMobileOpen(false)}>{user.name}</Link>
            <span className={`role-badge ${user.role}`}>{user.role}</span>
            <button onClick={logout}>Logout</button>
          </div>
        </div>
      )}
    </div>
  );
}
