import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdvancedFilters from './AdvancedFilters';
import { sampleData } from '../../test/fixtures';
import { DividendData } from '../../types/dividend';
import { selectByLabel } from '../../test/mui';

type Callback = (rows: DividendData[]) => void;

const names = (rows: DividendData[]) => rows.map(r => r['Nombre del instrumento']);
const amounts = (rows: DividendData[]) => rows.map(r => r['Dividendo neto recibido (USD)']);

const setup = () => {
  const onFiltersChange = vi.fn<Callback>();
  const user = userEvent.setup();
  render(<AdvancedFilters data={sampleData} onFiltersChange={onFiltersChange} />);
  const last = () => onFiltersChange.mock.calls[onFiltersChange.mock.calls.length - 1][0];
  return { user, onFiltersChange, last };
};

const openAdvanced = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: /Filtros Avanzados/ }));
};

const activeSummary = () => screen.getByText('Filtros activos:').parentElement as HTMLElement;

describe('AdvancedFilters', () => {
  it('emits the full dataset sorted by date descending exactly once on mount', () => {
    const { onFiltersChange, last } = setup();

    expect(onFiltersChange).toHaveBeenCalledTimes(1);
    expect(last().map(r => r['Fecha de pago'])).toEqual([
      '10/06/2024', '15/05/2024', '15/03/2024', '15/03/2024', '20/01/2024',
    ]);
    expect(screen.getByText('5 de 5 registros')).toBeInTheDocument();
    expect(screen.queryByText(/activos/)).not.toBeInTheDocument();
  });

  it('searches by company name, ticker and ISIN', async () => {
    const { user, last } = setup();
    const search = screen.getByLabelText('Buscar empresa, ticker o ISIN');

    await user.type(search, 'pep');
    expect(names(last())).toEqual(['PepsiCo']);
    expect(screen.getByText('1 de 5 registros')).toBeInTheDocument();
    expect(screen.getByText('1 activos')).toBeInTheDocument();
    expect(screen.getByText('Búsqueda: "pep"')).toBeInTheDocument();

    await user.clear(search);
    await user.type(search, 'KO');
    expect(names(last())).toEqual(['Coca-Cola', 'Coca-Cola', 'Coca-Cola']);

    await user.clear(search);
    await user.type(search, 'es0000');
    expect(names(last())).toEqual(['Empresa Desconocida SA']);
  });

  it('removes the search from the active-filters chip', async () => {
    const { user, last } = setup();
    await user.type(screen.getByLabelText('Buscar empresa, ticker o ISIN'), 'pep');

    const chip = screen.getByText('Búsqueda: "pep"').closest('.MuiChip-root') as HTMLElement;
    await user.click(within(chip).getByTestId('CancelIcon'));

    expect(last()).toHaveLength(5);
    expect(screen.getByLabelText('Buscar empresa, ticker o ISIN')).toHaveValue('');
  });

  it('sorts by amount and by company in both directions', async () => {
    const { user, last } = setup();

    await user.click(selectByLabel('Ordenar por'));
    await user.click(screen.getByRole('option', { name: /Importe/ }));
    expect(amounts(last())).toEqual([20, 12, 10, 8, 5]);

    await user.click(selectByLabel('Orden'));
    await user.click(screen.getByRole('option', { name: /Ascendente/ }));
    expect(amounts(last())).toEqual([5, 8, 10, 12, 20]);

    await user.click(selectByLabel('Ordenar por'));
    await user.click(screen.getByRole('option', { name: /Empresa/ }));
    expect(names(last())).toEqual(['Empresa Desconocida SA', 'Coca-Cola', 'Coca-Cola', 'Coca-Cola', 'PepsiCo']);
  });

  it('filters by an inclusive date range', async () => {
    const { user, last } = setup();
    await openAdvanced(user);

    fireEvent.change(screen.getByLabelText('Fecha inicio (DD/MM/YYYY)'), { target: { value: '2024-03-15' } });
    expect(last().map(r => r['Fecha de pago'])).toEqual(['10/06/2024', '15/05/2024', '15/03/2024', '15/03/2024']);

    fireEvent.change(screen.getByLabelText('Fecha fin (DD/MM/YYYY)'), { target: { value: '2024-05-15' } });
    expect(last().map(r => r['Fecha de pago'])).toEqual(['15/05/2024', '15/03/2024', '15/03/2024']);
    expect(within(activeSummary()).getByText('Rango de fechas')).toBeInTheDocument();
    expect(screen.getByText('Activos')).toBeInTheDocument();

    const chip = within(activeSummary()).getByText('Rango de fechas').closest('.MuiChip-root') as HTMLElement;
    await user.click(within(chip).getByTestId('CancelIcon'));
    expect(last()).toHaveLength(5);
    expect(screen.getByLabelText('Fecha inicio (DD/MM/YYYY)')).toHaveValue('');
  });

  it('filters by selected companies and shows them as ticker chips', async () => {
    const { user, last } = setup();
    await openAdvanced(user);

    const input = screen.getByLabelText('Seleccionar empresas');
    await user.click(input);
    await user.click(screen.getByRole('option', { name: 'PEP' }));
    expect(names(last())).toEqual(['PepsiCo']);

    await user.click(input);
    await user.click(screen.getByRole('option', { name: 'Empresa Desconocida SA' }));
    expect(names(last())).toEqual(['PepsiCo', 'Empresa Desconocida SA']);

    const summary = screen.getByText('Filtros activos:').parentElement as HTMLElement;
    expect(within(summary).getByText('PEP')).toBeInTheDocument();
    const chip = within(summary).getByText('PEP').closest('.MuiChip-root') as HTMLElement;
    await user.click(within(chip).getByTestId('CancelIcon'));
    expect(names(last())).toEqual(['Empresa Desconocida SA']);
  });

  it('applies the amount range only when it is narrower than the data bounds', async () => {
    const { user, last } = setup();
    await openAdvanced(user);

    expect(screen.getByText('Rango de importes (USD): $5 - $20')).toBeInTheDocument();

    const [minThumb] = screen.getAllByRole('slider');
    minThumb.focus();
    await user.keyboard('{ArrowRight}');

    expect(amounts(last())).toEqual([12, 20, 10, 8]);
    expect(screen.getByText('Importe: $5.01 - $20')).toBeInTheDocument();
    expect(screen.getByText('1 activos')).toBeInTheDocument();

    await user.keyboard('{ArrowLeft}');
    expect(last()).toHaveLength(5);
    expect(screen.queryByText(/^Importe:/)).not.toBeInTheDocument();
  });

  it('clears every filter at once', async () => {
    const { user, last } = setup();
    await user.type(screen.getByLabelText('Buscar empresa, ticker o ISIN'), 'pep');
    await openAdvanced(user);
    fireEvent.change(screen.getByLabelText('Fecha inicio (DD/MM/YYYY)'), { target: { value: '2024-06-01' } });
    expect(screen.getByText('2 activos')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Limpiar todos los filtros' }));

    expect(last()).toHaveLength(5);
    expect(screen.queryByText(/activos/)).not.toBeInTheDocument();
    expect(screen.getByText('5 de 5 registros')).toBeInTheDocument();
  });

  it('disables the slider when every amount is the same', async () => {
    const user = userEvent.setup();
    const same = sampleData.map(r => ({ ...r, 'Dividendo neto recibido (USD)': 7 }));
    render(<AdvancedFilters data={same} onFiltersChange={vi.fn()} />);
    await openAdvanced(user);
    const [thumb] = screen.getAllByRole('slider');
    expect(thumb).toBeDisabled();
  });
});
