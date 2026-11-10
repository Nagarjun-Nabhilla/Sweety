import { useAuth } from '../AuthContext.jsx';

export default function Home() {
  const { user, logout } = useAuth();
  return (
    <div className="card">
      <h1>Sweety</h1>
      <p>Hello, {user.name}!</p>
      <button onClick={logout}>Log out</button>
    </div>
  );
}
