import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders the title and the upload control', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Analizador de Dividendos');
    expect(screen.getByText('Seleccionar Archivo')).toBeInTheDocument();
  });
});
