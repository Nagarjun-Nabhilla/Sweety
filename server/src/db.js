import pg from 'pg';

// Return DATE columns as plain 'YYYY-MM-DD' strings (not JS Dates, which shift with timezones).
pg.types.setTypeParser(1082, (v) => v);
// Return NUMERIC columns as JS numbers (pg returns them as strings by default).
pg.types.setTypeParser(1700, parseFloat);

export const pool = new pg.Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT),
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
});
