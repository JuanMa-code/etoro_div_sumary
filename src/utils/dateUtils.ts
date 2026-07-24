import { DividendData } from '../types/dividend';

/**
 * Parses a date string from Excel format to JavaScript Date
 * Handles multiple date formats: DD/MM/YYYY, DD-MM-YYYY, MM/DD/YYYY
 * Also handles Excel serial date numbers
 */
export const parseExcelDate = (dateStr: string | number): Date => {
  if (dateStr === null || dateStr === undefined || dateStr === '') return new Date();

  // If it's already a number (Excel serial date), convert it.
  // El serial se ancla a UTC, así que se reconstruye desde las partes UTC
  // para no desplazar un día en zonas con offset negativo.
  if (typeof dateStr === 'number') {
    const utc = new Date(Math.round((dateStr - 25569) * 86400 * 1000));
    if (isNaN(utc.getTime())) return new Date();
    return new Date(utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate());
  }

  // Clean the string
  const cleanDateStr = dateStr.toString().trim();
  
  // Try different date formats
  const formats = [
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/, // DD/MM/YYYY or DD-MM-YYYY
    /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/, // YYYY/MM/DD or YYYY-MM-DD
  ];
  
  for (const format of formats) {
    const match = cleanDateStr.match(format);
    if (match) {
      const [, part1, part2, part3] = match;
      
      // For DD/MM/YYYY format (assuming European format)
      if (format === formats[0]) {
        const day = parseInt(part1, 10);
        const month = parseInt(part2, 10) - 1; // Month is 0-indexed
        const year = parseInt(part3, 10);
        return new Date(year, month, day);
      }
      
      // For YYYY/MM/DD format
      if (format === formats[1]) {
        const year = parseInt(part1, 10);
        const month = parseInt(part2, 10) - 1; // Month is 0-indexed
        const day = parseInt(part3, 10);
        return new Date(year, month, day);
      }
    }
  }
  
  // Fallback: try native Date parsing
  const fallbackDate = new Date(cleanDateStr);
  return isNaN(fallbackDate.getTime()) ? new Date() : fallbackDate;
};

/**
 * Formats a date to DD/MM/YYYY format
 */
export const formatDate = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Formats a date to YYYY-MM-DD using local parts, for <input type="date">.
 * No se usa toISOString() porque convierte a UTC y puede restar un día.
 */
export const toDateInputValue = (date: Date): string => {
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

/**
 * Parses a YYYY-MM-DD value from <input type="date"> as local midnight.
 * new Date('YYYY-MM-DD') lo interpreta como UTC, lo que descuadra las
 * comparaciones contra fechas construidas en hora local.
 */
export const parseDateInputValue = (value: string): Date | null => {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return isNaN(date.getTime()) ? null : date;
};

/**
 * Returns the last representable instant of the given day, in local time
 */
export const endOfDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

/**
 * Validates dividend data structure
 */
export const validateDividendData = (data: unknown): data is Record<string, unknown> => {
  if (!data || typeof data !== 'object' || data === null || Array.isArray(data)) {
    return false;
  }
  
  const record = data as Record<string, unknown>;
  
  const has = (obj: Record<string, unknown>, key: string): boolean =>
    Object.prototype.hasOwnProperty.call(obj, key);

  // Verificar campos obligatorios con protección contra prototype pollution
  const hasFechaPago = has(record, 'Fecha de pago') && record['Fecha de pago'] != null;
  const hasNombreInstrumento = has(record, 'Nombre del instrumento') && record['Nombre del instrumento'] != null;
  const hasDividendoUSD = has(record, 'Dividendo neto recibido (USD)') && record['Dividendo neto recibido (USD)'] != null;
  const hasDividendoEUR = has(record, 'Dividendo neto recibido (EUR)') && record['Dividendo neto recibido (EUR)'] != null;
  
  return hasFechaPago && hasNombreInstrumento && (hasDividendoUSD || hasDividendoEUR);
};

/**
 * Cleans and validates raw Excel data
 */
export const cleanDividendData = (rawData: unknown[]): DividendData[] => {
  if (!Array.isArray(rawData)) {
    return [];
  }
  
  const toStr = (val: unknown): string => {
    const str = String(val ?? '');
    // Sanitizar caracteres de control, manteniendo solo texto imprimible
    // eslint-disable-next-line no-control-regex
    return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
  };
  const toNum = (val: unknown): number => parseFloat(String(val ?? 0)) || 0;

  const validItems = rawData
    .filter((item): item is Record<string, unknown> => validateDividendData(item))
    .map((record): DividendData => ({
      'Fecha de pago': toStr(record['Fecha de pago']),
      'Nombre del instrumento': toStr(record['Nombre del instrumento']),
      'ISIN': toStr(record['ISIN']),
      'Dividendo neto recibido (USD)': toNum(record['Dividendo neto recibido (USD)']),
      'Dividendo neto recibido (EUR)': toNum(record['Dividendo neto recibido (EUR)']),
      'Importe de la retención tributaria (USD)': toNum(record['Importe de la retención tributaria (USD)']),
      'Importe de la retención tributaria (EUR)': toNum(record['Importe de la retención tributaria (EUR)']),
      'Tasa de retención fiscal (%)': toStr(record['Tasa de retención fiscal (%)']),
      'ID de posición': toStr(record['ID de posición']),
      'Tipo': toStr(record['Tipo']),
    }))
    .filter(item => 
      item['Fecha de pago'] && 
      item['Nombre del instrumento'] && 
      (item['Dividendo neto recibido (USD)'] > 0 || item['Dividendo neto recibido (EUR)'] > 0)
    );
  
  return validItems;
};

/**
 * Sorts data by date (newest first)
 */
export const sortByDate = <T extends { fechaFormatted: Date }>(data: T[]): T[] => {
  return [...data].sort((a, b) => b.fechaFormatted.getTime() - a.fechaFormatted.getTime());
};
