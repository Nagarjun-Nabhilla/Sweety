// Creates a demo user with sample readings. Safe to re-run: it only replaces the demo user's own readings.
import 'dotenv/config'; // must stay first: db.js reads the env when it loads
import bcrypt from 'bcrypt';
import { pool } from '../src/db.js';
import { todayInIndia } from '../src/time.js';

const NAME = 'Demo User';
const EMAIL = 'demo@sweety.test';
const PASSWORD = 'demo1234';
const DAYS = 90;
const SKIP_CHANCE = 0.1; // some readings are missed, like real data

// Typical mg/dl range for each slot.
const RANGES = {
  morning: [75, 135],
  after_breakfast: [110, 190],
  after_lunch: [120, 210],
  after_dinner: [115, 200],
};

// Protects other databases on this PostgreSQL server, and keeps a known password out of production.
if (process.env.PGDATABASE !== 'sweety') throw new Error('Seed only runs against the "sweety" database');
if (process.env.NODE_ENV === 'production') throw new Error('Seed must not run in production');

const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

function sampleReadings() {
  const today = new Date(`${todayInIndia()}T00:00:00Z`);
  const dates = [], slots = [], values = [];
  for (let i = 0; i < DAYS; i++) {
    const date = new Date(today.getTime() - i * 86_400_000).toISOString().slice(0, 10);
    for (const [slot, [min, max]] of Object.entries(RANGES)) {
      if (Math.random() < SKIP_CHANCE) continue;
      dates.push(date);
      slots.push(slot);
      values.push(randomBetween(min, max));
    }
  }
  return { dates, slots, values };
}

try {
  const hash = await bcrypt.hash(PASSWORD, 12);
  const { dates, slots, values } = sampleReadings();

  const client = await pool.connect();
  await client.query('BEGIN'); // all or nothing: a failure leaves the database unchanged
  const { rows } = await client.query(
    `INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3)
     ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash
     RETURNING id`,
    [NAME, EMAIL, hash]
  );
  const userId = rows[0].id;
  await client.query('DELETE FROM readings WHERE user_id = $1', [userId]);
  await client.query(
    `INSERT INTO readings (user_id, reading_date, slot, value)
     SELECT $1, d, s, v FROM unnest($2::date[], $3::text[], $4::numeric[]) AS t(d, s, v)`,
    [userId, dates, slots, values]
  );
  await client.query('COMMIT');
  client.release();
  await pool.end();

  console.log(`Seeded ${values.length} readings over ${DAYS} days`);
  console.log(`Login: ${EMAIL} / ${PASSWORD}`);
} catch (err) {
  if (err.code === '28P01') console.error('Wrong PostgreSQL password. Fix PGPASSWORD in server/.env');
  else if (err.code === '42P01' || err.code === '3D000') console.error('Database or tables missing. Run: npm run db:setup');
  else console.error(err.message);
  process.exit(1);
}
