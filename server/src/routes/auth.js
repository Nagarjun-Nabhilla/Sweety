import { Router } from 'express';
import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import { pool } from '../db.js';
import { signToken, requireAuth } from '../middleware/auth.js';

const router = Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESET_MINUTES = 30;
const PASSWORD_ERROR = 'Password must be 8-72 characters';
const isValidPassword = (p) => typeof p === 'string' && p.length >= 8 && p.length <= 72;
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

router.post('/register', async (req, res) => {
  const name = req.body?.name?.trim();
  const email = req.body?.email?.trim().toLowerCase();
  const password = req.body?.password;

  if (!name) return res.status(400).json({ error: 'Name is required' });
  if (!email || !EMAIL_RE.test(email)) return res.status(400).json({ error: 'Valid email is required' });
  if (!isValidPassword(password)) return res.status(400).json({ error: PASSWORD_ERROR });

  const hash = await bcrypt.hash(password, 12); // only the hash is stored
  try {
    const { rows } = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name, email, hash]
    );
    res.status(201).json({ token: signToken(rows[0]), user: rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email is already registered' });
    throw err;
  }
});

router.post('/login', async (req, res) => {
  const email = req.body?.email?.trim().toLowerCase();
  const password = req.body?.password;
  if (!email || typeof password !== 'string') {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const { rows } = await pool.query('SELECT id, name, email, password_hash FROM users WHERE email = $1', [email]);
  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  res.json({ token: signToken(user), user: { id: user.id, name: user.name, email: user.email } });
});

router.get('/me', requireAuth, async (req, res) => {
  const { rows } = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [req.userId]);
  if (!rows[0]) return res.status(401).json({ error: 'Not logged in' });
  res.json({ user: rows[0] });
});

// Creates a one-time reset link. The reply is the same whether or not the email is registered,
// so nobody can use this to find out who has an account.
router.post('/forgot-password', async (req, res) => {
  const email = req.body?.email?.trim().toLowerCase();
  if (!email || !EMAIL_RE.test(email)) return res.status(400).json({ error: 'Valid email is required' });

  const { rows } = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (rows[0]) {
    const token = crypto.randomBytes(32).toString('hex');
    await pool.query('DELETE FROM password_resets WHERE user_id = $1 AND used_at IS NULL', [rows[0].id]);
    await pool.query(
      `INSERT INTO password_resets (user_id, token_hash, expires_at)
       VALUES ($1, $2, now() + make_interval(mins => $3))`,
      [rows[0].id, sha256(token), RESET_MINUTES]
    );
    // Demo only: a real app would email this link instead of printing it.
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    console.log(`Password reset link for ${email} (valid ${RESET_MINUTES} min): ${clientUrl}/reset-password?token=${token}`);
  }
  res.json({ message: 'If that email is registered, a reset link has been created.' });
});

// Sets a new password using a reset link. Each link works once and only before it expires.
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body ?? {};
  if (typeof token !== 'string' || !token) return res.status(400).json({ error: 'Reset link is missing its token' });
  if (!isValidPassword(password)) return res.status(400).json({ error: PASSWORD_ERROR });

  const hash = await bcrypt.hash(password, 12);
  // Marks the link used and changes the password in one statement, so a link can't be used twice.
  const { rowCount } = await pool.query(
    `WITH t AS (
       UPDATE password_resets SET used_at = now()
       WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now()
       RETURNING user_id
     )
     UPDATE users SET password_hash = $2 FROM t WHERE users.id = t.user_id`,
    [sha256(token), hash]
  );
  if (!rowCount) return res.status(400).json({ error: 'This reset link is invalid or has expired. Please request a new one.' });
  res.json({ message: 'Password updated. You can now log in.' });
});

// Logged-in user changes their password. The current password is required.
router.post('/change-password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body ?? {};
  if (typeof currentPassword !== 'string' || !currentPassword) {
    return res.status(400).json({ error: 'Current password is required' });
  }
  if (!isValidPassword(newPassword)) return res.status(400).json({ error: `New ${PASSWORD_ERROR.toLowerCase()}` });

  const { rows } = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.userId]);
  if (!rows[0] || !(await bcrypt.compare(currentPassword, rows[0].password_hash))) {
    return res.status(400).json({ error: 'Current password is incorrect' });
  }
  if (currentPassword === newPassword) {
    return res.status(400).json({ error: 'New password must be different from the current one' });
  }
  await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [await bcrypt.hash(newPassword, 12), req.userId]);
  res.json({ message: 'Password changed.' });
});

export default router;
