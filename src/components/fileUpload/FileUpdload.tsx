import React, { useState } from 'react';
import { Button, Typography, Container, Box } from '@mui/material';
import * as XLSX from 'xlsx';
import DividendTable from '../dividendTable/DividendTable';
import DateAccumulatedTable from '../dateAccumulatedTable/DateAccumulatedTable';
import AccumulatedChart from '../accumulatedChart/AcucumulatedChart';
const FileUpload: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [view, setView] = useState<'table' | 'dateTable' | 'chart'>('table');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const binaryStr = e.target?.result;
        if (binaryStr) {
          const workbook = XLSX.read(binaryStr, { type: 'binary' });
          const sheetName = workbook.SheetNames[3]; // Seleccionamos la cuarta pestaña (índice 3)
          const sheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(sheet);
          setData(jsonData);
        }
      };
      reader.readAsBinaryString(file);
    }
  };

  return (
    <Container>
      <Typography variant="h6" gutterBottom>
        Upload an Excel file
      </Typography>
      <Button variant="contained" component="label">
        Upload File
        <input
          type="file"
          hidden
          onChange={handleFileUpload}
          accept=".xls,.xlsx"
        />
      </Button>
      {data.length > 0 && (
        <Box mt={2}>
          <Box mb={2}>
            <Button variant="contained" onClick={() => setView('table')} style={{ marginRight: '10px' }}>
              Ver Tabla de Dividendos
            </Button>
            <Button variant="contained" onClick={() => setView('dateTable')} style={{ marginRight: '10px' }}>
              Ver Tabla Acumulada por Fecha
            </Button>
            <Button variant="contained" onClick={() => setView('chart')}>
              Ver Gráfico Acumulado
            </Button>
          </Box>
          {view === 'table' && <DividendTable data={data} />}
          {view === 'dateTable' && <DateAccumulatedTable data={data} />}
          {view === 'chart' && <AccumulatedChart data={data} />}
        </Box>
      )}
    </Container>
  );
};

export default FileUpload;
