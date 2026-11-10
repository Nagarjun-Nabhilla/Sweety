import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header.jsx';
import { api } from '../api.js';
import { slotLabel } from '../readings.js';

const LIMIT = 20;
const fmtDate = (s) =>
  new Date(`${s}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

export default function History() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async (p) => {
    setError('');
    try {
      const d = await api(`/readings?page=${p}&limit=${LIMIT}`);
      // If the last item of the last page was deleted, step back a page.
      if (d.readings.length === 0 && p > 1) return setPage(p - 1);
      setData(d);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    load(page);
  }, [page, load]);

  const onDelete = async (r) => {
    if (!window.confirm(`Delete ${slotLabel(r.slot)} reading on ${fmtDate(r.date)} (${r.value} mg/dl)?`)) return;
    try {
      await api(`/readings/${r.id}`, { method: 'DELETE' });
      load(page);
    } catch (err) {
      setError(err.message);
    }
  };

  const p = data?.pagination;
  return (
    <div className="page">
      <Header />
      <section className="card wide">
        <h2>All readings</h2>
        {error && <p className="error">{error}</p>}
        {data && data.readings.length === 0 && <p className="empty">No readings yet. Add some on the Readings page.</p>}
        {data && data.readings.length > 0 && (
          <>
            <table className="readings">
              <tbody>
                {data.readings.map((r) => (
                  <tr key={r.id}>
                    <td>{fmtDate(r.date)}</td>
                    <td>{slotLabel(r.slot)}</td>
                    <td>{r.value} mg/dl</td>
                    <td className="actions">
                      <Link className="small-link" to={`/?date=${r.date}`}>Edit</Link>
                      <button className="small danger" onClick={() => onDelete(r)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="pager">
              <button className="small" disabled={p.page <= 1} onClick={() => setPage(p.page - 1)}>‹ Prev</button>
              <span>Page {p.page} of {p.totalPages} ({p.total} readings)</span>
              <button className="small" disabled={p.page >= p.totalPages} onClick={() => setPage(p.page + 1)}>Next ›</button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
