import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';

// Opened from the reset link: /reset-password?token=...
export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8 || form.password.length > 72) return setError('Password must be 8-72 characters');
    if (form.password !== form.confirm) return setError('Passwords do not match');
    setError('');
    setBusy(true);
    try {
      const data = await api('/auth/reset-password', { method: 'POST', body: { token, password: form.password } });
      setMessage(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card">
      <h1>Sweety</h1>
      <h2>Set a new password</h2>
      {!token ? (
        <p className="error">This reset link is incomplete. Please request a new one.</p>
      ) : message ? (
        <p>{message}</p>
      ) : (
        <form onSubmit={onSubmit} noValidate>
          <label>
            New password
            <input name="password" type="password" value={form.password} onChange={onChange} />
          </label>
          <label>
            Confirm new password
            <input name="confirm" type="password" value={form.confirm} onChange={onChange} />
          </label>
          {error && <p className="error">{error}</p>}
          <button disabled={busy}>{busy ? 'Saving…' : 'Update password'}</button>
        </form>
      )}
      <p><Link to="/login">Back to log in</Link></p>
    </div>
  );
}
