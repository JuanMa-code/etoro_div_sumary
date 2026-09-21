import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import PredictionsPanel from './PredictionsPanel';
import { sampleData, makeDividend } from '../../test/fixtures';
import { readChart } from '../../test/chartMock';
import { DividendData } from '../../types/dividend';

vi.mock('react-chartjs-2', async () => {
  const { MockLine } = await import('../../test/chartMock');
  return { Line: MockLine };
});

const chart = () => readChart(screen.getByTestId('line-chart'));

/** One payment per month, given as USD amounts from January 2024 onwards. */
const monthly = (amounts: number[], company = 'Coca-Cola', startMonth = 1): DividendData[] =>
  amounts.map((amount, i) =>
    makeDividend({
      'Fecha de pago': `10/${String(startMonth + i).padStart(2, '0')}/2024`,
      'Nombre del instrumento': company,
      'Dividendo neto recibido (USD)': amount,
    })
  );

describe('PredictionsPanel', () => {
  it('needs at least three rows', () => {
    render(<PredictionsPanel data={sampleData.slice(0, 2)} />);
    expect(screen.getByText(/al menos 3 registros/)).toBeInTheDocument();
    expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
  });

  it('estimates the next quarter and year from the last three months plus the trend', () => {
    render(<PredictionsPanel data={sampleData} />);

    // Meses: 01→8, 03→15, 05→20, 06→12. Pendiente 1.7, media últimos 3 = 15.67.
    expect(screen.getByText('$52.10')).toBeInTheDocument();
    expect(screen.getByText('$208.40')).toBeInTheDocument();
    expect(screen.getByText('Tendencia Neutral')).toBeInTheDocument();
    expect(screen.getByText('23.7%')).toBeInTheDocument();
    expect(screen.getByText('Riesgo Moderado')).toBeInTheDocument();
  });

  it('omits companies without payments on both sides of the 3-payment window', () => {
    render(<PredictionsPanel data={sampleData} />);
    expect(screen.getByText(/Aún no hay empresas con historial suficiente/)).toBeInTheDocument();
  });

  it('continues the chart from the last month with data', () => {
    render(<PredictionsPanel data={sampleData} />);

    const { labels, datasets } = chart();
    expect(labels).toEqual(['2024-01', '2024-03', '2024-05', '2024-06', '2024-07', '2024-08', '2024-09']);
    expect(datasets[0]).toEqual({ label: 'Dividendos Históricos', data: [8, 15, 20, 12, null, null, null] });
    expect(datasets[1].label).toBe('Predicción');
    expect(datasets[1].data.slice(0, 4)).toEqual([null, null, null, null]);
    expect(datasets[1].data[4]).toBeCloseTo(16.45, 2);
  });

  it('rolls the predicted months over the year end', () => {
    render(<PredictionsPanel data={monthly([10, 10, 10], 'Coca-Cola', 10)} />);
    expect(chart().labels).toEqual(['2024-10', '2024-11', '2024-12', '2025-01', '2025-02', '2025-03']);
  });

  it('detects a bullish trend and caps confidence at 95%', () => {
    render(<PredictionsPanel data={monthly([10, 30, 50, 70])} />);
    expect(screen.getByText('Tendencia Alcista')).toBeInTheDocument();
    expect(screen.getByText('95.0%')).toBeInTheDocument();
  });

  it('detects a bearish trend', () => {
    render(<PredictionsPanel data={monthly([70, 50, 30, 10])} />);
    expect(screen.getByText('Tendencia Bajista')).toBeInTheDocument();
  });

  it('classifies risk from monthly volatility', () => {
    const { unmount } = render(<PredictionsPanel data={monthly([10, 10, 10, 10])} />);
    expect(screen.getByText('Bajo Riesgo')).toBeInTheDocument();
    unmount();

    render(<PredictionsPanel data={monthly([1, 100, 1, 100])} />);
    expect(screen.getByText('Alto Riesgo')).toBeInTheDocument();
  });

  it('ranks companies by growth of the last three payments against the older ones', () => {
    const data = [
      ...monthly([10, 10, 20, 20, 20], 'Coca-Cola'),
      ...monthly([20, 20, 10, 10, 10], 'PepsiCo'),
      ...monthly([0, 5, 5, 5], 'Sin base'),
      ...monthly([5, 5, 5], 'Pocos pagos'),
      ...monthly([1, 1, 1, 1], 'Compañía con nombre muy largo SA'),
    ];
    render(<PredictionsPanel data={data} />);

    expect(screen.getByText('+100.0%')).toBeInTheDocument();
    expect(screen.getByText('Pred: $40.00')).toBeInTheDocument();
    expect(screen.getByText('-50.0%')).toBeInTheDocument();
    expect(screen.getByText('Pred: $5.00')).toBeInTheDocument();
    expect(screen.getByText('Compañía con nombre ...')).toBeInTheDocument();
    expect(screen.queryByText('Sin base')).not.toBeInTheDocument();
    expect(screen.queryByText('Pocos pagos')).not.toBeInTheDocument();
  });
});
