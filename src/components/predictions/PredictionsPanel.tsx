import React, { useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  Alert,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Psychology,
  Timeline,
  Info
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import { DividendData } from '../../types/dividend';
import { parseExcelDate } from '../../utils/dateUtils';

interface Props {
  data: DividendData[];
}

interface PredictionData {
  nextQuarterEstimate: number;
  nextYearEstimate: number;
  trend: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  seasonalPattern: { month: number; multiplier: number }[];
  topGrowthCompanies: { name: string; growth: number; prediction: number }[];
  riskLevel: 'low' | 'medium' | 'high';
}

const PredictionsPanel: React.FC<Props> = ({ data }) => {
  const predictions = useMemo((): PredictionData => {
    if (data.length < 3) {
      return {
        nextQuarterEstimate: 0,
        nextYearEstimate: 0,
        trend: 'neutral',
        confidence: 0,
        seasonalPattern: [],
        topGrowthCompanies: [],
        riskLevel: 'low'
      };
    }

    // Agrupar datos por mes
    const monthlyData = data.reduce((acc, item) => {
      const date = parseExcelDate(item['Fecha de pago']);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      if (!acc[monthKey]) {
        acc[monthKey] = { total: 0, count: 0, month: date.getMonth() };
      }
      acc[monthKey].total += item['Dividendo neto recibido (USD)'];
      acc[monthKey].count += 1;
      return acc;
    }, {} as Record<string, { total: number; count: number; month: number }>);

    const sortedMonths = Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => ({ key, ...value }));

    // Calcular tendencia usando regresión lineal simple
    const calculateTrend = () => {
      if (sortedMonths.length < 2) return { slope: 0, confidence: 0 };
      
      const n = sortedMonths.length;
      const sumX = sortedMonths.reduce((sum, _, i) => sum + i, 0);
      const sumY = sortedMonths.reduce((sum, item) => sum + item.total, 0);
      const sumXY = sortedMonths.reduce((sum, item, i) => sum + i * item.total, 0);
      const sumXX = sortedMonths.reduce((sum, _, i) => sum + i * i, 0);
      
      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      const confidence = Math.min(95, Math.abs(slope) * 10 + (n / 12) * 20);
      
      return { slope, confidence };
    };

    const { slope, confidence } = calculateTrend();
    const trend = slope > 5 ? 'bullish' : slope < -5 ? 'bearish' : 'neutral';

    // Calcular promedio mensual de los últimos 3 meses
    const recent3Months = sortedMonths.slice(-3);
    const avgMonthly = recent3Months.reduce((sum, item) => sum + item.total, 0) / 3;

    // Predicciones
    const nextQuarterEstimate = Math.max(0, avgMonthly * 3 + (slope * 3));
    const nextYearEstimate = Math.max(0, avgMonthly * 12 + (slope * 12));

    // Patrón estacional
    const seasonalPattern = Array.from({ length: 12 }, (_, month) => {
      const monthData = sortedMonths.filter(item => item.month === month);
      const monthAvg = monthData.length > 0 
        ? monthData.reduce((sum, item) => sum + item.total, 0) / monthData.length 
        : avgMonthly;
      const multiplier = monthAvg / avgMonthly;
      return { month, multiplier };
    });

    // Top empresas con crecimiento
    const companyGrowth = data.reduce((acc, item) => {
      const company = item['Nombre del instrumento'];
      const date = parseExcelDate(item['Fecha de pago']);
      const amount = item['Dividendo neto recibido (USD)'];
      
      if (!acc[company]) {
        acc[company] = { amounts: [], dates: [] };
      }
      acc[company].amounts.push(amount);
      acc[company].dates.push(date);
      return acc;
    }, {} as Record<string, { amounts: number[]; dates: Date[] }>);

    const topGrowthCompanies = Object.entries(companyGrowth)
      .map(([name, data]) => {
        if (data.amounts.length < 2) return { name, growth: 0, prediction: 0 };
        
        const recent = data.amounts.slice(-3).reduce((sum, amt) => sum + amt, 0) / 3;
        const older = data.amounts.slice(0, -3).reduce((sum, amt) => sum + amt, 0) / Math.max(1, data.amounts.length - 3);
        const growth = ((recent - older) / older) * 100;
        const prediction = recent * (1 + growth / 100);
        
        return { name, growth, prediction };
      })
      .filter(item => !isNaN(item.growth))
      .sort((a, b) => b.growth - a.growth)
      .slice(0, 5);

    // Nivel de riesgo basado en volatilidad
    const volatility = sortedMonths.length > 1 
      ? Math.sqrt(sortedMonths.reduce((sum, item) => {
          const diff = item.total - avgMonthly;
          return sum + diff * diff;
        }, 0) / (sortedMonths.length - 1)) / avgMonthly
      : 0;

    const riskLevel = volatility > 0.5 ? 'high' : volatility > 0.2 ? 'medium' : 'low';

    return {
      nextQuarterEstimate,
      nextYearEstimate,
      trend,
      confidence,
      seasonalPattern,
      topGrowthCompanies,
      riskLevel
    };
  }, [data]);

  // Datos para el gráfico de predicción
  const chartData = useMemo(() => {
    const monthlyTotals = data.reduce((acc, item) => {
      const date = parseExcelDate(item['Fecha de pago']);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      acc[monthKey] = (acc[monthKey] || 0) + item['Dividendo neto recibido (USD)'];
      return acc;
    }, {} as Record<string, number>);

    const sortedData = Object.entries(monthlyTotals)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12); // Últimos 12 meses

    const labels = sortedData.map(([key]) => key);
    const values = sortedData.map(([, value]) => value);
    
    // Agregar predicciones
    const lastMonth = new Date();
    const nextMonths = [];
    for (let i = 1; i <= 3; i++) {
      const nextMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + i, 1);
      nextMonths.push(`${nextMonth.getFullYear()}-${(nextMonth.getMonth() + 1).toString().padStart(2, '0')}`);
    }

    const avgLast3 = values.slice(-3).reduce((sum, val) => sum + val, 0) / 3;
    const predictedValues = nextMonths.map(() => avgLast3 * 1.05); // 5% crecimiento estimado

    return {
      labels: [...labels, ...nextMonths],
      datasets: [
        {
          label: 'Dividendos Históricos',
          data: [...values, ...Array(3).fill(null)],
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0.1)',
          fill: false,
          tension: 0.4,
        },
        {
          label: 'Predicción',
          data: [...Array(values.length).fill(null), ...predictedValues],
          borderColor: 'rgba(255, 159, 64, 1)',
          backgroundColor: 'rgba(255, 159, 64, 0.1)',
          borderDash: [5, 5],
          fill: false,
          tension: 0.4,
        }
      ]
    };
  }, [data]);

  if (data.length < 3) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="body2">
          Se necesitan al menos 3 registros de dividendos para generar predicciones confiables.
        </Typography>
      </Alert>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        🔮 Predicciones y Análisis IA
      </Typography>

      <Grid container spacing={3} sx={{ width: '100%' }}>
        {/* Predicciones principales */}
        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Psychology color="primary" />
                <Typography variant="h6">Predicciones</Typography>
                <Tooltip title={`Confianza: ${predictions.confidence.toFixed(1)}%`}>
                  <IconButton size="small">
                    <Info fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Próximo trimestre
                </Typography>
                <Typography variant="h5" color="primary" fontWeight="bold">
                  ${predictions.nextQuarterEstimate.toFixed(2)}
                </Typography>
              </Box>
              
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Próximo año
                </Typography>
                <Typography variant="h5" color="secondary" fontWeight="bold">
                  ${predictions.nextYearEstimate.toFixed(2)}
                </Typography>
              </Box>

              <Box display="flex" alignItems="center" gap={1}>
                {predictions.trend === 'bullish' ? (
                  <TrendingUp color="success" />
                ) : predictions.trend === 'bearish' ? (
                  <TrendingDown color="error" />
                ) : (
                  <Timeline color="warning" />
                )}
                <Chip 
                  label={
                    predictions.trend === 'bullish' ? 'Tendencia Alcista' :
                    predictions.trend === 'bearish' ? 'Tendencia Bajista' :
                    'Tendencia Neutral'
                  }
                  color={
                    predictions.trend === 'bullish' ? 'success' :
                    predictions.trend === 'bearish' ? 'error' :
                    'warning'
                  }
                  size="small"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Nivel de riesgo */}
        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📊 Análisis de Riesgo
              </Typography>
              
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary" mb={1}>
                  Nivel de riesgo de la cartera
                </Typography>
                <Chip 
                  label={
                    predictions.riskLevel === 'low' ? 'Bajo Riesgo' :
                    predictions.riskLevel === 'medium' ? 'Riesgo Moderado' :
                    'Alto Riesgo'
                  }
                  color={
                    predictions.riskLevel === 'low' ? 'success' :
                    predictions.riskLevel === 'medium' ? 'warning' :
                    'error'
                  }
                />
              </Box>

              <Box mb={2}>
                <Typography variant="body2" color="text.secondary" mb={1}>
                  Confianza en predicciones
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={predictions.confidence}
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography variant="caption" color="text.secondary">
                  {predictions.confidence.toFixed(1)}%
                </Typography>
              </Box>

              <Typography variant="body2" color="text.secondary">
                Basado en volatilidad histórica y consistencia de pagos
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Empresas con mejor crecimiento */}
        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🚀 Top Crecimiento
              </Typography>
              
              {predictions.topGrowthCompanies.slice(0, 3).map((company) => (
                <Box key={company.name} mb={1}>
                  <Typography variant="body2" noWrap>
                    {company.name.substring(0, 20)}...
                  </Typography>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Chip 
                      label={`${company.growth > 0 ? '+' : ''}${company.growth.toFixed(1)}%`}
                      color={company.growth > 0 ? 'success' : 'error'}
                      size="small"
                    />
                    <Typography variant="caption" color="text.secondary">
                      Pred: ${company.prediction.toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Gráfico de predicción */}
        <Grid item xs={12}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📈 Proyección de Dividendos
              </Typography>
              <Box height={300}>
                <Line 
                  data={chartData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'top' },
                      title: {
                        display: true,
                        text: 'Histórico vs Predicción (Próximos 3 meses)'
                      }
                    },
                    scales: {
                      y: {
                        title: { display: true, text: 'Dividendos USD' }
                      }
                    }
                  }}
                />
              </Box>
              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  ⚠️ Las predicciones son estimaciones basadas en datos históricos y no garantizan resultados futuros.
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PredictionsPanel;
