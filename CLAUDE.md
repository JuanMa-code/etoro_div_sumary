# eToro Dividend Summary

## Project Overview

Fully client-side SPA that parses eToro dividend history Excel exports and displays them as interactive dashboards, tables, charts, and predictions. All Excel processing happens in the browser via SheetJS. No backend, no API calls, no environment variables. UI copy is in Spanish.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18.3 + TypeScript 5.9 |
| UI | MUI 5 (`@mui/material`, `@mui/icons-material`) + Emotion |
| Charts | Chart.js 4 via `react-chartjs-2` |
| Build | Vite 7 |
| Lint | ESLint 10 (flat config, `eslint.config.js`) + typescript-eslint 8 |
| Excel parsing | SheetJS (xlsx) 0.20.3 — installed from SheetJS CDN, not npm registry |
| Deployment | GitHub Pages (gh-pages) |

## Key Commands

```bash
npm run dev        # Start dev server (Vite HMR)
npm run build      # Type-check with tsc, then bundle with Vite
npm run lint       # ESLint over the repo — zero warnings policy (--max-warnings 0)
npm run preview    # Serve the production build locally
npm run deploy     # Build + push dist/ to GitHub Pages (gh-pages branch)
```

No tests in this project.

## Directory Structure

```
etoro_div_sumary/
├── src/
│   ├── components/
│   │   ├── Parser.tsx                                  # dataSource array: company name → ticker mapping
│   │   ├── fileUpload/FileUpdload.tsx                  # Central orchestrator (note typo — do not rename)
│   │   ├── dashboard/Dashboard.tsx
│   │   ├── dividendTable/DividendTable.tsx
│   │   ├── dateAccumulatedTable/DateAccumulatedTable.tsx
│   │   ├── accumulatedChart/AcucumulatedChart.tsx      # note typo — do not rename
│   │   ├── predictions/PredictionsPanel.tsx
│   │   ├── filters/AdvancedFilters.tsx
│   │   └── common/LoadingSkeletons.tsx
│   ├── hooks/
│   │   └── useKeyboardShortcuts.ts                     # Alt+1..5 view switching
│   ├── types/
│   │   └── dividend.ts                                 # DividendData, ProcessedDividendData, DateAccumulatedData
│   └── utils/
│       └── dateUtils.ts                                # parseExcelDate, date-input helpers, cleanDividendData
├── .github/workflows/deploy.yml                        # Build + deploy to GitHub Pages
├── eslint.config.js                                    # Flat config
├── vite.config.ts                                      # base: '/etoro_div_sumary/'
└── package.json
```

## Data Flow

1. `fileUpload/FileUpdload.tsx` owns all parsed `DividendData[]` state and the active view switcher.
2. User uploads `.xlsx` → `FileReader.readAsArrayBuffer` → `XLSX.read()` → `XLSX.utils.sheet_to_json(..., { header: 1 })`.
3. Auto-detects the header row (scans the first 5 rows for eToro keywords), maps rows to `Record<string, unknown>[]`.
4. `cleanDividendData()` in `dateUtils.ts` validates and coerces to typed `DividendData[]`.
5. `AdvancedFilters` produces a `filteredData` subset for the table, date-table and chart views. Dashboard and Predictions always use the unfiltered data.
6. Each view component receives `DividendData[]` as props and aggregates internally with `useMemo`.

## Developer Notes

- **Typos in filenames**: `FileUpdload.tsx` and `AcucumulatedChart.tsx` — do not rename, it will break imports.
- **xlsx dependency**: installed from `https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz` — `npm audit` does not cover this package.
- **Tickers**: add new company → ticker mappings in `Parser.tsx` `dataSource` array. Matching is case-insensitive exact on `long_name`.
- **Date parsing**: always use `parseExcelDate` from `dateUtils.ts`, never `new Date(str)` directly. Excel serial dates are rebuilt from their UTC parts to avoid a one-day shift in negative-offset timezones.
- **Date inputs**: use `toDateInputValue` / `parseDateInputValue` for `<input type="date">`. `toISOString()` converts to UTC and can shift the day; `new Date('YYYY-MM-DD')` parses as UTC midnight and will not compare correctly against locally-built dates.
- **react-hooks lint rules**: ESLint 10 ships the strict React Compiler rule set. Do not mutate variables captured by a `.map` callback (use an explicit loop), and do not call `setState` inside an effect to sync state (derive with `useMemo` instead).
- **Deployment**: Vite `base` must match the GitHub Pages repo path (`/etoro_div_sumary/`).
- **Views**: `dashboard | table | dateTable | chart | predictions` — switched in `FileUpdload.tsx`.
