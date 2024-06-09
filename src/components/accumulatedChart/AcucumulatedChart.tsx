import { Box, Typography } from '@mui/material';
import { CategoryScale, Chart as ChartJS, Legend, LineElement, LinearScale, PointElement, Title, Tooltip } from 'chart.js';
import React from 'react';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

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

const AccumulatedChart: React.FC<Props> = ({ data }) => {
  const groupedData = data.reduce((acc, curr) => {
    const date = curr["Fecha de pago"];
    if (!acc[date]) {
      acc[date] = {
        fecha: date,
        totalUSD: 0,
      };
    }
    acc[date].totalUSD += curr["Dividendo neto recibido (USD)"];
    return acc;
  }, {} as Record<string, { fecha: string; totalUSD: number }>);

  const dates = Object.keys(groupedData).sort();
  const totalUSD = dates.map(date => groupedData[date].totalUSD);

  // Acumulado de fechas anteriores
  const cumulativeTotalUSD = totalUSD.reduce((acc, value, index) => {
    if (index === 0) {
      acc.push(value);
    } else {
      acc.push(acc[index - 1] + value);
    }
    return acc;
  }, [] as number[]);

  const dataChart = {
    labels: dates,
    datasets: [
      {
        label: 'Total USD',
        data: totalUSD,
        borderColor: 'rgba(75,192,192,1)',
        backgroundColor: 'rgba(75,192,192,0.2)',
      },
    ],
  };

  const cumulativeDataChart = {
    labels: dates,
    datasets: [
      {
        label: 'Cumulative Total USD',
        data: cumulativeTotalUSD,
        borderColor: 'rgba(153,102,255,1)',
        backgroundColor: 'rgba(153,102,255,0.2)',
      },
    ],
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Gráfico por fecha en USD
      </Typography>
      <Line data={dataChart} />
      <Typography variant="h6" gutterBottom mt={4}>
        Gráfico Acumulativo en USD
      </Typography>
      <Line data={cumulativeDataChart} />
    </Box>
  );
};

export default AccumulatedChart;
