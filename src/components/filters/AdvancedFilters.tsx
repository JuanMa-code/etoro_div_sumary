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
import { parseExcelDate, endOfDay, toDateInputValue, parseDateInputValue } from '../../utils/dateUtils';
import { getNameByLongName } from '../Parser';

interface AmountRange {
  min: number;
  max: number;
}

interface FilterOptions {
  searchTerm: string;
  selectedCompanies: string[];
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  // null significa "sin tocar por el usuario": se usan los extremos de los datos.
  amountRange: AmountRange | null;
  sortBy: 'date' | 'amount' | 'company';
  sortOrder: 'asc' | 'desc';
}

interface Props {
  data: DividendData[];
  onFiltersChange: (filteredData: DividendData[]) => void;
}

const DEFAULT_FILTERS: FilterOptions = {
  searchTerm: '',
  selectedCompanies: [],
  dateRange: { start: null, end: null },
  amountRange: null,
  sortBy: 'date',
  sortOrder: 'desc'
};

// El filtro de importe solo cuenta como activo si estrecha el rango de los
// datos; devolver los dos tiradores a los extremos equivale a no filtrar.
const isNarrower = (range: AmountRange | null, bounds: AmountRange): range is AmountRange =>
  range !== null && (range.min > bounds.min || range.max < bounds.max);

const AdvancedFilters: React.FC<Props> = ({ data, onFiltersChange }) => {
  const [filters, setFilters] = useState<FilterOptions>(DEFAULT_FILTERS);
  const [expanded, setExpanded] = useState<string | false>('basic');
  // Posición del slider mientras se arrastra; se vuelca a filters al soltar,
  // para no recalcular todo el filtrado en cada tick del ratón.
  const [draggingAmount, setDraggingAmount] = useState<AmountRange | null>(null);

  // Cada fecha se parsea una sola vez; el filtro de fechas y la ordenación
  // reutilizan el timestamp en vez de volver a parsear en cada comparación.
  const timestamps = useMemo(() => {
    const map = new Map<DividendData, number>();
    for (const item of data) {
      map.set(item, parseExcelDate(item['Fecha de pago']).getTime());
    }
    return map;
  }, [data]);

  // Calcular opciones disponibles
  const availableOptions = useMemo(() => {
    const companies = Array.from(new Set(data.map(item => item['Nombre del instrumento'])))
      .sort()
      .map(company => ({
        label: getNameByLongName(company) || company,
        value: company,
        fullName: company
      }));

    // Se recorre con un bucle en vez de Math.min(...amounts) para no desbordar
    // la pila de llamadas con ficheros de muchas filas.
    let min = data.length > 0 ? data[0]['Dividendo neto recibido (USD)'] : 0;
    let max = min;
    for (const item of data) {
      const amount = item['Dividendo neto recibido (USD)'];
      if (amount < min) min = amount;
      if (amount > max) max = amount;
    }

    return { companies, amountRange: { min: Math.floor(min), max: Math.ceil(max) } };
  }, [data]);

  const dataAmountRange = availableOptions.amountRange;
  const amountFilterActive = isNarrower(filters.amountRange, dataAmountRange);
  const sliderValue = draggingAmount ?? filters.amountRange ?? dataAmountRange;

  // Aplicar filtros
  const filteredData = useMemo(() => {
    let result = data;

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

    // Filtro de fechas: el límite superior es el final del día para que los
    // pagos de la propia fecha "fin" queden incluidos.
    if (filters.dateRange.start || filters.dateRange.end) {
      const start = filters.dateRange.start?.getTime() ?? -Infinity;
      const end = filters.dateRange.end ? endOfDay(filters.dateRange.end).getTime() : Infinity;

      result = result.filter(item => {
        const time = timestamps.get(item) ?? 0;
        return time >= start && time <= end;
      });
    }

    // Filtro de importes: sólo si el usuario ha estrechado el rango.
    const amountRange = filters.amountRange;
    if (isNarrower(amountRange, availableOptions.amountRange)) {
      result = result.filter(item => {
        const amount = item['Dividendo neto recibido (USD)'];
        return amount >= amountRange.min && amount <= amountRange.max;
      });
    }

    // Ordenar (sobre una copia: result puede ser el propio array de props)
    return [...result].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (filters.sortBy) {
        case 'date':
          aValue = timestamps.get(a) ?? 0;
          bValue = timestamps.get(b) ?? 0;
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
  }, [data, filters, timestamps, availableOptions.amountRange]);

  // Notificar cambios
  React.useEffect(() => {
    onFiltersChange(filteredData);
  }, [filteredData, onFiltersChange]);

  const handleFilterChange = <K extends keyof FilterOptions>(key: K, value: FilterOptions[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearAllFilters = () => {
    setDraggingAmount(null);
    setFilters(DEFAULT_FILTERS);
  };

  const activeFiltersCount = [
    filters.searchTerm !== '',
    filters.selectedCompanies.length > 0,
    filters.dateRange.start !== null || filters.dateRange.end !== null,
    amountFilterActive
  ].filter(Boolean).length;

  const advancedFiltersActive =
    filters.selectedCompanies.length > 0 ||
    filters.dateRange.start !== null ||
    filters.dateRange.end !== null ||
    amountFilterActive;

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
              onChange={(e) => handleFilterChange('sortBy', e.target.value as FilterOptions['sortBy'])}
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
              onChange={(e) => handleFilterChange('sortOrder', e.target.value as FilterOptions['sortOrder'])}
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
            {advancedFiltersActive && (
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
                  value={filters.dateRange.start ? toDateInputValue(filters.dateRange.start) : ''}
                  onChange={(e) =>
                    handleFilterChange('dateRange', {
                      ...filters.dateRange,
                      start: parseDateInputValue(e.target.value)
                    })
                  }
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="Fecha fin (DD/MM/YYYY)"
                  type="date"
                  value={filters.dateRange.end ? toDateInputValue(filters.dateRange.end) : ''}
                  onChange={(e) =>
                    handleFilterChange('dateRange', {
                      ...filters.dateRange,
                      end: parseDateInputValue(e.target.value)
                    })
                  }
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </Stack>
            </Grid>

            {/* Filtro de importes */}
            <Grid item xs={12}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <AttachMoney fontSize="small" />
                <Typography variant="subtitle2">
                  Rango de importes (USD): ${sliderValue.min} - ${sliderValue.max}
                </Typography>
              </Box>
              <Slider
                value={[sliderValue.min, sliderValue.max]}
                onChange={(_, newValue) => {
                  const [min, max] = newValue as number[];
                  setDraggingAmount({ min, max });
                }}
                onChangeCommitted={(_, newValue) => {
                  const [min, max] = newValue as number[];
                  setDraggingAmount(null);
                  handleFilterChange('amountRange', { min, max });
                }}
                valueLabelDisplay="auto"
                min={dataAmountRange.min}
                max={dataAmountRange.max}
                disabled={dataAmountRange.min >= dataAmountRange.max}
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
            {amountFilterActive && filters.amountRange && (
              <Chip
                label={`Importe: $${filters.amountRange.min} - $${filters.amountRange.max}`}
                onDelete={() => handleFilterChange('amountRange', null)}
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
