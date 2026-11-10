import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import AuthForm from './pages/AuthForm.jsx';
import Home from './pages/Home.jsx';
import Reports from './pages/Reports.jsx';

export default function App() {
  const { user, loading } = useAuth();
  if (loading) return <p className="center">Loading…</p>;

  return (
    <Routes>
      <Route path="/" element={user ? <Home /> : <Navigate to="/login" />} />
      <Route path="/reports" element={user ? <Reports /> : <Navigate to="/login" />} />
      <Route path="/login"element={user ? <Navigate to="/" /> : <AuthForm mode="login" />} />
      <Route path="/register" element={user ? <Navigate to="/" /> : <AuthForm mode="register" />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
