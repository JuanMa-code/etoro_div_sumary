import * as XLSX from 'xlsx';
import { DividendData } from '../types/dividend';

/**
 * Builds a DividendData row with sensible defaults. Override only the keys a
 * test cares about.
 */
export const makeDividend = (overrides: Partial<DividendData> = {}): DividendData => ({
  'Fecha de pago': '15/03/2024',
  'Nombre del instrumento': 'Coca-Cola',
  'ISIN': 'US1912161007',
  'Dividendo neto recibido (USD)': 10,
  'Dividendo neto recibido (EUR)': 9,
  'Importe de la retención tributaria (USD)': 1.5,
  'Importe de la retención tributaria (EUR)': 1.35,
  'Tasa de retención fiscal (%)': '15%',
  'ID de posición': '1',
  'Tipo': 'Dividendo',
  ...overrides,
});

/**
 * Small dataset with three companies across four payment days. Newest first,
 * as the eToro export is.
 */
export const sampleData: DividendData[] = [
  makeDividend({ 'Fecha de pago': '10/06/2024', 'Nombre del instrumento': 'Coca-Cola', 'Dividendo neto recibido (USD)': 12, 'Dividendo neto recibido (EUR)': 11, 'ID de posición': '4' }),
  makeDividend({ 'Fecha de pago': '15/05/2024', 'Nombre del instrumento': 'PepsiCo', 'ISIN': 'US7134481081', 'Dividendo neto recibido (USD)': 20, 'Dividendo neto recibido (EUR)': 18, 'ID de posición': '3' }),
  makeDividend({ 'Fecha de pago': '15/03/2024', 'Nombre del instrumento': 'Coca-Cola', 'Dividendo neto recibido (USD)': 10, 'Dividendo neto recibido (EUR)': 9, 'ID de posición': '2' }),
  makeDividend({ 'Fecha de pago': '15/03/2024', 'Nombre del instrumento': 'Coca-Cola', 'Dividendo neto recibido (USD)': 5, 'Dividendo neto recibido (EUR)': 4.5, 'ID de posición': '2b' }),
  makeDividend({ 'Fecha de pago': '20/01/2024', 'Nombre del instrumento': 'Empresa Desconocida SA', 'ISIN': 'ES0000000000', 'Dividendo neto recibido (USD)': 8, 'Dividendo neto recibido (EUR)': 7, 'ID de posición': '1' }),
];

export const DIVIDEND_HEADERS = [
  'Fecha de pago',
  'Nombre del instrumento',
  'ISIN',
  'Dividendo neto recibido (USD)',
  'Dividendo neto recibido (EUR)',
  'Importe de la retención tributaria (USD)',
  'Importe de la retención tributaria (EUR)',
  'Tasa de retención fiscal (%)',
  'ID de posición',
  'Tipo',
];

export const toRow = (item: DividendData): (string | number)[] =>
  DIVIDEND_HEADERS.map(header => item[header as keyof DividendData]);

export interface SheetSpec {
  name: string;
  rows: (string | number)[][];
}

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/**
 * Serialises a workbook to a File the way the browser would hand it to the
 * <input type="file"> handler.
 */
export const buildWorkbookFile = (sheets: SheetSpec[], fileName = 'dividendos.xlsx'): File => {
  const workbook = XLSX.utils.book_new();
  for (const sheet of sheets) {
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(sheet.rows), sheet.name);
  }
  const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
  return new File([buffer], fileName, { type: XLSX_MIME, lastModified: Date.UTC(2024, 5, 1) });
};

/**
 * Mimics the real eToro export: three unrelated sheets first, then the
 * dividends sheet with a title row above the headers.
 */
export const buildEtoroFile = (data: DividendData[] = sampleData, fileName = 'etoro.xlsx'): File =>
  buildWorkbookFile([
    { name: 'Resumen de la cuenta', rows: [['Detalles', 'Valor'], ['Nombre', 'Jm']] },
    { name: 'Posiciones cerradas', rows: [['Acción', 'Ganancia'], ['KO', 12]] },
    { name: 'Actividad de la cuenta', rows: [['Fecha', 'Tipo'], ['01/01/2024', 'Depósito']] },
    { name: 'Dividendos', rows: [['Historial de dividendos'], DIVIDEND_HEADERS, ...data.map(toRow)] },
  ], fileName);
