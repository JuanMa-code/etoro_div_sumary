import { Container, Typography, Box } from '@mui/material';
import React from 'react';
import FileUpload from './components/fileUpload/FileUpdload';

const App: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          📊 Analizador de Dividendos
        </Typography>
        <Typography variant="subtitle1" align="center" color="text.secondary" sx={{ mb: 4 }}>
          Analiza y visualiza tus dividendos desde archivos Excel de forma sencilla
        </Typography>
        <FileUpload />
      </Box>
    </Container>
  );
};

export default App;
