import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import LeaveRequest from './pages/LeaveRequest';
import MyLeaves from './pages/MyLeaves';
import PendingApprovals from './pages/PendingApprovals';
import AdminPanel from './pages/AdminPanel';
import AIAssistant from './pages/AIAssistant';
import Profile from './pages/Profile';
import PendingRegistrations from './pages/PendingRegistrations';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading"><div className="spinner"></div></div>;
  return user ? children : <Navigate to="/login" />;
}

function RoleRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading"><div className="spinner"></div></div>;
  if (!user) return <Navigate to="/login" />;
  if (!roles.includes(user.role)) return <Navigate to="/dashboard" />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <>
      {user && <Navbar />}
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/leave-request" element={<PrivateRoute><LeaveRequest /></PrivateRoute>} />
        <Route path="/my-leaves" element={<PrivateRoute><MyLeaves /></PrivateRoute>} />
        <Route path="/pending-approvals" element={<PrivateRoute><PendingApprovals /></PrivateRoute>} />
        <Route path="/admin" element={<RoleRoute roles={['admin']}><AdminPanel /></RoleRoute>} />
        <Route path="/ai-assistant" element={<PrivateRoute><AIAssistant /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/pending-registrations" element={<RoleRoute roles={['faculty', 'admin']}><PendingRegistrations /></RoleRoute>} />
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
