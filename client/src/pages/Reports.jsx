import { useEffect, useState } from 'react';
import Header from '../components/Header.jsx';
import MonthChart from '../components/MonthChart.jsx';
import { api } from '../api.js';
import { slotLabel, todayInIndia } from '../readings.js';

// '2026-10-15' -> '15 Oct 2026'
const fmtDate = (s) =>
  new Date(`${s}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const fmtValue = (n) => `${Number(n).toFixed(1)} mg/dl`;

function ReportCard({ title, report, children }) {
  const range = report.from === report.to ? fmtDate(report.from) : `${fmtDate(report.from)} – ${fmtDate(report.to)}`;
  return (
    <section className="card wide">
      <h2>{title}</h2>
      <p className="muted">{range}</p>
      {report.count === 0 ? (
        <p className="empty">No readings for this period yet. Add some on the Readings page.</p>
      ) : (
        <>
          <div className="stats">
            <div><span>Highest</span><strong>{fmtValue(report.highest)}</strong></div>
            <div><span>Lowest</span><strong>{fmtValue(report.lowest)}</strong></div>
            <div><span>Average</span><strong>{fmtValue(report.average)}</strong></div>
            <div><span>Readings</span><strong>{report.count}</strong></div>
          </div>
          {children}
        </>
      )}
    </section>
  );
}

export default function Reports() {
  const today = todayInIndia();
  const [date, setDate] = useState(today);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    api(`/reports?date=${date}`)
      .then(setData)
      .catch((err) => setError(err.message));
  }, [date]);

  return (
    <div className="page">
      <Header />
      <section className="card wide">
        <label>
          Selected date
          <input type="date" value={date} max={today} onChange={(e) => e.target.value && setDate(e.target.value)} />
        </label>
        {error && <p className="error">{error}</p>}
      </section>

      {data && (
        <>
          <ReportCard title="Daily" report={data.daily}>
            <table className="readings">
              <tbody>
                {data.daily.readings.map((r) => (
                  <tr key={r.slot}>
                    <td>{slotLabel(r.slot)}</td>
                    <td>{fmtValue(r.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ReportCard>
          <ReportCard title="Month-to-date" report={data.monthToDate} />
          <ReportCard title="Monthly (previous month)" report={data.monthly} />
          <MonthChart chart={data.chart} />
        </>
      )}
    </div>
  );
}
