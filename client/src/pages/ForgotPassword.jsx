import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const data = await api('/auth/forgot-password', { method: 'POST', body: { email } });
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
      <h2>Forgot password</h2>
      {message ? (
        <>
          <p>{message}</p>
          <p className="muted">Demo version: the link is printed in the server's terminal instead of being emailed.</p>
        </>
      ) : (
        <form onSubmit={onSubmit}>
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          {error && <p className="error">{error}</p>}
          <button disabled={busy}>{busy ? 'Please wait…' : 'Get reset link'}</button>
        </form>
      )}
      <p><Link to="/login">Back to log in</Link></p>
    </div>
  );
}
