import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '../components/Header.jsx';
import { api } from '../api.js';
import { SLOTS, slotLabel, todayInIndia, validateReading } from '../readings.js';

export default function Home() {
  const today = todayInIndia();
  // Opened from History as /?date=YYYY-MM-DD: start on that day.
  const [params] = useSearchParams();
  const urlDate = params.get('date');
  const startDate = /^\d{4}-\d{2}-\d{2}$/.test(urlDate ?? '') && urlDate <= today ? urlDate : today;
  const [viewDate, setViewDate] = useState(startDate);
  const [readings, setReadings] = useState([]);
  const [form, setForm] = useState(null); // null = modal closed
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (date) => {
    try {
      setReadings((await api(`/readings?date=${date}`)).readings);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    load(viewDate);
  }, [viewDate, load]);

  const openForm = (f) => {
    setForm(f);
    setError('');
  };
  const closeForm = () => {
    setForm(null);
    setError('');
  };

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    const msg = validateReading(form);
    if (msg) return setError(msg);

    setBusy(true);
    setError('');
    try {
      const body = { date: form.date, slot: form.slot, value: form.value };
      if (form.id) await api(`/readings/${form.id}`, { method: 'PUT', body });
      else await api('/readings', { method: 'POST', body });
      setForm(null);
      if (form.date === viewDate) load(viewDate);
      else setViewDate(form.date); // jump to the day the reading was saved on
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (r) => {
    if (!window.confirm(`Delete ${slotLabel(r.slot)} reading (${r.value} mg/dl)?`)) return;
    try {
      await api(`/readings/${r.id}`, { method: 'DELETE' });
      load(viewDate);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page">
      <Header />

      <section className="card wide">
        <label>
          Readings for
          <input type="date" value={viewDate} max={today} onChange={(e) => e.target.value && setViewDate(e.target.value)} />
        </label>
        {!form && error && <p className="error">{error}</p>}
        <table className="readings">
          <tbody>
            {SLOTS.map((s) => {
              const r = readings.find((x) => x.slot === s.key);
              return (
                <tr key={s.key}>
                  <td>{s.label}</td>
                  <td>{r ? `${r.value} mg/dl` : '—'}</td>
                  <td className="actions">
                    {r ? (
                      <>
                        <button className="small" onClick={() => openForm({ ...r, value: String(r.value) })}>Edit</button>
                        <button className="small danger" onClick={() => onDelete(r)}>Delete</button>
                      </>
                    ) : (
                      <button className="small" onClick={() => openForm({ id: null, date: viewDate, slot: s.key, value: '' })}>
                        Add
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {form && (
        <div className="modal-backdrop" onClick={closeForm}>
          <div className="card modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h2>{form.id ? 'Edit reading' : 'Add reading'}</h2>
            <form onSubmit={onSubmit} noValidate>
              <label>
                Date
                <input name="date" type="date" value={form.date} max={today} onChange={onChange} />
              </label>
              <label>
                Time slot
                <select name="slot" value={form.slot} onChange={onChange}>
                  {SLOTS.map((s) => (
                    <option key={s.key} value={s.key}>{s.label}</option>
                  ))}
                </select>
              </label>
              <label>
                Glucose (mg/dl)
                <input name="value" type="number" inputMode="numeric" step="1" value={form.value} onChange={onChange} autoFocus />
              </label>
              {error && <p className="error">{error}</p>}
              <button disabled={busy}>{busy ? 'Saving…' : form.id ? 'Update' : 'Save'}</button>
              <button type="button" className="secondary" onClick={closeForm}>Cancel</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
