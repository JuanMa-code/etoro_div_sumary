import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Dashboard from './Dashboard';
import { sampleData, makeDividend } from '../../test/fixtures';

describe('Dashboard', () => {
  it('asks for a file when there is no data', () => {
    render(<Dashboard data={[]} />);
    expect(screen.getByText('Carga un archivo para ver el dashboard')).toBeInTheDocument();
  });

  it('shows totals, counts and averages for the dataset', () => {
    render(<Dashboard data={sampleData} />);

    expect(screen.getByText('$55.00')).toBeInTheDocument();
    expect(screen.getByText('€49.50')).toBeInTheDocument();
    expect(screen.getByText('5.00')).toBeInTheDocument();
    expect(screen.getByText('3 empresas únicas')).toBeInTheDocument();
    expect(screen.getByText('$11.00')).toBeInTheDocument();
    expect(screen.getByText('3 empresas en cartera')).toBeInTheDocument();
  });

  it('picks the best month and the best company', () => {
    render(<Dashboard data={sampleData} />);

    expect(screen.getByText('2024-05 - $20.00')).toBeInTheDocument();
    expect(screen.getByText('Coca-Cola')).toBeInTheDocument();
    expect(screen.getByText('$27.00')).toBeInTheDocument();
  });

  it('shows the first and last payment dates and the days chips', () => {
    render(<Dashboard data={sampleData} />);

    expect(screen.getByText('20/01/2024')).toBeInTheDocument();
    expect(screen.getByText('10/06/2024')).toBeInTheDocument();
    expect(screen.getByText(/^\d+ días invirtiendo$/)).toBeInTheDocument();
    expect(screen.getByText(/^Última actividad: \d+ días$/)).toBeInTheDocument();
  });

  it('reports a growing trend when recent months beat the older average', () => {
    render(<Dashboard data={sampleData} />);
    expect(screen.getByText('Creciente')).toBeInTheDocument();
  });

  it('reports a falling trend when the last three months drop', () => {
    const data = [
      makeDividend({ 'Fecha de pago': '10/01/2024', 'Dividendo neto recibido (USD)': 100 }),
      makeDividend({ 'Fecha de pago': '10/02/2024', 'Dividendo neto recibido (USD)': 100 }),
      makeDividend({ 'Fecha de pago': '10/03/2024', 'Dividendo neto recibido (USD)': 100 }),
      makeDividend({ 'Fecha de pago': '10/08/2024', 'Dividendo neto recibido (USD)': 1 }),
    ];
    render(<Dashboard data={data} />);
    expect(screen.getByText('Decreciente')).toBeInTheDocument();
  });

  it('reports a stable trend when there is no older history to compare', () => {
    const data = [
      makeDividend({ 'Fecha de pago': '10/05/2024', 'Dividendo neto recibido (USD)': 10 }),
      makeDividend({ 'Fecha de pago': '10/06/2024', 'Dividendo neto recibido (USD)': 10 }),
    ];
    render(<Dashboard data={data} />);
    expect(screen.getByText('Estable')).toBeInTheDocument();
  });

  it('truncates very long company names', () => {
    const longName = 'Compañía con un nombre extraordinariamente largo SA';
    render(<Dashboard data={[makeDividend({ 'Nombre del instrumento': longName })]} />);
    expect(screen.getByText(`${longName.substring(0, 30)}...`)).toBeInTheDocument();
  });
});
