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
  TableSortLabel,
  IconButton
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import React, { useState, useMemo } from 'react';
import { DividendData, ProcessedDividendData } from '../../types/dividend';
import { parseExcelDate, formatDate } from '../../utils/dateUtils';
import { getNameByLongName } from '../Parser';

interface Props {
  data: DividendData[];
}

type SortField = 'nombre' | 'fecha' | 'importeUSD' | 'importeEUR';
type SortDirection = 'asc' | 'desc';

const DividendTable: React.FC<Props> = ({ data }) => {
  const [sortField, setSortField] = useState<SortField>('fecha');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showShortNames, setShowShortNames] = useState(true);

  const processedData = useMemo(() => {
    const groupedData = data.reduce((acc, curr) => {
      const key = `${curr["Nombre del instrumento"]}_${curr["Fecha de pago"]}`;
      if (!acc[key]) {
        acc[key] = {
          nombre: curr["Nombre del instrumento"],
          fecha: curr["Fecha de pago"],
          fechaFormatted: parseExcelDate(curr["Fecha de pago"]),
          importeUSD: 0,
          importeEUR: 0,
        };
      }
      acc[key].importeUSD += curr["Dividendo neto recibido (USD)"];
      acc[key].importeEUR += curr["Dividendo neto recibido (EUR)"];
      return acc;
    }, {} as Record<string, ProcessedDividendData>);

    const rows = Object.values(groupedData);

    // Apply sorting
    rows.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortField) {
        case 'nombre':
          aValue = showShortNames ? (getNameByLongName(a.nombre) || a.nombre) : a.nombre;
          bValue = showShortNames ? (getNameByLongName(b.nombre) || b.nombre) : b.nombre;
          break;
        case 'fecha':
          aValue = a.fechaFormatted.getTime();
          bValue = b.fechaFormatted.getTime();
          break;
        case 'importeUSD':
          aValue = a.importeUSD;
          bValue = b.importeUSD;
          break;
        case 'importeEUR':
          aValue = a.importeEUR;
          bValue = b.importeEUR;
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

    return rows;
  }, [data, sortField, sortDirection, showShortNames]);

  const totals = useMemo(() => {
    return processedData.reduce(
      (acc, row) => ({
        totalUSD: acc.totalUSD + row.importeUSD,
        totalEUR: acc.totalEUR + row.importeEUR,
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

  const getDisplayName = (longName: string) => {
    if (showShortNames) {
      const shortName = getNameByLongName(longName);
      return shortName || longName;
    }
    return longName;
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box mb={2} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap">
        <Typography variant="h6">
          Tabla de Dividendos ({processedData.length} registros)
        </Typography>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="body2">Nombres:</Typography>
          <IconButton 
            onClick={() => setShowShortNames(!showShortNames)}
            size="small"
            title={showShortNames ? "Mostrar nombres completos" : "Mostrar nombres cortos"}
          >
            {showShortNames ? <Visibility /> : <VisibilityOff />}
          </IconButton>
          <Typography variant="body2">
            {showShortNames ? "Cortos" : "Completos"}
          </Typography>
        </Box>
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

      <TableContainer component={Paper} sx={{ width: '100%', maxHeight: '70vh', overflowX: 'auto' }}>
        <Table stickyHeader sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'nombre'}
                  direction={sortField === 'nombre' ? sortDirection : 'asc'}
                  onClick={() => handleSort('nombre')}
                >
                  Empresa
                </TableSortLabel>
              </TableCell>
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
                  active={sortField === 'importeUSD'}
                  direction={sortField === 'importeUSD' ? sortDirection : 'asc'}
                  onClick={() => handleSort('importeUSD')}
                >
                  Importe USD
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={sortField === 'importeEUR'}
                  direction={sortField === 'importeEUR' ? sortDirection : 'asc'}
                  onClick={() => handleSort('importeEUR')}
                >
                  Importe EUR
                </TableSortLabel>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {processedData.map((row, index) => (
              <TableRow key={index} hover>
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      {getDisplayName(row.nombre)}
                    </Typography>
                    {showShortNames && getNameByLongName(row.nombre) && (
                      <Typography variant="caption" color="text.secondary">
                        {row.nombre}
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatDate(row.fechaFormatted)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" color="primary.main" fontWeight="medium">
                    ${row.importeUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" color="secondary.main" fontWeight="medium">
                    €{row.importeEUR.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

export default DividendTable;
