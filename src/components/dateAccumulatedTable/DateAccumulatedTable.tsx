import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import React from 'react';

interface DividendData {
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

interface Props {
  data: DividendData[];
}

const DateAccumulatedTable: React.FC<Props> = ({ data }) => {
  const groupedData = data.reduce((acc, curr) => {
    const date = curr["Fecha de pago"];
    if (!acc[date]) {
      acc[date] = {
        fecha: date,
        totalUSD: 0,
        totalEUR: 0,
      };
    }
    acc[date].totalUSD += curr["Dividendo neto recibido (USD)"];
    acc[date].totalEUR += curr["Dividendo neto recibido (EUR)"];
    return acc;
  }, {} as Record<string, { fecha: string; totalUSD: number; totalEUR: number }>);

  const rows = Object.values(groupedData);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Totales Acumulados por Fecha
      </Typography>
      <TableContainer component={Paper} style={{ width: '100%' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Fecha</TableCell>
              <TableCell>Total USD</TableCell>
              <TableCell>Total EUR</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={index}>
                <TableCell>{row.fecha}</TableCell>
                <TableCell>{row.totalUSD.toFixed(2)}</TableCell>
                <TableCell>{row.totalEUR.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default DateAccumulatedTable;
