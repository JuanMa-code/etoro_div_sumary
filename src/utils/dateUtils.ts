import { DividendData, DateAccumulatedData } from '../types/dividend';

const pad2 = (n: number): string => n.toString().padStart(2, '0');

/**
 * Builds a Date at local midnight, or null when the parts do not form a real
 * calendar day. setFullYear keeps years 0-99 as-is instead of mapping them to
 * 1900-1999 (the Date constructor does that), and the round-trip check rejects
 * rolled-over days such as 31/02.
 */
const buildLocalDate = (year: number, monthIndex: number, day: number): Date | null => {
  const date = new Date(year, monthIndex, day);
  date.setFullYear(year, monthIndex, day);
  if (isNaN(date.getTime()) || date.getMonth() !== monthIndex || date.getDate() !== day) {
    return null;
  }
  return date;
};

// An optional time suffix (" 10:15:00", "T10:15") is accepted and ignored.
const DMY_PATTERN = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:[ T].*)?$/;
const YMD_PATTERN = /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})(?:[ T].*)?$/;

/**
 * Parses an Excel cell value (DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, or an Excel
 * serial number) into a local-midnight Date. Returns null when the value
 * cannot be read as a date, so callers can drop the row instead of guessing.
 */
export const tryParseExcelDate = (value: unknown): Date | null => {
  if (value === null || value === undefined || value === '') return null;

  // Excel serials are anchored to UTC: rebuild from the UTC parts so the day
  // does not shift in negative-offset timezones.
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value <= 0) return null;
    const utc = new Date(Math.round((value - 25569) * 86400 * 1000));
    return buildLocalDate(utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate());
  }

  const str = String(value).trim();

  const dmy = str.match(DMY_PATTERN);
  if (dmy) return buildLocalDate(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));

  const ymd = str.match(YMD_PATTERN);
  if (ymd) return buildLocalDate(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]));

  // Last resort: native parsing, truncated to local midnight so every date in
  // the app is comparable with the ones built above.
  const fallback = new Date(str);
  if (isNaN(fallback.getTime())) return null;
  return buildLocalDate(fallback.getFullYear(), fallback.getMonth(), fallback.getDate());
};

/**
 * Same as tryParseExcelDate but never fails: unreadable input yields today at
 * local midnight. Rows coming out of cleanDividendData always parse, so the
 * fallback is only reachable with raw, uncleaned values.
 */
export const parseExcelDate = (dateStr: string | number): Date => {
  const parsed = tryParseExcelDate(dateStr);
  if (parsed) return parsed;
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

/**
 * Formats a date to DD/MM/YYYY format
 */
export const formatDate = (date: Date): string =>
  `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`;

/**
 * YYYY-MM key used to bucket rows by month. Zero-padded so that a plain string
 * sort is chronological ("2024-02" < "2024-10").
 */
export const toMonthKey = (date: Date): string =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;

/**
 * Formats a date as YYYY-MM-DD from its local parts, for <input type="date">.
 * toISOString() is avoided because it converts to UTC and can move the day.
 */
export const toDateInputValue = (date: Date): string =>
  `${date.getFullYear().toString().padStart(4, '0')}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

/**
 * Parses a YYYY-MM-DD value from <input type="date"> as local midnight.
 * new Date('YYYY-MM-DD') would read it as UTC midnight, which does not compare
 * correctly against dates built in local time.
 */
export const parseDateInputValue = (value: string): Date | null => {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return buildLocalDate(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
};

/**
 * Returns the last representable instant of the given day, in local time
 */
export const endOfDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

/**
 * Arithmetic mean; 0 for an empty list so callers never divide by zero.
 */
export const average = (values: number[]): number =>
  values.length === 0 ? 0 : values.reduce((sum, v) => sum + v, 0) / values.length;

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

  // Own-property checks guard against prototype pollution.
  const hasFechaPago = has(record, 'Fecha de pago') && record['Fecha de pago'] != null;
  const hasNombreInstrumento = has(record, 'Nombre del instrumento') && record['Nombre del instrumento'] != null;
  const hasDividendoUSD = has(record, 'Dividendo neto recibido (USD)') && record['Dividendo neto recibido (USD)'] != null;
  const hasDividendoEUR = has(record, 'Dividendo neto recibido (EUR)') && record['Dividendo neto recibido (EUR)'] != null;

  return hasFechaPago && hasNombreInstrumento && (hasDividendoUSD || hasDividendoEUR);
};

/**
 * Cleans and validates raw Excel data. Rows without an instrument name, with a
 * date that cannot be parsed, or with no positive amount in either currency
 * are dropped.
 */
export const cleanDividendData = (rawData: unknown[]): DividendData[] => {
  if (!Array.isArray(rawData)) {
    return [];
  }

  const toStr = (val: unknown): string => {
    const str = String(val ?? '');
    // Strip control characters, keeping only printable text.
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
      item['Nombre del instrumento'] &&
      tryParseExcelDate(item['Fecha de pago']) !== null &&
      (item['Dividendo neto recibido (USD)'] > 0 || item['Dividendo neto recibido (EUR)'] > 0)
    );

  return validItems;
};

/**
 * Groups rows by payment day, oldest first, with running totals. Grouping is
 * done on the parsed day rather than the raw cell text, so "05/03/2024" and
 * "5/3/2024" land on the same row. Shared by the date table and the chart.
 */
export const accumulateByDate = (data: DividendData[]): DateAccumulatedData[] => {
  const byDay = new Map<string, DateAccumulatedData>();

  for (const item of data) {
    const fechaFormatted = parseExcelDate(item['Fecha de pago']);
    const key = toDateInputValue(fechaFormatted);
    let row = byDay.get(key);
    if (!row) {
      row = {
        fecha: item['Fecha de pago'],
        fechaFormatted,
        totalUSD: 0,
        totalEUR: 0,
        cumulativeUSD: 0,
        cumulativeEUR: 0,
      };
      byDay.set(key, row);
    }
    row.totalUSD += item['Dividendo neto recibido (USD)'];
    row.totalEUR += item['Dividendo neto recibido (EUR)'];
  }

  const rows = [...byDay.values()].sort(
    (a, b) => a.fechaFormatted.getTime() - b.fechaFormatted.getTime()
  );

  let cumulativeUSD = 0;
  let cumulativeEUR = 0;
  for (const row of rows) {
    cumulativeUSD += row.totalUSD;
    cumulativeEUR += row.totalEUR;
    row.cumulativeUSD = cumulativeUSD;
    row.cumulativeEUR = cumulativeEUR;
  }

  return rows;
};

/**
 * Sorts data by date (newest first)
 */
export const sortByDate = <T extends { fechaFormatted: Date }>(data: T[]): T[] => {
  return [...data].sort((a, b) => b.fechaFormatted.getTime() - a.fechaFormatted.getTime());
};
