import 'dotenv/config';
import express from 'express';
import authRoutes from './routes/auth.js';
import readingRoutes from './routes/readings.js';
import reportRoutes from './routes/reports.js';

if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET missing in server/.env');

const app = express();
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/readings', readingRoutes);
app.use('/api/reports', reportRoutes);

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
