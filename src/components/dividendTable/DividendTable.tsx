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

const DividendTable: React.FC<Props> = ({ data }) => {
  const groupedData = data.reduce((acc, curr) => {
    const key = `${curr["Nombre del instrumento"]}_${curr["Fecha de pago"]}`;
    if (!acc[key]) {
      acc[key] = {
        nombre: curr["Nombre del instrumento"],
        fecha: curr["Fecha de pago"],
        importeUSD: 0,
        importeEUR: 0,
      };
    }
    acc[key].importeUSD += curr["Dividendo neto recibido (USD)"];
    acc[key].importeEUR += curr["Dividendo neto recibido (EUR)"];
    return acc;
  }, {} as Record<string, { nombre: string; fecha: string; importeUSD: number; importeEUR: number }>);

  const rows = Object.values(groupedData);
  const totalUSD = rows.reduce((sum, row) => sum + row.importeUSD, 0);
  const totalEUR = rows.reduce((sum, row) => sum + row.importeEUR, 0);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Total Acumulado:
      </Typography>
      <Typography variant="body1">
        Importe Total USD: {totalUSD.toFixed(2)}
      </Typography>
      <Typography variant="body1" gutterBottom>
        Importe Total EUR: {totalEUR.toFixed(2)}
      </Typography>
      <TableContainer component={Paper} style={{ width: '100%' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell>Importe USD</TableCell>
              <TableCell>Importe EUR</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={index}>
                <TableCell>{row.nombre}</TableCell>
                <TableCell>{row.fecha}</TableCell>
                <TableCell>{row.importeUSD.toFixed(2)}</TableCell>
                <TableCell>{row.importeEUR.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default DividendTable;
