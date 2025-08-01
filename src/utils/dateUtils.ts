import { DividendData } from '../types/dividend';

/**
 * Parses a date string from Excel format to JavaScript Date
 * Handles multiple date formats: DD/MM/YYYY, DD-MM-YYYY, MM/DD/YYYY
 */
export const parseExcelDate = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  
  // If it's already a number (Excel serial date), convert it
  if (typeof dateStr === 'number') {
    return new Date((dateStr - 25569) * 86400 * 1000);
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
 * Validates dividend data structure
 */
export const validateDividendData = (data: unknown): data is DividendData => {
  if (!data || typeof data !== 'object' || data === null) {
    return false;
  }
  
  const record = data as Record<string, unknown>;
  return (
    'Fecha de pago' in record &&
    'Nombre del instrumento' in record &&
    'Dividendo neto recibido (USD)' in record &&
    'Dividendo neto recibido (EUR)' in record &&
    typeof record['Fecha de pago'] === 'string' &&
    typeof record['Nombre del instrumento'] === 'string' &&
    typeof record['Dividendo neto recibido (USD)'] === 'number' &&
    typeof record['Dividendo neto recibido (EUR)'] === 'number'
  );
};

/**
 * Cleans and validates raw Excel data
 */
export const cleanDividendData = (rawData: unknown[]): DividendData[] => {
  return rawData
    .filter((item): item is DividendData => validateDividendData(item) && 
      Boolean(item['Fecha de pago']) && Boolean(item['Nombre del instrumento']))
    .map((item) => ({
      ...item,
      'Dividendo neto recibido (USD)': Number(item['Dividendo neto recibido (USD)']) || 0,
      'Dividendo neto recibido (EUR)': Number(item['Dividendo neto recibido (EUR)']) || 0,
      'Importe de la retención tributaria (USD)': Number(item['Importe de la retención tributaria (USD)']) || 0,
      'Importe de la retención tributaria (EUR)': Number(item['Importe de la retención tributaria (EUR)']) || 0,
    }));
};

/**
 * Sorts data by date (newest first)
 */
export const sortByDate = <T extends { fechaFormatted: Date }>(data: T[]): T[] => {
  return [...data].sort((a, b) => b.fechaFormatted.getTime() - a.fechaFormatted.getTime());
};
