import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import Home from './Home.jsx';
import { api } from '../api.js';
import { todayInIndia } from '../readings.js';

// Fake the API so no server or database is needed. Header needs a logged-in user, so hide it.
vi.mock('../api.js', () => ({ api: vi.fn() }));
vi.mock('../components/Header.jsx', () => ({ default: () => null }));

const today = todayInIndia();
let saved; // readings the fake server returns for the day

beforeEach(() => {
  saved = [];
  api.mockReset();
  api.mockImplementation(async (path, { method = 'GET' } = {}) => (method === 'GET' ? { readings: saved } : {}));
});

const renderHome = () => render(<MemoryRouter><Home /></MemoryRouter>);

// Opens the "Add reading" form for the first slot (Morning) and returns the dialog.
async function openAddForm(user) {
  renderHome();
  const [addMorning] = await screen.findAllByRole('button', { name: 'Add' });
  await user.click(addMorning);
  return screen.getByRole('dialog');
}

describe('Reading form', () => {
  test('opens with the chosen slot and an empty value', async () => {
    const dialog = await openAddForm(userEvent.setup());
    expect(within(dialog).getByRole('heading', { name: 'Add reading' })).toBeInTheDocument();
    expect(within(dialog).getByLabelText('Time slot')).toHaveValue('morning');
    expect(within(dialog).getByLabelText('Glucose (mg/dl)')).toHaveValue(null);
  });

  test.each([
    ['', 'Please enter a glucose value.'],
    ['120.5', 'Value must be a whole number.'],
    ['39', 'Value must be between 40 and 600 mg/dl.'],
    ['601', 'Value must be between 40 and 600 mg/dl.'],
  ])('rejects value "%s" without calling the server', async (value, message) => {
    const user = userEvent.setup();
    const dialog = await openAddForm(user);
    if (value) await user.type(within(dialog).getByLabelText('Glucose (mg/dl)'), value);
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));

    expect(within(dialog).getByText(message)).toBeInTheDocument();
    expect(api).not.toHaveBeenCalledWith('/readings', expect.anything());
  });

  test('saves a valid reading and closes the form', async () => {
    const user = userEvent.setup();
    const dialog = await openAddForm(user);
    await user.type(within(dialog).getByLabelText('Glucose (mg/dl)'), '120');
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));

    expect(api).toHaveBeenCalledWith('/readings', {
      method: 'POST',
      body: { date: today, slot: 'morning', value: '120' },
    });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  test('shows the server error and keeps the form open', async () => {
    const user = userEvent.setup();
    const message = 'You can add only 4 readings per day.';
    api.mockImplementation(async (path, { method = 'GET' } = {}) => {
      if (method === 'GET') return { readings: [] };
      throw new Error(message);
    });
    const dialog = await openAddForm(user);
    await user.type(within(dialog).getByLabelText('Glucose (mg/dl)'), '120');
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));

    expect(await within(dialog).findByText(message)).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  test('edits an existing reading', async () => {
    const user = userEvent.setup();
    saved = [{ id: 5, date: today, slot: 'morning', value: 110 }];
    renderHome();
    await user.click(await screen.findByRole('button', { name: 'Edit' }));

    const dialog = screen.getByRole('dialog');
    const input = within(dialog).getByLabelText('Glucose (mg/dl)');
    expect(within(dialog).getByRole('heading', { name: 'Edit reading' })).toBeInTheDocument();
    expect(input).toHaveValue(110);

    await user.clear(input);
    await user.type(input, '125');
    await user.click(within(dialog).getByRole('button', { name: 'Update' }));

    expect(api).toHaveBeenCalledWith('/readings/5', {
      method: 'PUT',
      body: { date: today, slot: 'morning', value: '125' },
    });
  });

  test('Cancel closes the form without saving', async () => {
    const user = userEvent.setup();
    const dialog = await openAddForm(user);
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(api).not.toHaveBeenCalledWith('/readings', expect.anything());
  });
});
