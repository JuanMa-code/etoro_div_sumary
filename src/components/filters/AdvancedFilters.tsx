import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Autocomplete,
  Chip,
  Stack,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  ExpandMore,
  FilterList,
  Clear,
  Search,
  CalendarToday,
  AttachMoney,
  Business
} from '@mui/icons-material';
import { DividendData } from '../../types/dividend';
import { parseExcelDate } from '../../utils/dateUtils';
import { getNameByLongName } from '../Parser';

interface FilterOptions {
  searchTerm: string;
  selectedCompanies: string[];
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  amountRange: {
    min: number;
    max: number;
  };
  currencies: ('USD' | 'EUR')[];
  sortBy: 'date' | 'amount' | 'company';
  sortOrder: 'asc' | 'desc';
}

interface Props {
  data: DividendData[];
  onFiltersChange: (filteredData: DividendData[]) => void;
}

const AdvancedFilters: React.FC<Props> = ({ data, onFiltersChange }) => {
  const [filters, setFilters] = useState<FilterOptions>({
    searchTerm: '',
    selectedCompanies: [],
    dateRange: { start: null, end: null },
    amountRange: { min: 0, max: 1000 },
    currencies: ['USD', 'EUR'],
    sortBy: 'date',
    sortOrder: 'desc'
  });

  const [expanded, setExpanded] = useState<string | false>('basic');

  // Calcular opciones disponibles
  const availableOptions = useMemo(() => {
    if (data.length === 0) return { companies: [], amountRange: { min: 0, max: 1000 } };

    const companies = Array.from(new Set(data.map(item => item['Nombre del instrumento'])))
      .sort()
      .map(company => ({
        label: getNameByLongName(company) || company,
        value: company,
        fullName: company
      }));

    const amounts = data.map(item => item['Dividendo neto recibido (USD)']);
    const amountRange = {
      min: Math.floor(Math.min(...amounts)),
      max: Math.ceil(Math.max(...amounts))
    };

    return { companies, amountRange };
  }, [data]);

  // Aplicar filtros
  const filteredData = useMemo(() => {
    let result = [...data];

    // Filtro de búsqueda
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      result = result.filter(item => 
        item['Nombre del instrumento'].toLowerCase().includes(searchLower) ||
        (getNameByLongName(item['Nombre del instrumento']) || '').toLowerCase().includes(searchLower) ||
        item['ISIN']?.toLowerCase().includes(searchLower)
      );
    }

    // Filtro de empresas
    if (filters.selectedCompanies.length > 0) {
      result = result.filter(item => 
        filters.selectedCompanies.includes(item['Nombre del instrumento'])
      );
    }

    // Filtro de fechas
    if (filters.dateRange.start || filters.dateRange.end) {
      result = result.filter(item => {
        const itemDate = parseExcelDate(item['Fecha de pago']);
        const start = filters.dateRange.start;
        const end = filters.dateRange.end;
        
        if (start && itemDate < start) return false;
        if (end && itemDate > end) return false;
        return true;
      });
    }

    // Filtro de montos
    result = result.filter(item => {
      const amount = item['Dividendo neto recibido (USD)'];
      return amount >= filters.amountRange.min && amount <= filters.amountRange.max;
    });

    // Ordenar
    result.sort((a, b) => {
      let aValue: string | number | Date;
      let bValue: string | number | Date;

      switch (filters.sortBy) {
        case 'date':
          aValue = parseExcelDate(a['Fecha de pago']);
          bValue = parseExcelDate(b['Fecha de pago']);
          break;
        case 'amount':
          aValue = a['Dividendo neto recibido (USD)'];
          bValue = b['Dividendo neto recibido (USD)'];
          break;
        case 'company':
          aValue = getNameByLongName(a['Nombre del instrumento']) || a['Nombre del instrumento'];
          bValue = getNameByLongName(b['Nombre del instrumento']) || b['Nombre del instrumento'];
          break;
        default:
          return 0;
      }

      if (filters.sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return result;
  }, [data, filters]);

  // Notificar cambios
  React.useEffect(() => {
    onFiltersChange(filteredData);
  }, [filteredData, onFiltersChange]);

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearAllFilters = () => {
    setFilters({
      searchTerm: '',
      selectedCompanies: [],
      dateRange: { start: null, end: null },
      amountRange: { min: availableOptions.amountRange.min, max: availableOptions.amountRange.max },
      currencies: ['USD', 'EUR'],
      sortBy: 'date',
      sortOrder: 'desc'
    });
  };

  const activeFiltersCount = [
    filters.searchTerm !== '',
    filters.selectedCompanies.length > 0,
    filters.dateRange.start !== null || filters.dateRange.end !== null,
    filters.amountRange.min !== availableOptions.amountRange.min || filters.amountRange.max !== availableOptions.amountRange.max
  ].filter(Boolean).length;

  return (
    <Paper elevation={2} sx={{ p: 2, mb: 3, width: '100%' }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <FilterList />
          <Typography variant="h6">
            Filtros Avanzados
          </Typography>
          {activeFiltersCount > 0 && (
            <Chip 
              label={`${activeFiltersCount} activos`} 
              color="primary" 
              size="small" 
            />
          )}
        </Box>
        <Box display="flex" gap={1}>
          <Typography variant="body2" color="text.secondary">
            {filteredData.length} de {data.length} registros
          </Typography>
          <Tooltip title="Limpiar todos los filtros">
            <IconButton onClick={clearAllFilters} size="small">
              <Clear />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Filtros básicos siempre visibles */}
      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Buscar empresa, ticker o ISIN"
            value={filters.searchTerm}
            onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
            }}
            size="small"
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Ordenar por</InputLabel>
            <Select
              value={filters.sortBy}
              label="Ordenar por"
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            >
              <MenuItem value="date">📅 Fecha</MenuItem>
              <MenuItem value="amount">💰 Importe</MenuItem>
              <MenuItem value="company">🏢 Empresa</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Orden</InputLabel>
            <Select
              value={filters.sortOrder}
              label="Orden"
              onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
            >
              <MenuItem value="desc">↓ Descendente</MenuItem>
              <MenuItem value="asc">↑ Ascendente</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Filtros avanzados en acordeón */}
      <Accordion 
        expanded={expanded === 'advanced'} 
        onChange={(_, isExpanded) => setExpanded(isExpanded ? 'advanced' : false)}
      >
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography>Filtros Avanzados</Typography>
            {(filters.selectedCompanies.length > 0 || filters.dateRange.start || filters.dateRange.end) && (
              <Chip label="Activos" color="primary" size="small" />
            )}
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            {/* Filtro de empresas */}
            <Grid item xs={12} md={6}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Business fontSize="small" />
                <Typography variant="subtitle2">Empresas</Typography>
              </Box>
              <Autocomplete
                multiple
                options={availableOptions.companies}
                value={availableOptions.companies.filter(company => 
                  filters.selectedCompanies.includes(company.value)
                )}
                onChange={(_, newValue) => 
                  handleFilterChange('selectedCompanies', newValue.map(v => v.value))
                }
                getOptionLabel={(option) => option.label}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Seleccionar empresas"
                    placeholder="Buscar empresas..."
                    size="small"
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      variant="outlined"
                      label={option.label}
                      size="small"
                      {...getTagProps({ index })}
                      key={option.value}
                    />
                  ))
                }
              />
            </Grid>

            {/* Filtro de fechas simplificado */}
            <Grid item xs={12} md={6}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <CalendarToday fontSize="small" />
                <Typography variant="subtitle2">Rango de fechas</Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                <TextField
                  label="Fecha inicio (DD/MM/YYYY)"
                  type="date"
                  value={filters.dateRange.start ? filters.dateRange.start.toISOString().split('T')[0] : ''}
                  onChange={(e) => 
                    handleFilterChange('dateRange', { 
                      ...filters.dateRange, 
                      start: e.target.value ? new Date(e.target.value) : null 
                    })
                  }
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="Fecha fin (DD/MM/YYYY)"
                  type="date"
                  value={filters.dateRange.end ? filters.dateRange.end.toISOString().split('T')[0] : ''}
                  onChange={(e) => 
                    handleFilterChange('dateRange', { 
                      ...filters.dateRange, 
                      end: e.target.value ? new Date(e.target.value) : null 
                    })
                  }
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </Stack>
            </Grid>

            {/* Filtro de montos */}
            <Grid item xs={12}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <AttachMoney fontSize="small" />
                <Typography variant="subtitle2">
                  Rango de montos (USD): ${filters.amountRange.min} - ${filters.amountRange.max}
                </Typography>
              </Box>
              <Slider
                value={[filters.amountRange.min, filters.amountRange.max]}
                onChange={(_, newValue) => 
                  handleFilterChange('amountRange', { 
                    min: (newValue as number[])[0], 
                    max: (newValue as number[])[1] 
                  })
                }
                valueLabelDisplay="auto"
                min={availableOptions.amountRange.min}
                max={availableOptions.amountRange.max}
                step={0.01}
                valueLabelFormat={(value) => `$${value.toFixed(2)}`}
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Resumen de filtros activos */}
      {activeFiltersCount > 0 && (
        <Box mt={2}>
          <Typography variant="body2" color="text.secondary" mb={1}>
            Filtros activos:
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {filters.searchTerm && (
              <Chip
                label={`Búsqueda: "${filters.searchTerm}"`}
                onDelete={() => handleFilterChange('searchTerm', '')}
                size="small"
              />
            )}
            {filters.selectedCompanies.map(company => (
              <Chip
                key={company}
                label={getNameByLongName(company) || company}
                onDelete={() => 
                  handleFilterChange('selectedCompanies', 
                    filters.selectedCompanies.filter(c => c !== company)
                  )
                }
                size="small"
              />
            ))}
            {(filters.dateRange.start || filters.dateRange.end) && (
              <Chip
                label="Rango de fechas"
                onDelete={() => handleFilterChange('dateRange', { start: null, end: null })}
                size="small"
              />
            )}
          </Stack>
        </Box>
      )}
    </Paper>
  );
};

export default AdvancedFilters;
