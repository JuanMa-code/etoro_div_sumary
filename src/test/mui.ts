import { screen } from '@testing-library/react';

/**
 * Finds the combobox of a MUI <Select> by its label text. The app's selects
 * have no labelId, so the combobox carries no accessible name, and an
 * outlined field renders the label twice (InputLabel plus the notch legend),
 * hence the getAllByText.
 */
export const selectByLabel = (label: string): HTMLElement => {
  const control = screen.getAllByText(label)[0].closest('.MuiFormControl-root');
  const combobox = control?.querySelector('[role="combobox"]');
  if (!combobox) throw new Error(`No se encontró un Select con la etiqueta "${label}"`);
  return combobox as HTMLElement;
};
