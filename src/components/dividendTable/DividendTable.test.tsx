import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DividendTable from './DividendTable';
import { sampleData } from '../../test/fixtures';

const bodyRows = () => screen.getAllByRole('row').slice(1);
const firstCellText = (row: HTMLElement) => within(row).getAllByRole('cell')[0].textContent;

describe('DividendTable', () => {
  it('groups payments by instrument and date and shows the totals', () => {
    render(<DividendTable data={sampleData} />);

    expect(screen.getByText('Tabla de Dividendos (4 registros)')).toBeInTheDocument();
    expect(screen.getByText('Total USD: $55.00')).toBeInTheDocument();
    expect(screen.getByText('Total EUR: €49,50')).toBeInTheDocument();

    const merged = bodyRows().find(row => within(row).queryByText('15/03/2024'));
    expect(merged).toBeDefined();
    expect(within(merged!).getByText('$15.00')).toBeInTheDocument();
    expect(within(merged!).getByText('€13,50')).toBeInTheDocument();
  });

  it('sorts by date descending by default', () => {
    render(<DividendTable data={sampleData} />);
    const dates = bodyRows().map(row => within(row).getAllByRole('cell')[1].textContent);
    expect(dates).toEqual(['10/06/2024', '15/05/2024', '15/03/2024', '20/01/2024']);
  });

  it('shows tickers with the full name as caption, and toggles to full names', async () => {
    const user = userEvent.setup();
    render(<DividendTable data={sampleData} />);

    const [first] = bodyRows();
    expect(within(first).getByText('KO')).toBeInTheDocument();
    expect(within(first).getByText('Coca-Cola')).toBeInTheDocument();
    expect(screen.getByText('Cortos')).toBeInTheDocument();

    const unknownRow = bodyRows().find(row => within(row).queryByText('Empresa Desconocida SA'));
    expect(unknownRow).toBeDefined();
    expect(within(unknownRow!).getAllByText('Empresa Desconocida SA')).toHaveLength(1);

    await user.click(screen.getByTitle('Mostrar nombres completos'));

    expect(screen.getByText('Completos')).toBeInTheDocument();
    expect(screen.queryByText('KO')).not.toBeInTheDocument();
    expect(screen.getByTitle('Mostrar nombres cortos')).toBeInTheDocument();
  });

  it('sorts by amount and flips direction on a second click', async () => {
    const user = userEvent.setup();
    render(<DividendTable data={sampleData} />);

    await user.click(screen.getByText('Importe USD'));
    expect(firstCellText(bodyRows()[0])).toContain('PEP');

    await user.click(screen.getByText('Importe USD'));
    expect(firstCellText(bodyRows()[0])).toContain('Empresa Desconocida SA');
  });

  it('sorts by company using the displayed name', async () => {
    const user = userEvent.setup();
    render(<DividendTable data={sampleData} />);

    await user.click(screen.getByText('Empresa'));
    expect(firstCellText(bodyRows()[0])).toContain('PEP');

    await user.click(screen.getByText('Importe EUR'));
    expect(within(bodyRows()[0]).getByText('€18,00')).toBeInTheDocument();
  });

  it('renders an empty table without data', () => {
    render(<DividendTable data={[]} />);
    expect(screen.getByText('Tabla de Dividendos (0 registros)')).toBeInTheDocument();
    expect(bodyRows()).toHaveLength(0);
  });
});
