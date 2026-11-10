import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../AuthContext.jsx';
import { api } from '../api.js';
import { SLOTS, slotLabel, todayInIndia, validateReading } from '../readings.js';

const emptyForm = (date) => ({ id: null, date, slot: 'morning', value: '' });

export default function Home() {
  const { user, logout } = useAuth();
  const today = todayInIndia();
  const [viewDate, setViewDate] = useState(today);
  const [readings, setReadings] = useState([]);
  const [form, setForm] = useState(emptyForm(today));
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

  const resetForm = (date = viewDate) => {
    setForm(emptyForm(date));
    setError('');
  };

  const changeViewDate = (date) => {
    if (!date) return;
    setViewDate(date);
    resetForm(date);
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
      resetForm(form.date);
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
      if (form.id === r.id) resetForm();
      load(viewDate);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page">
      <header className="bar">
        <h1>Sweety</h1>
        <span>
          {user.name} <button className="link" onClick={logout}>Log out</button>
        </span>
      </header>

      <section className="card wide">
        <label>
          Readings for
          <input type="date" value={viewDate} max={today} onChange={(e) => changeViewDate(e.target.value)} />
        </label>
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
                        <button className="small" onClick={() => { setForm({ ...r, value: String(r.value) }); setError(''); }}>
                          Edit
                        </button>
                        <button className="small danger" onClick={() => onDelete(r)}>Delete</button>
                      </>
                    ) : (
                      <button className="small" onClick={() => { setForm({ ...emptyForm(viewDate), slot: s.key }); setError(''); }}>
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

      <section className="card wide">
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
            <input name="value" type="number" inputMode="decimal" step="0.001" value={form.value} onChange={onChange} />
          </label>
          {error && <p className="error">{error}</p>}
          <button disabled={busy}>{busy ? 'Saving…' : form.id ? 'Update' : 'Save'}</button>
          {form.id && (
            <button type="button" className="secondary" onClick={() => resetForm()}>Cancel</button>
          )}
        </form>
      </section>
    </div>
  );
}
