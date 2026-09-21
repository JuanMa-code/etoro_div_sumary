import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DateAccumulatedTable from './DateAccumulatedTable';
import { sampleData } from '../../test/fixtures';

const bodyRows = () => screen.getAllByRole('row').slice(1);
const cells = (row: HTMLElement) => within(row).getAllByRole('cell').map(c => c.textContent);

describe('DateAccumulatedTable', () => {
  it('aggregates per day with running totals, newest first', () => {
    render(<DateAccumulatedTable data={sampleData} />);

    expect(screen.getByText('Totales Acumulados por Fecha (4 fechas)')).toBeInTheDocument();
    expect(screen.getByText('Total USD: $55.00')).toBeInTheDocument();
    expect(screen.getByText('Total EUR: €49,50')).toBeInTheDocument();

    const rows = bodyRows();
    expect(cells(rows[0])).toEqual(['10/06/2024', '$12.00', '€11,00', '$55.00', '€49,50']);
    expect(cells(rows[3])).toEqual(['20/01/2024', '$8.00', '€7,00', '$8.00', '€7,00']);
  });

  it('flips to ascending when the active column is clicked again', async () => {
    const user = userEvent.setup();
    render(<DateAccumulatedTable data={sampleData} />);

    await user.click(screen.getByText('Fecha de Pago'));
    expect(cells(bodyRows()[0])[0]).toBe('20/01/2024');
  });

  it('sorts by any amount column, descending first', async () => {
    const user = userEvent.setup();
    render(<DateAccumulatedTable data={sampleData} />);

    await user.click(screen.getByText('Total USD'));
    expect(cells(bodyRows()[0])[0]).toBe('15/05/2024');

    await user.click(screen.getByText('Total EUR'));
    expect(cells(bodyRows()[0])[0]).toBe('15/05/2024');

    await user.click(screen.getByText('Acumulado USD'));
    expect(cells(bodyRows()[0])[0]).toBe('10/06/2024');

    await user.click(screen.getByText('Acumulado EUR'));
    await user.click(screen.getByText('Acumulado EUR'));
    expect(cells(bodyRows()[0])[0]).toBe('20/01/2024');
  });

  it('renders nothing but the headers without data', () => {
    render(<DateAccumulatedTable data={[]} />);
    expect(screen.getByText('Totales Acumulados por Fecha (0 fechas)')).toBeInTheDocument();
    expect(bodyRows()).toHaveLength(0);
  });
});
