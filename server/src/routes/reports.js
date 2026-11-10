import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { todayInIndia, isValidDate } from '../time.js';

const router = Router();
router.use(requireAuth);

const toISO = (d) => d.toISOString().slice(0, 10);

// Works out the 3 date ranges from the selected date (all as 'YYYY-MM-DD').
function ranges(date) {
  const [y, m] = date.split('-').map(Number);
  const monthStart = `${date.slice(0, 7)}-01`;
  const prevStart = toISO(new Date(Date.UTC(y, m - 2, 1))); // 1st of previous month
  const prevEnd = toISO(new Date(Date.UTC(y, m - 1, 0))); // day 0 = last day of previous month
  return {
    daily: [date, date],
    monthToDate: [monthStart, date],
    monthly: [prevStart, prevEnd],
  };
}

// Highest / lowest / average (all rounded to 1 decimal) and count for one user and date range.
async function stats(userId, [from, to]) {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS count,
            ROUND(MAX(value), 1) AS highest,
            ROUND(MIN(value), 1) AS lowest,
            ROUND(AVG(value), 1) AS average
     FROM readings
     WHERE user_id = $1 AND reading_date BETWEEN $2 AND $3`,
    [userId, from, to]
  );
  return { from, to, ...rows[0] };
}

// GET /api/reports?date=YYYY-MM-DD
router.get('/', async (req, res) => {
  const { date } = req.query;
  if (!isValidDate(date)) return res.status(400).json({ error: 'Please choose a valid date.' });
  if (date > todayInIndia()) return res.status(400).json({ error: 'Date cannot be in the future.' });

  const r = ranges(date);
  const [daily, monthToDate, monthly, list] = await Promise.all([
    stats(req.userId, r.daily),
    stats(req.userId, r.monthToDate),
    stats(req.userId, r.monthly),
    pool.query(
      `SELECT slot, ROUND(value, 1) AS value FROM readings
       WHERE user_id = $1 AND reading_date = $2
       ORDER BY array_position(ARRAY['morning','after_breakfast','after_lunch','after_dinner'], slot)`,
      [req.userId, date]
    ),
  ]);
  daily.readings = list.rows;
  res.json({ daily, monthToDate, monthly });
});

export default router;
