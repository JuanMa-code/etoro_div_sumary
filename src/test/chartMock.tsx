import React from 'react';
import type { ChartData } from 'chart.js';

interface LineProps {
  data: ChartData<'line', (number | null)[], string>;
}

/**
 * Stand-in for react-chartjs-2's <Line>. jsdom has no canvas, so the real
 * component cannot render; this one exposes labels and datasets as JSON so
 * tests can assert on what would have been drawn.
 */
export const MockLine: React.FC<LineProps> = ({ data }) => (
  <div
    data-testid="line-chart"
    data-labels={JSON.stringify(data.labels ?? [])}
    data-datasets={JSON.stringify(data.datasets.map(d => ({ label: d.label, data: d.data })))}
  />
);

export interface RenderedDataset {
  label?: string;
  data: (number | null)[];
}

export const readChart = (element: HTMLElement): { labels: string[]; datasets: RenderedDataset[] } => ({
  labels: JSON.parse(element.getAttribute('data-labels') ?? '[]') as string[],
  datasets: JSON.parse(element.getAttribute('data-datasets') ?? '[]') as RenderedDataset[],
});
