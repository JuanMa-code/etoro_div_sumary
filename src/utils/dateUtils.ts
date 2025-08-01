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
  
  // Verificar campos obligatorios con más flexibilidad
  const hasFechaPago = 'Fecha de pago' in record && record['Fecha de pago'] != null;
  const hasNombreInstrumento = 'Nombre del instrumento' in record && record['Nombre del instrumento'] != null;
  const hasDividendoUSD = 'Dividendo neto recibido (USD)' in record && record['Dividendo neto recibido (USD)'] != null;
  const hasDividendoEUR = 'Dividendo neto recibido (EUR)' in record && record['Dividendo neto recibido (EUR)'] != null;
  
  return hasFechaPago && hasNombreInstrumento && (hasDividendoUSD || hasDividendoEUR);
};

/**
 * Cleans and validates raw Excel data
 */
export const cleanDividendData = (rawData: unknown[]): DividendData[] => {
  console.log('cleanDividendData - datos recibidos:', rawData.length);
  
  if (!Array.isArray(rawData)) {
    console.error('cleanDividendData - datos no son un array');
    return [];
  }
  
  const validItems = rawData
    .filter((item, index) => {
      const isValid = validateDividendData(item);
      if (!isValid && index < 5) {
        console.log(`Item ${index} no válido:`, item);
      }
      return isValid;
    })
    .map((item) => {
      const record = item as any; // Usar any para evitar problemas de tipo
      
      // Convertir valores de forma más robusta
      const cleanedItem: DividendData = {
        'Fecha de pago': String(record['Fecha de pago'] || ''),
        'Nombre del instrumento': String(record['Nombre del instrumento'] || ''),
        'ISIN': String(record['ISIN'] || ''),
        'Dividendo neto recibido (USD)': parseFloat(String(record['Dividendo neto recibido (USD)'] || 0)) || 0,
        'Dividendo neto recibido (EUR)': parseFloat(String(record['Dividendo neto recibido (EUR)'] || 0)) || 0,
        'Importe de la retención tributaria (USD)': parseFloat(String(record['Importe de la retención tributaria (USD)'] || 0)) || 0,
        'Importe de la retención tributaria (EUR)': parseFloat(String(record['Importe de la retención tributaria (EUR)'] || 0)) || 0,
        'Tasa de retención fiscal (%)': String(record['Tasa de retención fiscal (%)'] || ''),
        'ID de posición': String(record['ID de posición'] || ''),
        'Tipo': String(record['Tipo'] || ''),
      };
      
      return cleanedItem;
    })
    .filter(item => 
      item['Fecha de pago'] && 
      item['Nombre del instrumento'] && 
      (item['Dividendo neto recibido (USD)'] > 0 || item['Dividendo neto recibido (EUR)'] > 0)
    );
  
  console.log('cleanDividendData - items válidos:', validItems.length);
  
  return validItems;
};

/**
 * Sorts data by date (newest first)
 */
export const sortByDate = <T extends { fechaFormatted: Date }>(data: T[]): T[] => {
  return [...data].sort((a, b) => b.fechaFormatted.getTime() - a.fechaFormatted.getTime());
};
