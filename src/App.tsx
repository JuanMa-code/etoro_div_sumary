import { Typography, Box } from '@mui/material';
import React from 'react';
import FileUpload from './components/fileUpload/FileUpdload';

const App: React.FC = () => {
  return (
    <Box sx={{ width: '100%', minHeight: '100vh', px: 2, py: 2 }}>
      <Box sx={{ maxWidth: '100%', mx: 'auto' }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          📊 Analizador de Dividendos
        </Typography>
        <Typography variant="subtitle1" align="center" color="text.secondary" sx={{ mb: 4 }}>
          Analiza y visualiza tus dividendos desde archivos Excel de forma sencilla
        </Typography>
        <FileUpload />
      </Box>
    </Box>
  );
};

export default App;
