import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Layout     from './Layout';
import Login      from './pages/Login';
import Dashboard  from './pages/Dashboard';
import Employees  from './pages/Employees';
import Attendance from './pages/Attendance';
import Payroll    from './pages/Payroll';
import Reports    from './pages/Reports';

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',color:'var(--text-muted)'}}>Loading…</div>;
  if (!user)   return <Navigate to="/login" replace />;
  if (adminOnly && user.role === 'employee') return <Navigate to="/attendance" replace />;
  return <Layout>{children}</Layout>;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return (
    <Routes>
      <Route path="/login"      element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/dashboard"  element={<ProtectedRoute adminOnly><Dashboard /></ProtectedRoute>} />
      <Route path="/employees"  element={<ProtectedRoute adminOnly><Employees /></ProtectedRoute>} />
      <Route path="/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
      <Route path="/payroll"    element={<ProtectedRoute><Payroll /></ProtectedRoute>} />
      <Route path="/reports"    element={<ProtectedRoute adminOnly><Reports /></ProtectedRoute>} />
      <Route path="*"           element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
    </Routes>
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
