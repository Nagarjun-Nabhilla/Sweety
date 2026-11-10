// Creates the "sweety" database (if missing) and its tables. Never deletes anything.
import 'dotenv/config';
import fs from 'node:fs/promises';
import pg from 'pg';

const { PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE } = process.env;
const conn = { host: PGHOST, port: Number(PGPORT), user: PGUSER, password: PGPASSWORD };

if (!/^[a-z_][a-z0-9_]*$/.test(PGDATABASE)) throw new Error('Invalid PGDATABASE name');

try {
  const admin = new pg.Client({ ...conn, database: 'postgres' });
  await admin.connect();
  const { rowCount } = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [PGDATABASE]);
  if (rowCount === 0) {
    await admin.query(`CREATE DATABASE ${PGDATABASE}`);
    console.log(`Created database "${PGDATABASE}"`);
  } else {
    console.log(`Database "${PGDATABASE}" already exists`);
  }
  await admin.end();

  const db = new pg.Client({ ...conn, database: PGDATABASE });
  await db.connect();
  await db.query(await fs.readFile(new URL('../db/schema.sql', import.meta.url), 'utf8'));
  await db.end();
  console.log('Tables ready');
} catch (err) {
  if (err.code === '28P01') console.error('Wrong PostgreSQL password. Fix PGPASSWORD in server/.env');
  else console.error(err.message);
  process.exit(1);
}
