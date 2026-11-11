import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import AuthForm from './pages/AuthForm.jsx';
import Home from './pages/Home.jsx';
import Reports from './pages/Reports.jsx';
import History from './pages/History.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import ChangePassword from './pages/ChangePassword.jsx';

export default function App() {
  const { user, loading } = useAuth();
  if (loading) return <p className="center">Loading…</p>;

  return (
    <Routes>
      <Route path="/" element={user ? <Home /> : <Navigate to="/login" />} />
      <Route path="/history" element={user ? <History /> : <Navigate to="/login" />} />
      <Route path="/reports"element={user ? <Reports /> : <Navigate to="/login" />} />
      <Route path="/login"element={user ? <Navigate to="/" /> : <AuthForm mode="login" />} />
      <Route path="/register" element={user ? <Navigate to="/" /> : <AuthForm mode="register" />} />
      <Route path="/forgot-password" element={user ? <Navigate to="/" /> : <ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/change-password" element={user ? <ChangePassword /> : <Navigate to="/login" />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
