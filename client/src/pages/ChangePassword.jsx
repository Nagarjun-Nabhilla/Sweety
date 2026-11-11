import { useState } from 'react';
import Header from '../components/Header.jsx';
import { api } from '../api.js';

const EMPTY = { currentPassword: '', newPassword: '', confirm: '' };

export default function ChangePassword() {
  const [form, setForm] = useState(EMPTY);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    if (!form.currentPassword) return setError('Current password is required');
    if (form.newPassword.length < 8 || form.newPassword.length > 72) return setError('New password must be 8-72 characters');
    if (form.newPassword !== form.confirm) return setError('New passwords do not match');
    setError('');
    setBusy(true);
    try {
      const { currentPassword, newPassword } = form;
      const data = await api('/auth/change-password', { method: 'POST', body: { currentPassword, newPassword } });
      setMessage(data.message);
      setForm(EMPTY);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <Header />
      <section className="card">
        <h2>Change password</h2>
        <form onSubmit={onSubmit} noValidate>
          <label>
            Current password
            <input name="currentPassword" type="password" value={form.currentPassword} onChange={onChange} />
          </label>
          <label>
            New password
            <input name="newPassword" type="password" value={form.newPassword} onChange={onChange} />
          </label>
          <label>
            Confirm new password
            <input name="confirm" type="password" value={form.confirm} onChange={onChange} />
          </label>
          {error && <p className="error">{error}</p>}
          {message && <p>{message}</p>}
          <button disabled={busy}>{busy ? 'Saving…' : 'Change password'}</button>
        </form>
      </section>
    </div>
  );
}
