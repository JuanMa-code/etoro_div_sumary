import { 
  Box, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Typography,
  Chip,
  TableSortLabel
} from '@mui/material';
import React, { useState, useMemo } from 'react';
import { DividendData, DateAccumulatedData } from '../../types/dividend';
import { parseExcelDate, formatDate } from '../../utils/dateUtils';

interface Props {
  data: DividendData[];
}

type SortField = 'fecha' | 'totalUSD' | 'totalEUR' | 'cumulativeUSD' | 'cumulativeEUR';
type SortDirection = 'asc' | 'desc';

const DateAccumulatedTable: React.FC<Props> = ({ data }) => {
  const [sortField, setSortField] = useState<SortField>('fecha');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

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
          cumulativeUSD: 0,
          cumulativeEUR: 0,
        };
      }
      acc[date].totalUSD += curr["Dividendo neto recibido (USD)"];
      acc[date].totalEUR += curr["Dividendo neto recibido (EUR)"];
      return acc;
    }, {} as Record<string, DateAccumulatedData>);

    // Convert to array and sort by date first (oldest first for cumulative calculation)
    const sortedByDate = Object.values(groupedData).sort((a, b) => 
      a.fechaFormatted.getTime() - b.fechaFormatted.getTime()
    );

    // Calculate cumulative totals
    let cumulativeUSD = 0;
    let cumulativeEUR = 0;
    
    const dataWithCumulative = sortedByDate.map(item => {
      cumulativeUSD += item.totalUSD;
      cumulativeEUR += item.totalEUR;
      
      return {
        ...item,
        cumulativeUSD,
        cumulativeEUR,
      };
    });

    // Apply user sorting
    return dataWithCumulative.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortField) {
        case 'fecha':
          aValue = a.fechaFormatted.getTime();
          bValue = b.fechaFormatted.getTime();
          break;
        case 'totalUSD':
          aValue = a.totalUSD;
          bValue = b.totalUSD;
          break;
        case 'totalEUR':
          aValue = a.totalEUR;
          bValue = b.totalEUR;
          break;
        case 'cumulativeUSD':
          aValue = a.cumulativeUSD;
          bValue = b.cumulativeUSD;
          break;
        case 'cumulativeEUR':
          aValue = a.cumulativeEUR;
          bValue = b.cumulativeEUR;
          break;
        default:
          return 0;
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [data, sortField, sortDirection]);

  const totals = useMemo(() => {
    return processedData.reduce(
      (acc, row) => ({
        totalUSD: acc.totalUSD + row.totalUSD,
        totalEUR: acc.totalEUR + row.totalEUR,
      }),
      { totalUSD: 0, totalEUR: 0 }
    );
  }, [processedData]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  return (
    <Box>
      <Box mb={2}>
        <Typography variant="h6" gutterBottom>
          Totales Acumulados por Fecha ({processedData.length} fechas)
        </Typography>
      </Box>

      <Box mb={2} display="flex" gap={1} flexWrap="wrap">
        <Chip 
          label={`Total USD: $${totals.totalUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          color="primary" 
          variant="outlined" 
        />
        <Chip 
          label={`Total EUR: €${totals.totalEUR.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          color="secondary" 
          variant="outlined" 
        />
      </Box>

      <TableContainer component={Paper} style={{ width: '100%', maxHeight: '70vh' }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'fecha'}
                  direction={sortField === 'fecha' ? sortDirection : 'asc'}
                  onClick={() => handleSort('fecha')}
                >
                  Fecha de Pago
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={sortField === 'totalUSD'}
                  direction={sortField === 'totalUSD' ? sortDirection : 'asc'}
                  onClick={() => handleSort('totalUSD')}
                >
                  Total USD
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={sortField === 'totalEUR'}
                  direction={sortField === 'totalEUR' ? sortDirection : 'asc'}
                  onClick={() => handleSort('totalEUR')}
                >
                  Total EUR
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={sortField === 'cumulativeUSD'}
                  direction={sortField === 'cumulativeUSD' ? sortDirection : 'asc'}
                  onClick={() => handleSort('cumulativeUSD')}
                >
                  Acumulado USD
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={sortField === 'cumulativeEUR'}
                  direction={sortField === 'cumulativeEUR' ? sortDirection : 'asc'}
                  onClick={() => handleSort('cumulativeEUR')}
                >
                  Acumulado EUR
                </TableSortLabel>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {processedData.map((row, index) => (
              <TableRow key={index} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {formatDate(row.fechaFormatted)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" color="primary.main">
                    ${row.totalUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" color="secondary.main">
                    €{row.totalEUR.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" color="primary.main" fontWeight="bold">
                    ${row.cumulativeUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" color="secondary.main" fontWeight="bold">
                    €{row.cumulativeEUR.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default DateAccumulatedTable;
