import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AccumulatedChart from './AcucumulatedChart';
import { sampleData } from '../../test/fixtures';
import { readChart } from '../../test/chartMock';

vi.mock('react-chartjs-2', async () => {
  const { MockLine } = await import('../../test/chartMock');
  return { Line: MockLine };
});

const chart = () => readChart(screen.getByTestId('line-chart'));

describe('AccumulatedChart', () => {
  it('draws the cumulative USD series by default, oldest first', () => {
    render(<AccumulatedChart data={sampleData} />);

    expect(screen.getByText('$55.00')).toBeInTheDocument();
    expect(screen.getByText('€49,50')).toBeInTheDocument();

    const { labels, datasets } = chart();
    expect(labels).toEqual(['20/01/2024', '15/03/2024', '15/05/2024', '10/06/2024']);
    expect(datasets).toEqual([{ label: 'Dividendos Acumulados USD', data: [8, 23, 43, 55] }]);
  });

  it('switches currency and can show both series', async () => {
    const user = userEvent.setup();
    render(<AccumulatedChart data={sampleData} />);

    await user.click(screen.getByRole('button', { name: 'EUR' }));
    expect(chart().datasets).toEqual([{ label: 'Dividendos Acumulados EUR', data: [7, 20.5, 38.5, 49.5] }]);

    await user.click(screen.getByRole('button', { name: 'Ambas' }));
    expect(chart().datasets.map(d => d.label)).toEqual(['Dividendos Acumulados USD', 'Dividendos Acumulados EUR']);
  });

  it('switches to per-date totals', async () => {
    const user = userEvent.setup();
    render(<AccumulatedChart data={sampleData} />);

    await user.click(screen.getByRole('button', { name: 'Por Fecha' }));
    expect(chart().datasets).toEqual([{ label: 'Dividendos Mensuales USD', data: [8, 15, 20, 12] }]);

    await user.click(screen.getByRole('button', { name: 'Ambas' }));
    expect(chart().datasets.map(d => d.label)).toEqual(['Dividendos Mensuales USD', 'Dividendos Mensuales EUR']);
  });

  it('keeps the current selection when the active toggle is clicked again', async () => {
    const user = userEvent.setup();
    render(<AccumulatedChart data={sampleData} />);

    await user.click(screen.getByRole('button', { name: 'USD' }));
    await user.click(screen.getByRole('button', { name: 'Acumulativo' }));
    expect(chart().datasets).toEqual([{ label: 'Dividendos Acumulados USD', data: [8, 23, 43, 55] }]);
  });

  it('shows zero totals and an empty chart without data', () => {
    render(<AccumulatedChart data={[]} />);
    expect(screen.getByText('$0.00')).toBeInTheDocument();
    expect(screen.getByText('€0,00')).toBeInTheDocument();
    expect(chart().labels).toEqual([]);
  });
});
