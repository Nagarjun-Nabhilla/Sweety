// The app runs on India time, so "today" is the current date in India.
export const APP_TIMEZONE = 'Asia/Kolkata';

// Returns today's date as 'YYYY-MM-DD' (the en-CA locale formats dates that way).
export const todayInIndia = () => new Intl.DateTimeFormat('en-CA', { timeZone: APP_TIMEZONE }).format(new Date());

export function isValidDate(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !isNaN(d) && d.toISOString().slice(0, 10) === s; // rejects e.g. 2026-02-30
}
