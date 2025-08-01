import React, { useState } from 'react';
import { 
  Button, 
  Typography, 
  Container, 
  Box, 
  Alert, 
  CircularProgress, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  Chip,
  Stack,
  Tooltip,
  IconButton
} from '@mui/material';
import { Help } from '@mui/icons-material';
import * as XLSX from 'xlsx';
import { DividendData } from '../../types/dividend';
import { cleanDividendData } from '../../utils/dateUtils';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import DividendTable from '../dividendTable/DividendTable';
import DateAccumulatedTable from '../dateAccumulatedTable/DateAccumulatedTable';
import AccumulatedChart from '../accumulatedChart/AcucumulatedChart';
import Dashboard from '../dashboard/Dashboard';
import AdvancedFilters from '../filters/AdvancedFilters';
import PredictionsPanel from '../predictions/PredictionsPanel';

interface FileInfo {
  name: string;
  size: string;
  lastModified: string;
}

const FileUpload: React.FC = () => {
  const [data, setData] = useState<DividendData[]>([]);
  const [filteredData, setFilteredData] = useState<DividendData[]>([]);
  const [view, setView] = useState<'dashboard' | 'table' | 'dateTable' | 'chart' | 'predictions'>('dashboard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [availableSheets, setAvailableSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<number>(0);
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);

  // Atajos de teclado
  useKeyboardShortcuts([
    {
      key: '1',
      altKey: true,
      action: () => data.length > 0 && setView('dashboard'),
      description: 'Ir al Dashboard'
    },
    {
      key: '2',
      altKey: true,
      action: () => data.length > 0 && setView('table'),
      description: 'Ir a Tabla de Dividendos'
    },
    {
      key: '3',
      altKey: true,
      action: () => data.length > 0 && setView('dateTable'),
      description: 'Ir a Acumulado por Fecha'
    },
    {
      key: '4',
      altKey: true,
      action: () => data.length > 0 && setView('chart'),
      description: 'Ir a Gráficos'
    },
    {
      key: '5',
      altKey: true,
      action: () => data.length > 0 && setView('predictions'),
      description: 'Ir a Predicciones'
    }
  ]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(null);
    setLoading(true);
    setData([]);
    setAvailableSheets([]);
    setSelectedSheet(0);

    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
      setError('Por favor, selecciona un archivo Excel válido (.xlsx o .xls)');
      setLoading(false);
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('El archivo es demasiado grande. El tamaño máximo permitido es 10MB.');
      setLoading(false);
      return;
    }

    // Set file info
    setFileInfo({
      name: file.name,
      size: formatFileSize(file.size),
      lastModified: new Date(file.lastModified).toLocaleString('es-ES')
    });

    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          throw new Error('No se pudo leer el archivo');
        }

        const workbook = XLSX.read(data, { type: 'array' });
        
        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          throw new Error('El archivo no contiene hojas de cálculo válidas');
        }

        setWorkbook(workbook);
        setAvailableSheets(workbook.SheetNames);
        
        // Try to find a sheet with dividend data (look for typical dividend sheet names)
        const dividendSheetIndex = workbook.SheetNames.findIndex(name => 
          name.toLowerCase().includes('dividend') || 
          name.toLowerCase().includes('dividendo') ||
          name.toLowerCase().includes('div')
        );
        
        const defaultSheetIndex = dividendSheetIndex !== -1 ? dividendSheetIndex : Math.min(3, workbook.SheetNames.length - 1);
        setSelectedSheet(defaultSheetIndex);
        
        processSheet(workbook, defaultSheetIndex);
        
      } catch (err) {
        setError(`Error al procesar el archivo: ${err instanceof Error ? err.message : 'Error desconocido'}`);
        setLoading(false);
      }
    };

    reader.onerror = () => {
      setError('Error al leer el archivo. Por favor, inténtalo de nuevo.');
      setLoading(false);
    };

    reader.readAsArrayBuffer(file);
  };

  const processSheet = (wb: XLSX.WorkBook, sheetIndex: number) => {
    try {
      const sheetName = wb.SheetNames[sheetIndex];
      const sheet = wb.Sheets[sheetName];
      
      if (!sheet) {
        throw new Error(`La hoja "${sheetName}" no se pudo leer`);
      }

      const jsonData = XLSX.utils.sheet_to_json(sheet);
      
      if (!jsonData || jsonData.length === 0) {
        throw new Error(`La hoja "${sheetName}" está vacía o no contiene datos válidos`);
      }

      const cleanedData = cleanDividendData(jsonData);
      
      if (cleanedData.length === 0) {
        throw new Error(`No se encontraron datos de dividendos válidos en la hoja "${sheetName}". Verifica que el archivo contenga las columnas correctas.`);
      }

      setData(cleanedData);
      setSuccess(`Archivo procesado exitosamente. Se encontraron ${cleanedData.length} registros de dividendos en la hoja "${sheetName}".`);
      setLoading(false);
      
    } catch (err) {
      setError(`Error al procesar la hoja: ${err instanceof Error ? err.message : 'Error desconocido'}`);
      setLoading(false);
    }
  };

  const handleSheetChange = (sheetIndex: number) => {
    if (!workbook) return;
    
    setSelectedSheet(sheetIndex);
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    processSheet(workbook, sheetIndex);
  };

  return (
    <Container maxWidth={false} sx={{ px: 0, width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        Subir archivo Excel de dividendos eToro
        <Tooltip title="Atajos: Alt+1-5 para navegar entre vistas">
          <IconButton size="small" sx={{ ml: 1 }}>
            <Help fontSize="small" />
          </IconButton>
        </Tooltip>
      </Typography>
      
      <Box mb={2}>
        <Button 
          variant="contained" 
          component="label" 
          disabled={loading}
          sx={{ position: 'relative' }}
        >
          {loading ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              Procesando...
            </>
          ) : (
            'Seleccionar Archivo'
          )}
          <input
            type="file"
            hidden
            onChange={handleFileUpload}
            accept=".xls,.xlsx"
          />
        </Button>
      </Box>

      {fileInfo && (
        <Box mb={2}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <Chip label={`📄 ${fileInfo.name}`} variant="outlined" />
            <Chip label={`📏 ${fileInfo.size}`} variant="outlined" />
            <Chip label={`📅 ${fileInfo.lastModified}`} variant="outlined" />
          </Stack>
        </Box>
      )}

      {availableSheets.length > 0 && (
        <Box mb={2}>
          <FormControl fullWidth>
            <InputLabel>Hoja de cálculo</InputLabel>
            <Select
              value={selectedSheet}
              label="Hoja de cálculo"
              onChange={(e) => handleSheetChange(Number(e.target.value))}
              disabled={loading}
            >
              {availableSheets.map((sheetName, index) => (
                <MenuItem key={index} value={index}>
                  {sheetName} {index === selectedSheet && '(seleccionada)'}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {data.length > 0 && (
        <Box mt={2}>
          <Box mb={2}>
            <Stack 
              direction="row" 
              spacing={1} 
              flexWrap="wrap" 
              sx={{ 
                justifyContent: { xs: 'flex-start', sm: 'center', md: 'flex-start' },
                gap: 1 
              }}
            >
              <Button 
                variant={view === 'dashboard' ? 'contained' : 'outlined'} 
                onClick={() => setView('dashboard')}
                sx={{ minWidth: { xs: '120px', sm: '140px' } }}
              >
                📊 Dashboard
              </Button>
              <Button 
                variant={view === 'table' ? 'contained' : 'outlined'} 
                onClick={() => setView('table')}
                sx={{ minWidth: { xs: '120px', sm: '140px' } }}
              >
                📋 Tabla de Dividendos
              </Button>
              <Button 
                variant={view === 'dateTable' ? 'contained' : 'outlined'} 
                onClick={() => setView('dateTable')}
                sx={{ minWidth: { xs: '120px', sm: '140px' } }}
              >
                📅 Acumulado por Fecha
              </Button>
              <Button 
                variant={view === 'chart' ? 'contained' : 'outlined'} 
                onClick={() => setView('chart')}
                sx={{ minWidth: { xs: '120px', sm: '140px' } }}
              >
                📈 Gráficos
              </Button>
              <Button 
                variant={view === 'predictions' ? 'contained' : 'outlined'} 
                onClick={() => setView('predictions')}
                sx={{ minWidth: { xs: '120px', sm: '140px' } }}
              >
                🔮 Predicciones IA
              </Button>
            </Stack>
          </Box>

          {/* Filtros avanzados para vistas que no sean dashboard */}
          {view !== 'dashboard' && view !== 'predictions' && (
            <Box sx={{ width: '100%', mb: 2 }}>
              <AdvancedFilters 
                data={data} 
                onFiltersChange={setFilteredData}
              />
            </Box>
          )}
          
          <Box sx={{ width: '100%' }}>
            {view === 'dashboard' && <Dashboard data={data} />}
            {view === 'table' && <DividendTable data={filteredData.length > 0 ? filteredData : data} />}
            {view === 'dateTable' && <DateAccumulatedTable data={filteredData.length > 0 ? filteredData : data} />}
            {view === 'chart' && <AccumulatedChart data={filteredData.length > 0 ? filteredData : data} />}
            {view === 'predictions' && <PredictionsPanel data={data} />}
          </Box>
        </Box>
      )}
    </Container>
  );
};

export default FileUpload;
