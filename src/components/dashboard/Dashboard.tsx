import React, { useMemo } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  LinearProgress,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AccountBalance,
  CalendarToday,
  Info
} from '@mui/icons-material';
import { DividendData } from '../../types/dividend';
import { parseExcelDate, formatDate } from '../../utils/dateUtils';

interface Props {
  data: DividendData[];
}

interface DashboardMetrics {
  totalUSD: number;
  totalEUR: number;
  totalTransactions: number;
  uniqueCompanies: number;
  averagePerTransaction: number;
  bestMonth: { month: string; amount: number };
  bestCompany: { name: string; amount: number };
  firstDividend: Date;
  lastDividend: Date;
  monthlyAverage: number;
  trend: 'up' | 'down' | 'stable';
}

const Dashboard: React.FC<Props> = ({ data }) => {
  const metrics = useMemo((): DashboardMetrics => {
    if (data.length === 0) {
      return {
        totalUSD: 0,
        totalEUR: 0,
        totalTransactions: 0,
        uniqueCompanies: 0,
        averagePerTransaction: 0,
        bestMonth: { month: '', amount: 0 },
        bestCompany: { name: '', amount: 0 },
        firstDividend: new Date(),
        lastDividend: new Date(),
        monthlyAverage: 0,
        trend: 'stable'
      };
    }

    // Totales básicos
    const totalUSD = data.reduce((sum, item) => sum + item['Dividendo neto recibido (USD)'], 0);
    const totalEUR = data.reduce((sum, item) => sum + item['Dividendo neto recibido (EUR)'], 0);
    const totalTransactions = data.length;
    const uniqueCompanies = new Set(data.map(item => item['Nombre del instrumento'])).size;
    const averagePerTransaction = totalUSD / totalTransactions;

    // Fechas
    const dates = data.map(item => parseExcelDate(item['Fecha de pago'])).sort((a, b) => a.getTime() - b.getTime());
    const firstDividend = dates[0];
    const lastDividend = dates[dates.length - 1];

    // Mejor mes
    const monthlyTotals = data.reduce((acc, item) => {
      const date = parseExcelDate(item['Fecha de pago']);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      acc[monthKey] = (acc[monthKey] || 0) + item['Dividendo neto recibido (USD)'];
      return acc;
    }, {} as Record<string, number>);

    const bestMonthEntry = Object.entries(monthlyTotals).reduce((best, [month, amount]) => 
      amount > best.amount ? { month, amount } : best, { month: '', amount: 0 });

    // Mejor empresa
    const companyTotals = data.reduce((acc, item) => {
      const company = item['Nombre del instrumento'];
      acc[company] = (acc[company] || 0) + item['Dividendo neto recibido (USD)'];
      return acc;
    }, {} as Record<string, number>);

    const bestCompanyEntry = Object.entries(companyTotals).reduce((best, [name, amount]) => 
      amount > best.amount ? { name, amount } : best, { name: '', amount: 0 });

    // Promedio mensual
    const monthsDiff = Math.max(1, (lastDividend.getTime() - firstDividend.getTime()) / (1000 * 60 * 60 * 24 * 30));
    const monthlyAverage = totalUSD / monthsDiff;

    // Tendencia (últimos 3 meses vs anteriores)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const recentDividends = data.filter(item => parseExcelDate(item['Fecha de pago']) >= threeMonthsAgo);
    const olderDividends = data.filter(item => parseExcelDate(item['Fecha de pago']) < threeMonthsAgo);
    
    const recentAvg = recentDividends.length > 0 ? 
      recentDividends.reduce((sum, item) => sum + item['Dividendo neto recibido (USD)'], 0) / 3 : 0;
    const olderAvg = olderDividends.length > 0 ? 
      olderDividends.reduce((sum, item) => sum + item['Dividendo neto recibido (USD)'], 0) / Math.max(1, monthsDiff - 3) : 0;
    
    const trend = recentAvg > olderAvg * 1.1 ? 'up' : recentAvg < olderAvg * 0.9 ? 'down' : 'stable';

    return {
      totalUSD,
      totalEUR,
      totalTransactions,
      uniqueCompanies,
      averagePerTransaction,
      bestMonth: { month: bestMonthEntry.month, amount: bestMonthEntry.amount },
      bestCompany: { name: bestCompanyEntry.name, amount: bestCompanyEntry.amount },
      firstDividend,
      lastDividend,
      monthlyAverage,
      trend
    };
  }, [data]);

  const MetricCard: React.FC<{
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
    tooltip?: string;
  }> = ({ title, value, subtitle, icon, color = 'primary', tooltip }) => (
    <Card elevation={2} sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          <Box display="flex" alignItems="center">
            {tooltip && (
              <Tooltip title={tooltip}>
                <IconButton size="small">
                  <Info fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Box color={`${color}.main`}>{icon}</Box>
          </Box>
        </Box>
        <Typography variant="h4" component="div" color={`${color}.main`} fontWeight="bold">
          {typeof value === 'number' ? value.toLocaleString('en-US', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
          }) : value}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" mt={1}>
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  if (data.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="h6" color="text.secondary">
          Carga un archivo para ver el dashboard
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        📊 Dashboard de Dividendos
      </Typography>
      
      <Grid container spacing={3} sx={{ width: '100%' }}>
        {/* Totales */}
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total USD"
            value={`$${metrics.totalUSD.toFixed(2)}`}
            icon={<AccountBalance />}
            color="primary"
            tooltip="Total de dividendos recibidos en dólares estadounidenses"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total EUR"
            value={`€${metrics.totalEUR.toFixed(2)}`}
            icon={<AccountBalance />}
            color="secondary"
            tooltip="Total de dividendos recibidos en euros"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Transacciones"
            value={metrics.totalTransactions}
            subtitle={`${metrics.uniqueCompanies} empresas únicas`}
            icon={<CalendarToday />}
            color="success"
            tooltip="Número total de pagos de dividendos recibidos"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Tendencia"
            value={metrics.trend === 'up' ? 'Creciente' : metrics.trend === 'down' ? 'Decreciente' : 'Estable'}
            subtitle={`Promedio: $${metrics.monthlyAverage.toFixed(2)}/mes`}
            icon={metrics.trend === 'up' ? <TrendingUp /> : metrics.trend === 'down' ? <TrendingDown /> : <TrendingUp />}
            color={metrics.trend === 'up' ? 'success' : metrics.trend === 'down' ? 'error' : 'warning'}
            tooltip="Tendencia basada en los últimos 3 meses comparado con el histórico"
          />
        </Grid>

        {/* Información detallada */}
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🏆 Mejores Rendimientos
              </Typography>
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Mejor mes
                </Typography>
                <Typography variant="h6" color="primary">
                  {metrics.bestMonth.month} - ${metrics.bestMonth.amount.toFixed(2)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Mejor empresa
                </Typography>
                <Typography variant="h6" color="secondary">
                  {metrics.bestCompany.name.substring(0, 30)}...
                </Typography>
                <Typography variant="body1" color="secondary">
                  ${metrics.bestCompany.amount.toFixed(2)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📅 Información Temporal
              </Typography>
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Primer dividendo
                </Typography>
                <Typography variant="body1">
                  {formatDate(metrics.firstDividend)}
                </Typography>
              </Box>
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Último dividendo
                </Typography>
                <Typography variant="body1">
                  {formatDate(metrics.lastDividend)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Promedio por transacción
                </Typography>
                <Typography variant="h6" color="primary">
                  ${metrics.averagePerTransaction.toFixed(2)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Progreso hacia objetivos */}
        <Grid item xs={12}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🎯 Progreso del Año
              </Typography>
              <Box mb={2}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">
                    Objetivo anual estimado: ${(metrics.monthlyAverage * 12).toFixed(2)}
                  </Typography>
                  <Typography variant="body2">
                    {((metrics.totalUSD / (metrics.monthlyAverage * 12)) * 100).toFixed(1)}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={Math.min(100, (metrics.totalUSD / (metrics.monthlyAverage * 12)) * 100)}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
              <Box display="flex" gap={1} flexWrap="wrap">
                <Chip 
                  label={`${metrics.uniqueCompanies} empresas en cartera`} 
                  variant="outlined" 
                  size="small" 
                />
                <Chip 
                  label={`${Math.ceil((Date.now() - metrics.firstDividend.getTime()) / (1000 * 60 * 60 * 24))} días invirtiendo`} 
                  variant="outlined" 
                  size="small" 
                />
                <Chip 
                  label={`Última actividad: ${Math.ceil((Date.now() - metrics.lastDividend.getTime()) / (1000 * 60 * 60 * 24))} días`} 
                  variant="outlined" 
                  size="small" 
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
