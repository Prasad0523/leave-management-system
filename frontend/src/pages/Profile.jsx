import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user } = useAuth();

  const info = [
    { label: 'Name', value: user.name },
    { label: 'Email', value: user.email },
    { label: 'Role', value: user.role.charAt(0).toUpperCase() + user.role.slice(1) },
    { label: 'Department', value: user.department || '-' },
    { label: 'Year', value: user.student_year || '-' },
  ];

  if (user.role === 'student') {
    info.push(
      { label: 'Total Classes', value: user.total_classes },
      { label: 'Attended', value: user.attended_classes },
      {
        label: 'Attendance',
        value: user.total_classes > 0
          ? `${Math.round((user.attended_classes / user.total_classes) * 100)}%`
          : 'N/A'
      },
      { label: 'Parent Email', value: user.parent_email || '-' }
    );
  }

  const colors = { student: '#10b981', faculty: '#8b5cf6', admin: '#ef4444' };

  return (
    <div className="container" style={{maxWidth:'600px'}}>
      <div className="page-header">
        <h1>My Profile</h1>
      </div>
      <div className="card" style={{textAlign:'center',marginBottom:'1.5rem'}}>
        <div style={{
          width:'80px',height:'80px',borderRadius:'50%',
          background: `linear-gradient(135deg, ${colors[user.role]} 0%, ${colors[user.role]}cc 100%)`,
          display:'flex',alignItems:'center',justifyContent:'center',
          fontSize:'2rem',fontWeight:700,color:'white',margin:'0 auto 1rem',
          boxShadow: `0 4px 20px ${colors[user.role]}44`
        }}>
          {user.name.charAt(0)}
        </div>
        <h2 style={{marginBottom:'0.25rem'}}>{user.name}</h2>
        <span className={`role-badge ${user.role}`} style={{fontSize:'0.7rem'}}>{user.role}</span>
      </div>
      <div className="card">
        {info.map((item, i) => (
          <div key={i} style={{
            display:'flex',justifyContent:'space-between',padding:'0.85rem 0',
            borderBottom: i < info.length - 1 ? '1px solid #f1f5f9' : 'none'
          }}>
            <span style={{fontWeight:500,color:'#475569',fontSize:'0.9rem'}}>{item.label}</span>
            <span style={{fontWeight:600,color:'#0f172a',fontSize:'0.9rem'}}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
