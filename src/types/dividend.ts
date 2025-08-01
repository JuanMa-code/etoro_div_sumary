export interface DividendData {
  "Fecha de pago": string;
  "Nombre del instrumento": string;
  "Dividendo neto recibido (USD)": number;
  "Dividendo neto recibido (EUR)": number;
  "Tasa de retención fiscal (%)": string;
  "Importe de la retención tributaria (USD)": number;
  "Importe de la retención tributaria (EUR)": number;
  "ID de posición": string;
  "Tipo": string;
  "ISIN": string;
}

export interface ProcessedDividendData {
  nombre: string;
  fecha: string;
  fechaFormatted: Date;
  importeUSD: number;
  importeEUR: number;
}

export interface DateAccumulatedData {
  fecha: string;
  fechaFormatted: Date;
  totalUSD: number;
  totalEUR: number;
  cumulativeUSD: number;
  cumulativeEUR: number;
}
