import { NavLink } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

export default function Header() {
  const { user, logout } = useAuth();
  return (
    <header className="bar">
      <h1>Sweety</h1>
      <nav>
        <NavLink to="/" end>Readings</NavLink>
        <NavLink to="/reports">Reports</NavLink>
      </nav>
      <span>
        {user.name} <button className="link" onClick={logout}>Log out</button>
      </span>
    </header>
  );
}
