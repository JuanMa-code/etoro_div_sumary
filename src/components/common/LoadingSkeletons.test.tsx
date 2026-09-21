import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { TableSkeleton, ChartSkeleton, DashboardSkeleton, FiltersSkeleton } from './LoadingSkeletons';

const countSkeletons = (container: HTMLElement) =>
  container.querySelectorAll('.MuiSkeleton-root').length;

describe('LoadingSkeletons', () => {
  it('TableSkeleton draws a title, two chips and five rows of four cells', () => {
    const { container } = render(<TableSkeleton />);
    expect(countSkeletons(container)).toBe(1 + 2 + 5 * 4);
  });

  it('ChartSkeleton draws a title, three toggles and the chart area', () => {
    const { container } = render(<ChartSkeleton />);
    expect(countSkeletons(container)).toBe(1 + 3 + 1);
  });

  it('DashboardSkeleton draws four metric cards and a wide card', () => {
    const { container } = render(<DashboardSkeleton />);
    expect(countSkeletons(container)).toBe(1 + 4 * 3 + 2);
  });

  it('FiltersSkeleton draws a header and three inputs', () => {
    const { container } = render(<FiltersSkeleton />);
    expect(countSkeletons(container)).toBe(2 + 3);
  });
});
