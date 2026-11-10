import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { SLOTS } from '../readings.js';

const COLORS = { morning: '#d6336c', after_breakfast: '#1c7ed6', after_lunch: '#2b8a3e', after_dinner: '#e8590c' };

// One row per day of the month: { day: 1, morning: 110, after_lunch: 145, ... }
function buildRows({ to, readings }) {
  const lastDay = Number(to.slice(8, 10));
  const rows = Array.from({ length: lastDay }, (_, i) => ({ day: i + 1 }));
  for (const r of readings) rows[Number(r.date.slice(8, 10)) - 1][r.slot] = r.value;
  return rows;
}

export default function MonthChart({ chart }) {
  const title = new Date(`${chart.from}T00:00:00Z`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  return (
    <section className="card wide">
      <h2>{title}</h2>
      {chart.readings.length === 0 ? (
        <p className="empty">No readings this month yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={buildRows(chart)} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} />
            <YAxis domain={[40, 'auto']} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v) => `${v} mg/dl`} labelFormatter={(d) => `Day ${d}`} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {SLOTS.map((s) => (
              <Line key={s.key} dataKey={s.key} name={s.label} stroke={COLORS[s.key]} strokeWidth={2} dot={{ r: 3 }} connectNulls />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </section>
  );
}
