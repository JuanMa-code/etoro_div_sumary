# Project Guidelines

## Overview

eToro Dividend Analyzer — a client-side React + TypeScript SPA that parses eToro Excel dividend exports and displays dashboards, tables, charts, and AI predictions. UI language is **Spanish**. Deployed to GitHub Pages.

## Code Style

- **TypeScript strict mode** with `noUnusedLocals`, `noUnusedParameters`, zero ESLint warnings policy
- Functional components typed as `React.FC<Props>` with co-located `Props` interfaces
- Arrow function exports for utilities (`const fn = () => {}`), default exports for components
- Heavy `useMemo` for all derived/computed data — follow this pattern in every component
- MUI `sx` prop for all styling — no CSS modules, no styled-components
- Named imports from MUI: `import { Box, Typography } from '@mui/material'`
- Relative path imports for internal modules: `'../../types/dividend'`

## Architecture

```
FileUpload (central orchestrator — owns all state)
  ├── AdvancedFilters → setFilteredData callback
  ├── Dashboard / DividendTable / DateAccumulatedTable
  ├── AccumulatedChart
  └── PredictionsPanel
```

- **No router** — view switching via local `view` state in `FileUpload` (`'dashboard' | 'table' | 'dateTable' | 'chart' | 'predictions'`)
- **No state management library** — all state is `useState` in `FileUpload`, data passed as props
- **Data flow**: Excel file → `XLSX.read()` → `cleanDividendData()` (in `src/utils/dateUtils.ts`) → child components
- Each visualization component independently processes received data via `useMemo`
- `src/components/Parser.tsx` is a pure data module (company ticker mappings, no JSX despite `.tsx`)

## Build and Test

```bash
npm run dev        # Vite dev server with HMR
npm run build      # tsc && vite build (type-check + production build)
npm run lint       # ESLint with --max-warnings 0
npm run preview    # Preview production build
npm run deploy     # gh-pages -d dist (runs build first via predeploy)
```

**No test framework configured.** Vite base path is `/etoro_div_sumary/` for GitHub Pages.

## Project Conventions

- **Feature folders** under `src/components/` (camelCase folder, PascalCase `.tsx` file): e.g., `dividendTable/DividendTable.tsx`
- Domain types live in `src/types/dividend.ts` — `DividendData` (raw Excel), `ProcessedDividendData` (cleaned), `DateAccumulatedData` (aggregated)
- Ad-hoc interfaces (metrics, filter options, predictions) are defined locally in their component files
- `src/utils/dateUtils.ts` contains all data processing logic (parsing, validation, cleaning, sorting) — not just date utilities
- Custom hooks go in `src/hooks/` with `use` prefix
- Known filename typos exist: `FileUpdload.tsx`, `AcucumulatedChart.tsx` — preserve unless explicitly asked to rename
- Excel column names are in Spanish (e.g., `"Fecha de pago"`, `"Dividendo neto recibido (USD)"`)

## Integration Points

- **xlsx (SheetJS)** loaded from CDN — used in `FileUpload` to read uploaded `.xlsx` files
- **Chart.js + react-chartjs-2** for the accumulated dividends chart
- **MUI v5** (`@mui/material`, `@mui/icons-material`) with `@emotion` — no custom theme provider, uses MUI defaults
