import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

// One form for both Log in and Sign up.
export default function AuthForm({ mode }) {
  const isRegister = mode === 'register';
  const { login, register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (isRegister) await register(form.name, form.email, form.password);
      else await login(form.email, form.password);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="card">
      <h1>Sweety</h1>
      <h2>{isRegister ? 'Create account' : 'Log in'}</h2>
      <form onSubmit={onSubmit}>
        {isRegister && (
          <label>
            Name
            <input name="name" value={form.name} onChange={onChange} required />
          </label>
        )}
        <label>
          Email
          <input name="email" type="email" value={form.email} onChange={onChange} required />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={onChange}
            minLength={isRegister ? 8 : undefined}
            required
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button disabled={busy}>{busy ? 'Please wait…' : isRegister ? 'Sign up' : 'Log in'}</button>
      </form>
      <p>
        {isRegister ? 'Have an account? ' : 'New here? '}
        <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Log in' : 'Sign up'}</Link>
      </p>
    </div>
  );
}
