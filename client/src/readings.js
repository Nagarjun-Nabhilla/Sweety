export const SLOTS = [
  { key: 'morning', label: 'Morning (fasting)' },
  { key: 'after_breakfast', label: 'After breakfast' },
  { key: 'after_lunch', label: 'After lunch' },
  { key: 'after_dinner', label: 'After dinner' },
];
export const slotLabel = (key) => SLOTS.find((s) => s.key === key)?.label ?? key;

// Today's date in India as 'YYYY-MM-DD'.
export const todayInIndia = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());

// Quick checks before sending. The server re-checks everything, including the per-day rules.
export function validateReading({ value, date }) {
  if (String(value).trim() === '') return 'Please enter a glucose value.';
  const str = String(value).trim();
  const n = Number(str);
  if (/^\d+\.\d*$/.test(str)) return 'Value must be a whole number.';
  if (!/^\d+$/.test(str) || n < 40 || n > 600) return 'Value must be between 40 and 600 mg/dl.';
  if (!date) return 'Please choose a valid date.';
  if (date > todayInIndia()) return 'Date cannot be in the future.';
  return null;
}
