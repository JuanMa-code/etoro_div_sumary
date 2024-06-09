import { Container, Typography } from '@mui/material';
import React from 'react';
import FileUpload from './components/fileUpload/FileUpdload';


const App: React.FC = () => {
  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Excel File Reader
      </Typography>
      <FileUpload />
    </Container>
  );
};

export default App;
