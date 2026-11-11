import { NavLink } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

export default function Header() {
  const { user, logout } = useAuth();
  return (
    <header className="bar">
      <h1>Sweety</h1>
      <nav>
        <NavLink to="/" end>Readings</NavLink>
        <NavLink to="/history">History</NavLink>
        <NavLink to="/reports">Reports</NavLink>
        <NavLink to="/change-password">Password</NavLink>
      </nav>
      <span>
        {user.name} <button className="link" onClick={logout}>Log out</button>
      </span>
    </header>
  );
}
