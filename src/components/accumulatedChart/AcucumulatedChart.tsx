import { Box, Typography, Paper, ToggleButton, ToggleButtonGroup, Stack } from '@mui/material';
import { 
  CategoryScale, 
  Chart as ChartJS, 
  Legend, 
  LineElement, 
  LinearScale, 
  PointElement, 
  Title, 
  Tooltip,
  ChartOptions 
} from 'chart.js';
import React, { useState, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { DividendData } from '../../types/dividend';
import { parseExcelDate, formatDate } from '../../utils/dateUtils';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface Props {
  data: DividendData[];
}

const AccumulatedChart: React.FC<Props> = ({ data }) => {
  const [currency, setCurrency] = useState<'USD' | 'EUR' | 'both'>('USD');
  const [chartType, setChartType] = useState<'monthly' | 'cumulative'>('cumulative');

  const processedData = useMemo(() => {
    // Group by date
    const groupedData = data.reduce((acc, curr) => {
      const date = curr["Fecha de pago"];
      if (!acc[date]) {
        acc[date] = {
          fecha: date,
          fechaFormatted: parseExcelDate(date),
          totalUSD: 0,
          totalEUR: 0,
        };
      }
      acc[date].totalUSD += curr["Dividendo neto recibido (USD)"];
      acc[date].totalEUR += curr["Dividendo neto recibido (EUR)"];
      return acc;
    }, {} as Record<string, { fecha: string; fechaFormatted: Date; totalUSD: number; totalEUR: number }>);

    // Sort by date (oldest first)
    const sortedData = Object.values(groupedData).sort((a, b) => 
      a.fechaFormatted.getTime() - b.fechaFormatted.getTime()
    );

    // Calculate cumulative totals
    let cumulativeUSD = 0;
    let cumulativeEUR = 0;
    
    return sortedData.map(item => {
      cumulativeUSD += item.totalUSD;
      cumulativeEUR += item.totalEUR;
      
      return {
        ...item,
        cumulativeUSD,
        cumulativeEUR,
        formattedDate: formatDate(item.fechaFormatted)
      };
    });
  }, [data]);

  const chartData = useMemo(() => {
    const labels = processedData.map(item => item.formattedDate);
    const datasets = [];

    if (chartType === 'monthly') {
      if (currency === 'USD' || currency === 'both') {
        datasets.push({
          label: 'Dividendos Mensuales USD',
          data: processedData.map(item => item.totalUSD),
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0.1)',
          fill: true,
          tension: 0.4,
        });
      }
      
      if (currency === 'EUR' || currency === 'both') {
        datasets.push({
          label: 'Dividendos Mensuales EUR',
          data: processedData.map(item => item.totalEUR),
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.1)',
          fill: true,
          tension: 0.4,
        });
      }
    } else {
      if (currency === 'USD' || currency === 'both') {
        datasets.push({
          label: 'Dividendos Acumulados USD',
          data: processedData.map(item => item.cumulativeUSD),
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.1)',
          fill: true,
          tension: 0.4,
        });
      }
      
      if (currency === 'EUR' || currency === 'both') {
        datasets.push({
          label: 'Dividendos Acumulados EUR',
          data: processedData.map(item => item.cumulativeEUR),
          borderColor: 'rgba(153, 102, 255, 1)',
          backgroundColor: 'rgba(153, 102, 255, 0.1)',
          fill: true,
          tension: 0.4,
        });
      }
    }

    return {
      labels,
      datasets,
    };
  }, [processedData, currency, chartType]);

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: chartType === 'monthly' 
          ? 'Dividendos por Fecha' 
          : 'Evolución Acumulativa de Dividendos',
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function(context) {
            const currencySymbol = context.dataset.label?.includes('USD') ? '$' : '€';
            const value = context.parsed.y.toLocaleString('en-US', { 
              minimumFractionDigits: 2, 
              maximumFractionDigits: 2 
            });
            return `${context.dataset.label}: ${currencySymbol}${value}`;
          }
        }
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Fecha'
        },
        grid: {
          color: 'rgba(200, 200, 200, 0.2)',
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Importe'
        },
        grid: {
          color: 'rgba(200, 200, 200, 0.2)',
        },
        ticks: {
          callback: function(value) {
            const currencySymbol = currency === 'EUR' ? '€' : '$';
            return currencySymbol + Number(value).toLocaleString('en-US', { 
              minimumFractionDigits: 0, 
              maximumFractionDigits: 0 
            });
          }
        }
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
    elements: {
      point: {
        radius: 4,
        hoverRadius: 6,
      }
    }
  };

  const currentTotals = useMemo(() => {
    if (processedData.length === 0) return { USD: 0, EUR: 0 };
    const lastItem = processedData[processedData.length - 1];
    return {
      USD: lastItem.cumulativeUSD,
      EUR: lastItem.cumulativeEUR
    };
  }, [processedData]);

  return (
    <Box sx={{ width: '100%' }}>
      <Stack spacing={2} mb={3}>
        <Typography variant="h6">
          Gráfico de Dividendos
        </Typography>
        
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <Typography variant="body2">Tipo de gráfico:</Typography>
          <ToggleButtonGroup
            value={chartType}
            exclusive
            onChange={(_, newType) => newType && setChartType(newType)}
            size="small"
          >
            <ToggleButton value="monthly">Por Fecha</ToggleButton>
            <ToggleButton value="cumulative">Acumulativo</ToggleButton>
          </ToggleButtonGroup>
          
          <Typography variant="body2">Moneda:</Typography>
          <ToggleButtonGroup
            value={currency}
            exclusive
            onChange={(_, newCurrency) => newCurrency && setCurrency(newCurrency)}
            size="small"
          >
            <ToggleButton value="USD">USD</ToggleButton>
            <ToggleButton value="EUR">EUR</ToggleButton>
            <ToggleButton value="both">Ambas</ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        <Stack direction="row" spacing={2}>
          <Typography variant="body2" color="primary.main">
            <strong>Total Acumulado USD:</strong> ${currentTotals.USD.toLocaleString('en-US', { 
              minimumFractionDigits: 2, 
              maximumFractionDigits: 2 
            })}
          </Typography>
          <Typography variant="body2" color="secondary.main">
            <strong>Total Acumulado EUR:</strong> €{currentTotals.EUR.toLocaleString('es-ES', { 
              minimumFractionDigits: 2, 
              maximumFractionDigits: 2 
            })}
          </Typography>
        </Stack>
      </Stack>

      <Paper elevation={1} sx={{ p: 2, height: '500px', width: '100%' }}>
        <Line data={chartData} options={chartOptions} />
      </Paper>
    </Box>
  );
};

export default AccumulatedChart;
