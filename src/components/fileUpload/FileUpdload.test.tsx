import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FileUpload from './FileUpdload';
import { buildEtoroFile, buildWorkbookFile, sampleData, DIVIDEND_HEADERS, toRow } from '../../test/fixtures';
import { selectByLabel } from '../../test/mui';

vi.mock('react-chartjs-2', async () => {
  const { MockLine } = await import('../../test/chartMock');
  return { Line: MockLine };
});

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const fileInput = () => document.querySelector('input[type="file"]') as HTMLInputElement;

const setup = () => {
  // applyAccept: false para que el fichero .txt llegue al handler y sea el
  // componente quien lo rechace.
  const user = userEvent.setup({ applyAccept: false });
  render(<FileUpload />);
  return { user };
};

const loadEtoroFile = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.upload(fileInput(), buildEtoroFile());
  await screen.findByText(/Se encontraron 5 registros de dividendos en la hoja "Dividendos"/);
};

describe('FileUpload', () => {
  it('rejects files that are not Excel without touching the loaded dataset', async () => {
    const { user } = setup();
    await loadEtoroFile(user);

    await user.upload(fileInput(), new File(['hola'], 'notas.txt', { type: 'text/plain' }));

    expect(screen.getByText(/selecciona un archivo Excel válido/)).toBeInTheDocument();
    expect(screen.getByText('📊 Dashboard de Dividendos')).toBeInTheDocument();
    expect(screen.getByText('📄 etoro.xlsx')).toBeInTheDocument();
  });

  it('rejects files above 10MB', async () => {
    const { user } = setup();
    const big = new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'grande.xlsx', { type: XLSX_MIME });

    await user.upload(fileInput(), big);

    expect(screen.getByText(/demasiado grande/)).toBeInTheDocument();
    expect(screen.queryByText('📊 Dashboard de Dividendos')).not.toBeInTheDocument();
  });

  it('parses the eToro export, picks the dividends sheet and shows the dashboard', async () => {
    const { user } = setup();
    await loadEtoroFile(user);

    expect(screen.getByText('📄 etoro.xlsx')).toBeInTheDocument();
    expect(screen.getByText(/^📏 \d/)).toBeInTheDocument();
    expect(selectByLabel('Hoja de cálculo')).toHaveTextContent('Dividendos (seleccionada)');
    expect(screen.getByText('📊 Dashboard de Dividendos')).toBeInTheDocument();
    expect(screen.getByText('$55.00')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 6, name: 'Filtros Avanzados' })).not.toBeInTheDocument();
  });

  it('falls back to the fourth sheet when no sheet name mentions dividends', async () => {
    const { user } = setup();
    const rows = [DIVIDEND_HEADERS, ...sampleData.slice(0, 2).map(toRow)];
    const file = buildWorkbookFile([
      { name: 'A', rows: [['x']] },
      { name: 'B', rows: [['x']] },
      { name: 'C', rows: [['x']] },
      { name: 'D', rows },
      { name: 'E', rows: [['x']] },
    ]);

    await user.upload(fileInput(), file);

    await screen.findByText(/Se encontraron 2 registros de dividendos en la hoja "D"/);
  });

  it('falls back to the last sheet when there are fewer than four', async () => {
    const { user } = setup();
    const rows = [DIVIDEND_HEADERS, ...sampleData.slice(0, 1).map(toRow)];
    const file = buildWorkbookFile([
      { name: 'Resumen', rows: [['x']] },
      { name: 'Datos', rows },
    ]);

    await user.upload(fileInput(), file);

    await screen.findByText(/Se encontraron 1 registros de dividendos en la hoja "Datos"/);
  });

  it('reports sheets without recognisable headers or without valid rows', async () => {
    const { user } = setup();

    await user.upload(fileInput(), buildWorkbookFile([{ name: 'Dividendos', rows: [['a', 'b', 'c', 'd'], [1, 2, 3, 4]] }]));
    await screen.findByText(/No se encontraron headers válidos en la hoja "Dividendos"/);

    await user.upload(fileInput(), buildWorkbookFile([{ name: 'Dividendos', rows: [DIVIDEND_HEADERS, ['31/02/2024', 'KO', '', 5, 4]] }]));
    await screen.findByText(/No se encontraron datos de dividendos válidos/);

    await user.upload(fileInput(), buildWorkbookFile([{ name: 'Dividendos', rows: [] }]));
    await screen.findByText(/está vacía/);
  });

  it('switches views with the buttons and the Alt+N shortcuts', async () => {
    const { user } = setup();
    await loadEtoroFile(user);

    await user.click(screen.getByRole('button', { name: /Tabla de Dividendos/ }));
    expect(screen.getByText('Tabla de Dividendos (4 registros)')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 6, name: 'Filtros Avanzados' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Gráficos/ }));
    expect(screen.getByText('Gráfico de Dividendos')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Predicciones IA/ }));
    expect(screen.getByText('🔮 Predicciones y Análisis IA')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 6, name: 'Filtros Avanzados' })).not.toBeInTheDocument();

    fireEvent.keyDown(document, { key: '3', altKey: true });
    expect(screen.getByText('Totales Acumulados por Fecha (4 fechas)')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: '1', altKey: true });
    expect(screen.getByText('📊 Dashboard de Dividendos')).toBeInTheDocument();
  });

  it('ignores the shortcuts before any data is loaded', () => {
    setup();
    fireEvent.keyDown(document, { key: '2', altKey: true });
    expect(screen.queryByText(/Tabla de Dividendos \(/)).not.toBeInTheDocument();
  });

  it('feeds the filters into the table and resets them when the sheet is reprocessed', async () => {
    const { user } = setup();
    await loadEtoroFile(user);

    await user.click(screen.getByRole('button', { name: /Tabla de Dividendos/ }));
    await user.type(screen.getByLabelText('Buscar empresa, ticker o ISIN'), 'pep');
    expect(screen.getByText('Tabla de Dividendos (1 registros)')).toBeInTheDocument();

    await user.click(selectByLabel('Hoja de cálculo'));
    await user.click(screen.getByRole('option', { name: /Resumen de la cuenta/ }));
    await screen.findByText(/No se encontraron headers válidos en la hoja "Resumen de la cuenta"/);
    // La hoja fallida no destruye el dataset anterior.
    expect(screen.getByText('Tabla de Dividendos (1 registros)')).toBeInTheDocument();

    await user.click(selectByLabel('Hoja de cálculo'));
    await user.click(screen.getByRole('option', { name: /^Dividendos/ }));
    await screen.findByText(/Se encontraron 5 registros/);

    expect(screen.getByText('Tabla de Dividendos (4 registros)')).toBeInTheDocument();
    expect(screen.getByLabelText('Buscar empresa, ticker o ISIN')).toHaveValue('');
  });

  it('reports a read error from the FileReader', async () => {
    const { user } = setup();
    const original = FileReader.prototype.readAsArrayBuffer;
    FileReader.prototype.readAsArrayBuffer = function () {
      this.dispatchEvent(new ProgressEvent('error'));
    };
    try {
      await user.upload(fileInput(), buildEtoroFile());
      await screen.findByText(/Error al leer el archivo/);
    } finally {
      FileReader.prototype.readAsArrayBuffer = original;
    }
  });
});
