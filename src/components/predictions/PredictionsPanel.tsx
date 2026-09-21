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
import { ChartData } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { DividendData } from '../../types/dividend';
import { parseExcelDate, toMonthKey, average } from '../../utils/dateUtils';

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

interface ParsedRow {
  company: string;
  date: Date;
  monthKey: string;
  month: number;
  amount: number;
}

const EMPTY_PREDICTIONS: PredictionData = {
  nextQuarterEstimate: 0,
  nextYearEstimate: 0,
  trend: 'neutral',
  confidence: 0,
  seasonalPattern: [],
  topGrowthCompanies: [],
  riskLevel: 'low'
};

const MIN_ROWS = 3;

const PredictionsPanel: React.FC<Props> = ({ data }) => {
  // Cada fila se parsea una sola vez y se ordena cronológicamente: el fichero
  // de eToro llega de más reciente a más antiguo y los cálculos de ventana
  // (últimos N pagos, últimos N meses) necesitan el orden real.
  const rows = useMemo((): ParsedRow[] =>
    data
      .map(item => {
        const date = parseExcelDate(item['Fecha de pago']);
        return {
          company: item['Nombre del instrumento'],
          date,
          monthKey: toMonthKey(date),
          month: date.getMonth(),
          amount: item['Dividendo neto recibido (USD)']
        };
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime()),
  [data]);

  const predictions = useMemo((): PredictionData => {
    if (rows.length < MIN_ROWS) return EMPTY_PREDICTIONS;

    // Agrupar datos por mes. La clave YYYY-MM va con relleno de ceros, así
    // que ordenar las claves como texto equivale a ordenar cronológicamente.
    const monthlyData = new Map<string, { total: number; count: number; month: number }>();
    for (const row of rows) {
      const bucket = monthlyData.get(row.monthKey);
      if (bucket) {
        bucket.total += row.amount;
        bucket.count += 1;
      } else {
        monthlyData.set(row.monthKey, { total: row.amount, count: 1, month: row.month });
      }
    }

    const sortedMonths = [...monthlyData.entries()]
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

    // Promedio mensual de los últimos 3 meses (o los que haya)
    const avgMonthly = average(sortedMonths.slice(-3).map(item => item.total));

    // Predicciones
    const nextQuarterEstimate = Math.max(0, avgMonthly * 3 + (slope * 3));
    const nextYearEstimate = Math.max(0, avgMonthly * 12 + (slope * 12));

    // Patrón estacional
    const seasonalPattern = Array.from({ length: 12 }, (_, month) => {
      const monthData = sortedMonths.filter(item => item.month === month);
      const monthAvg = monthData.length > 0
        ? average(monthData.map(item => item.total))
        : avgMonthly;
      const multiplier = avgMonthly > 0 ? monthAvg / avgMonthly : 1;
      return { month, multiplier };
    });

    // Historial de pagos por empresa, ya en orden cronológico porque rows lo está.
    const amountsByCompany = new Map<string, number[]>();
    for (const row of rows) {
      const amounts = amountsByCompany.get(row.company);
      if (amounts) {
        amounts.push(row.amount);
      } else {
        amountsByCompany.set(row.company, [row.amount]);
      }
    }

    // Una empresa necesita pagos a ambos lados de la ventana de 3 para tener
    // crecimiento calculable; las demás se omiten en vez de aparecer con 0%.
    const topGrowthCompanies = [...amountsByCompany.entries()]
      .flatMap(([name, amounts]) => {
        const olderWindow = amounts.slice(0, -3);
        if (olderWindow.length === 0) return [];

        const recent = average(amounts.slice(-3));
        const older = average(olderWindow);
        if (older === 0) return [];

        const growth = ((recent - older) / older) * 100;
        return [{ name, growth, prediction: recent * (1 + growth / 100) }];
      })
      .sort((a, b) => b.growth - a.growth)
      .slice(0, 5);

    // Nivel de riesgo basado en volatilidad
    const volatility = sortedMonths.length > 1 && avgMonthly > 0
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
  }, [rows]);

  // Datos para el gráfico de predicción
  const chartData = useMemo((): ChartData<'line', (number | null)[], string> => {
    if (rows.length < MIN_ROWS) return { labels: [], datasets: [] };

    const monthlyTotals = new Map<string, number>();
    for (const row of rows) {
      monthlyTotals.set(row.monthKey, (monthlyTotals.get(row.monthKey) ?? 0) + row.amount);
    }

    const sortedData = [...monthlyTotals.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12); // Últimos 12 meses

    const labels = sortedData.map(([key]) => key);
    const values = sortedData.map(([, value]) => value);

    // Las predicciones continúan desde el último mes con datos, no desde hoy:
    // con un fichero antiguo las etiquetas dejaban un hueco o se solapaban.
    const [lastYear, lastMonthNumber] = labels[labels.length - 1].split('-').map(Number);
    const nextMonths: string[] = [];
    for (let i = 1; i <= 3; i++) {
      nextMonths.push(toMonthKey(new Date(lastYear, lastMonthNumber - 1 + i, 1)));
    }

    const avgLast3 = average(values.slice(-3));
    const predictedValues = nextMonths.map(() => avgLast3 * 1.05); // 5% crecimiento estimado

    return {
      labels: [...labels, ...nextMonths],
      datasets: [
        {
          label: 'Dividendos Históricos',
          data: [...values, ...nextMonths.map(() => null)],
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0.1)',
          fill: false,
          tension: 0.4,
        },
        {
          label: 'Predicción',
          data: [...values.map(() => null), ...predictedValues],
          borderColor: 'rgba(255, 159, 64, 1)',
          backgroundColor: 'rgba(255, 159, 64, 0.1)',
          borderDash: [5, 5],
          fill: false,
          tension: 0.4,
        }
      ]
    };
  }, [rows]);

  if (data.length < MIN_ROWS) {
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
        <Grid size={{ xs: 12, md: 4 }}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Psychology color="primary" />
                <Typography variant="h6">Predicciones</Typography>
                <Tooltip title={`Confianza: ${predictions.confidence.toFixed(1)}%`}>
                  <IconButton size="small">
                    <Info fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Próximo trimestre
                </Typography>
                <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold' }}>
                  ${predictions.nextQuarterEstimate.toFixed(2)}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Próximo año
                </Typography>
                <Typography variant="h5" color="secondary" sx={{ fontWeight: 'bold' }}>
                  ${predictions.nextYearEstimate.toFixed(2)}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
        <Grid size={{ xs: 12, md: 4 }}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📊 Análisis de Riesgo
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
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

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
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
        <Grid size={{ xs: 12, md: 4 }}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🚀 Top Crecimiento
              </Typography>

              {predictions.topGrowthCompanies.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  Aún no hay empresas con historial suficiente (más de 3 pagos).
                </Typography>
              )}

              {predictions.topGrowthCompanies.slice(0, 3).map((company) => (
                <Box key={company.name} sx={{ mb: 1 }}>
                  <Typography variant="body2" noWrap title={company.name}>
                    {company.name.length > 20
                      ? `${company.name.substring(0, 20)}...`
                      : company.name}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
        <Grid size={{ xs: 12 }}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📈 Proyección de Dividendos
              </Typography>
              <Box sx={{ height: 300 }}>
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
