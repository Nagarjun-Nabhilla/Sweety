import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { SLOTS } from '../readings.js';

const COLORS = { morning: '#d6336c', after_breakfast: '#1c7ed6', after_lunch: '#2b8a3e', after_dinner: '#e8590c' };

// One row per day of the month: { day: 1, morning: 110, after_lunch: 145, ... }
function buildRows({ to, readings }) {
  const lastDay = Number(to.slice(8, 10));
  const rows = Array.from({ length: lastDay }, (_, i) => ({ day: i + 1 }));
  for (const r of readings) rows[Number(r.date.slice(8, 10)) - 1][r.slot] = r.value;
  return rows;
}

// Same Y-axis range for all four charts, so they can be compared at a glance.
function sharedDomain(readings) {
  const values = readings.map((r) => r.value);
  const low = Math.max(40, Math.floor((Math.min(...values) - 10) / 10) * 10);
  const high = Math.ceil((Math.max(...values) + 10) / 10) * 10;
  return [low, high];
}

function SlotChart({ slot, rows, domain, hasData }) {
  return (
    <div className="slot-chart">
      <h3 style={{ color: COLORS[slot.key] }}>{slot.label}</h3>
      {hasData ? (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={rows} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} />
            <YAxis domain={domain} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => [`${v} mg/dl`, slot.label]} labelFormatter={(d) => `Day ${d}`} />
            <Line dataKey={slot.key} stroke={COLORS[slot.key]} strokeWidth={2} dot={{ r: 3 }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <p className="empty">No readings this month.</p>
      )}
    </div>
  );
}

export default function MonthChart({ chart }) {
  const title = new Date(`${chart.from}T00:00:00Z`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const empty = chart.readings.length === 0;
  const rows = empty ? [] : buildRows(chart);
  const domain = empty ? [40, 'auto'] : sharedDomain(chart.readings);
  return (
    <section className="card wide">
      <h2>{title}</h2>
      {empty ? (
        <p className="empty">No readings this month yet.</p>
      ) : (
        <div className="slot-charts">
          {SLOTS.map((s) => (
            <SlotChart key={s.key} slot={s} rows={rows} domain={domain}
              hasData={chart.readings.some((r) => r.slot === s.key)} />
          ))}
        </div>
      )}
    </section>
  );
}
