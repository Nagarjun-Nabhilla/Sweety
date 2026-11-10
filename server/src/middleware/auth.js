import jwt from 'jsonwebtoken';

export function signToken(user) {
  return jwt.sign({}, process.env.JWT_SECRET, { subject: String(user.id), expiresIn: '7d' });
}

// Protects a route: requires "Authorization: Bearer <token>" and sets req.userId.
// Every query for user data must filter by req.userId so users only see their own data.
export function requireAuth(req, res, next) {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) return res.status(401).json({ error: 'Not logged in' });
  try {
    req.userId = Number(jwt.verify(token, process.env.JWT_SECRET).sub);
    next();
  } catch {
    res.status(401).json({ error: 'Session expired, please log in again' });
  }
}
