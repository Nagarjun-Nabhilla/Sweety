import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { todayInIndia, isValidDate } from '../time.js';

const SLOTS = {
  morning: 'Morning (fasting)',
  after_breakfast: 'After breakfast',
  after_lunch: 'After lunch',
  after_dinner: 'After dinner',
};
const SLOT_ORDER = Object.keys(SLOTS);
const MAX_PER_DAY = 4;

const router = Router();
router.use(requireAuth); // every route below needs login; all queries filter by req.userId

const article = (word) => (/^[AEIOU]/i.test(word) ? 'an' : 'a');
const duplicateMessage = (slot) => `You already have ${article(SLOTS[slot])} ${SLOTS[slot]} reading for this date.`;

// Checks the request body. Returns { error } or { reading: { date, slot, value } }.
function parseReading(body = {}) {
  const { date, slot, value } = body;
  if (value === undefined || value === null || String(value).trim() === '') {
    return { error: 'Please enter a glucose value.' };
  }
  const str = String(value).trim();
  const num = Number(str);
  if (!/^\d+(\.\d+)?$/.test(str) || num < 40 || num > 600) {
    return { error: 'Value must be between 40 and 600 mg/dl.' };
  }
  if (!/^\d+(\.\d{1,3})?$/.test(str)) return { error: 'Value can have at most 3 decimal places.' };
  if (!isValidDate(date)) return { error: 'Please choose a valid date.' };
  if (date > todayInIndia()) return { error: 'Date cannot be in the future.' };
  if (!Object.hasOwn(SLOTS, slot)) return { error: 'Please choose a valid time slot.' };
  return { reading: { date, slot, value: num } };
}

// Checks the per-day rules against the user's other readings on that date.
async function checkDayRules(userId, { date, slot }, excludeId = 0) {
  const { rows } = await pool.query(
    'SELECT slot FROM readings WHERE user_id = $1 AND reading_date = $2 AND id <> $3',
    [userId, date, excludeId]
  );
  if (rows.some((r) => r.slot === slot)) return duplicateMessage(slot);
  if (rows.length >= MAX_PER_DAY) return 'You can add only 4 readings per day.';
  return null;
}

const COLUMNS = 'id, reading_date AS date, slot, value';

// '5' -> 5, missing -> default, anything else -> NaN
const intParam = (v, def) => (v === undefined ? def : /^\d+$/.test(v) ? Number(v) : NaN);

// GET /api/readings?date=YYYY-MM-DD   -> readings for one day
// GET /api/readings?page=1&limit=20   -> all readings, newest first, one page at a time
router.get('/', async (req, res) => {
  const { date } = req.query;
  if (date === undefined) return listPage(req, res);
  if (!isValidDate(date)) return res.status(400).json({ error: 'Please choose a valid date.' });
  const { rows } = await pool.query(
    `SELECT ${COLUMNS} FROM readings WHERE user_id = $1 AND reading_date = $2`,
    [req.userId, date]
  );
  rows.sort((a, b) => SLOT_ORDER.indexOf(a.slot) - SLOT_ORDER.indexOf(b.slot));
  res.json({ readings: rows });
});

async function listPage(req, res) {
  const page = intParam(req.query.page, 1);
  const limit = intParam(req.query.limit, 20);
  if (!(page >= 1)) return res.status(400).json({ error: 'page must be a whole number of 1 or more.' });
  if (!(limit >= 1 && limit <= 100)) return res.status(400).json({ error: 'limit must be a whole number from 1 to 100.' });

  const [list, total] = await Promise.all([
    pool.query(
      `SELECT ${COLUMNS} FROM readings
       WHERE user_id = $1
       ORDER BY reading_date DESC,
                array_position(ARRAY['morning','after_breakfast','after_lunch','after_dinner'], slot) DESC
       LIMIT $2 OFFSET $3`,
      [req.userId, limit, (page - 1) * limit]
    ),
    pool.query('SELECT COUNT(*)::int AS n FROM readings WHERE user_id = $1', [req.userId]),
  ]);
  const count = total.rows[0].n;
  res.json({
    readings: list.rows,
    pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
  });
}

router.post('/', async (req, res) => {
  const { error, reading } = parseReading(req.body);
  if (error) return res.status(400).json({ error });
  const conflict = await checkDayRules(req.userId, reading);
  if (conflict) return res.status(409).json({ error: conflict });

  try {
    const { rows } = await pool.query(
      `INSERT INTO readings (user_id, reading_date, slot, value) VALUES ($1, $2, $3, $4) RETURNING ${COLUMNS}`,
      [req.userId, reading.date, reading.slot, reading.value]
    );
    res.status(201).json({ reading: rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: duplicateMessage(reading.slot) });
    throw err;
  }
});

router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const owned = Number.isInteger(id) &&
    (await pool.query('SELECT 1 FROM readings WHERE id = $1 AND user_id = $2', [id, req.userId])).rowCount;
  if (!owned) return res.status(404).json({ error: 'Reading not found.' });

  const { error, reading } = parseReading(req.body);
  if (error) return res.status(400).json({ error });
  const conflict = await checkDayRules(req.userId, reading, id);
  if (conflict) return res.status(409).json({ error: conflict });

  try {
    const { rows } = await pool.query(
      `UPDATE readings SET reading_date = $1, slot = $2, value = $3, updated_at = now()
       WHERE id = $4 AND user_id = $5 RETURNING ${COLUMNS}`,
      [reading.date, reading.slot, reading.value, id, req.userId]
    );
    res.json({ reading: rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: duplicateMessage(reading.slot) });
    throw err;
  }
});

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { rowCount } = Number.isInteger(id)
    ? await pool.query('DELETE FROM readings WHERE id = $1 AND user_id = $2', [id, req.userId])
    : { rowCount: 0 };
  if (!rowCount) return res.status(404).json({ error: 'Reading not found.' });
  res.status(204).end();
});

export default router;
