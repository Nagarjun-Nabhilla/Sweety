import { Router } from 'express';
import bcrypt from 'bcrypt';
import { pool } from '../db.js';
import { signToken, requireAuth } from '../middleware/auth.js';

const router = Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/register', async (req, res) => {
  const name = req.body?.name?.trim();
  const email = req.body?.email?.trim().toLowerCase();
  const password = req.body?.password;

  if (!name) return res.status(400).json({ error: 'Name is required' });
  if (!email || !EMAIL_RE.test(email)) return res.status(400).json({ error: 'Valid email is required' });
  if (typeof password !== 'string' || password.length < 8 || password.length > 72) {
    return res.status(400).json({ error: 'Password must be 8-72 characters' });
  }

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

export default router;
