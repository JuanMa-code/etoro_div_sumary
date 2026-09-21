# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Fully client-side SPA (React 19 + TypeScript 6 + MUI 9 + Chart.js, built with Vite 8) that parses the dividend-history Excel export from eToro and renders dashboards, tables, charts and simple predictions. Everything runs in the browser via SheetJS: no backend, no API calls, no env vars. UI copy is Spanish. Deployed to GitHub Pages at `/etoro_div_sumary/`.

## Commands

```bash
npm run dev        # Vite dev server with HMR
npm run build      # tsc (type-check) && vite build — an unused variable fails the build
npm run lint       # eslint . --max-warnings 0 — warnings fail
npm run preview    # serve dist/ locally
npm run test       # vitest run (all tests, once)
npm run test:watch # vitest in watch mode
npm run test:coverage  # tests + v8 coverage (text, lcov, json-summary) in coverage/
npm run coverage:badge # coverage/badge.svg from coverage/coverage-summary.json
npm run deploy     # predeploy runs build, then gh-pages -d dist
```

CI (`.github/workflows/deploy.yml`, Node 22) runs `npm ci`, `npm audit --omit=dev --audit-level=high`, `npm run lint`, `npm run test:coverage`, `npm run coverage:badge`, `npm run build`, copies the badge into `dist/coverage-badge.svg` and publishes `dist/` on every push to `main`. Pull requests run the same job without the deploy step. A change is "green" when lint, tests (including the coverage thresholds in `vite.config.ts`) and build all pass locally.

### Tests

- Vitest 5 + jsdom + Testing Library, configured in the `test` block of `vite.config.ts`; `src/test/setup.ts` loads jest-dom matchers and polyfills `matchMedia` / `ResizeObserver` for MUI. Tests live next to the code as `*.test.ts(x)` and are type-checked by `tsc` during the build, so they must satisfy `noUnusedLocals` too.
- Shared helpers in `src/test/`: `fixtures.ts` (`makeDividend`, `sampleData`, `buildWorkbookFile` / `buildEtoroFile` that serialise a real `.xlsx` with SheetJS into a `File`), `chartMock.tsx` (`MockLine` + `readChart`; mock `react-chartjs-2` with it because jsdom has no canvas) and `mui.ts` (`selectByLabel`, because the app's `Select`s have no `labelId` and therefore no accessible name).
- Coverage thresholds (80% lines/functions/statements, 70% branches) fail the run when not met; `main.tsx`, `src/types` and `src/test` are excluded. The README badge is served from GitHub Pages, so it only updates after a successful deploy.
- Gotchas seen while writing them: MUI outlined fields render their label twice (label + notch legend), `Accordion` wraps its summary in an `<h3>` (query headings by `level`), collapsed accordion content is inaccessible to role queries until expanded, and `userEvent.setup({ applyAccept: false })` is needed to push a non-Excel file through the `accept` filter.

Commit messages are in English. UI copy is Spanish. Code comments follow whatever language the surrounding file already uses (the repo is mixed: JSDoc in `dateUtils.ts` and `Parser.tsx` is English, inline comments in components are Spanish). Do not switch language mid-block.

## Architecture

Single page, no router, no state library. `src/components/fileUpload/FileUpdload.tsx` (typo is intentional, do not rename) is the orchestrator: it owns the parsed `DividendData[]`, the selected sheet, the active view and the filtered subset, and renders every other component. Data only ever flows down as props.

### Pipeline from file to views

1. `<input type="file">` → type/size validation (before any state is touched, so a rejected file keeps the loaded dataset) → `FileReader.readAsArrayBuffer` → `XLSX.read(..., { type: 'array' })`.
2. Sheet choice: the first sheet whose name contains `div`/`dividend`/`dividendo`, otherwise index `min(3, sheets-1)` (the eToro export has dividends on its 4th sheet). The user can re-pick from a dropdown, which re-runs `processSheet` on the cached workbook.
3. `sheet_to_json(..., { header: 1, raw: false })` gives rows of **formatted strings**, so dates arrive as `DD/MM/YYYY` text, not Excel serials. The header row is auto-detected: first of the top 5 rows with more than 3 **non-empty** cells (`defval` pads every row to the sheet width, so a title row would otherwise qualify) and one cell containing `instrumento`, `dividend`, `fecha` or `isin`.
4. Rows become `Record<string, unknown>` keyed by header text, then `cleanDividendData()` in `src/utils/dateUtils.ts` coerces them to `DividendData`. It silently drops rows lacking an instrument name, whose date does not parse, or whose USD **and** EUR amounts are both `<= 0`; unparseable numbers become `0`. A renamed column therefore yields "no valid data", not an error.
5. Views: `dashboard | table | dateTable | chart | predictions` (`Alt+1..5` via `useKeyboardShortcuts`). `AdvancedFilters` is mounted only for `table`, `dateTable` and `chart`; `Dashboard` and `PredictionsPanel` always receive the unfiltered data.

### Cross-file contracts worth knowing

- **Dataset identity.** `FileUpdload` bumps a `datasetId` counter on every successful `processSheet` and uses it as the React `key` of the subtree holding the filters and the views. That remount is what resets filter state, table sort, chart currency and so on when the sheet changes. New per-dataset state belongs inside that subtree; do not add hand-written resets to the sheet-change handler.
- **Filter callback must be stable.** `AdvancedFilters` pushes its result to the parent through `useEffect(() => onFiltersChange(filteredData), [filteredData, onFiltersChange])`. The parent wraps the handler in `useCallback`; an inline function would loop. The amount filter operates on the USD column only, is committed on slider release (`onChangeCommitted`), and counts as active only when it is narrower than the data bounds.
- **Shared aggregation helpers live in `dateUtils.ts`**, not in a separate module: `accumulateByDate` (group by parsed day, oldest first, running totals; used by `DateAccumulatedTable` and `AcucumulatedChart`), `toMonthKey` (zero-padded `YYYY-MM`, string-sortable; used by `Dashboard` and `PredictionsPanel`) and `average` (0 for an empty list). `DividendTable` still groups by instrument+date on its own. When you need a new aggregation, add it there rather than inside a component.
- **`PredictionsPanel` sorts rows chronologically once** (`rows` memo) before any window logic. The eToro export is newest-first, so anything that slices "last N payments" must read from that sorted list.
- **`DividendData` keys are the literal Spanish column headers** (`data["Fecha de pago"]`, `data["Dividendo neto recibido (USD)"]`, ...). The three shared types live in `src/types/dividend.ts`; every other interface (metrics, filter options, prediction shapes) is local to its component.
- **Ticker mapping** lives in `src/components/Parser.tsx` (`dataSource`, plain data despite the `.tsx`). `getNameByLongName` does a case-insensitive exact match on `long_name`; add new companies there.

### Dates

- `tryParseExcelDate(value): Date | null` is the single parser: `DD/MM/YYYY`, `DD-MM-YYYY`, `YYYY-MM-DD` (an optional time suffix is ignored), Excel serials (rebuilt from UTC parts to avoid a one-day shift in negative-offset zones), then a native-parse fallback truncated to local midnight. Rolled-over days like `31/02` return `null`. `cleanDividendData` uses it to drop bad rows.
- `parseExcelDate` wraps it and returns today at local midnight instead of `null`; components use it because cleaned rows always parse. Never call `new Date(str)` directly.
- For `<input type="date">` use `toDateInputValue` / `parseDateInputValue` (years are kept as typed, so partial values like `0002-05-01` do not become 1902). `toISOString()` and `new Date('YYYY-MM-DD')` both work in UTC and shift or mis-compare against locally built dates. Use `endOfDay` for inclusive upper bounds.

## Conventions

- Components: `const Name: React.FC<Props>` with `Props` declared just above, `export default` at the bottom. Utilities and `common/` skeletons use named arrow exports.
- Styling: MUI `sx` prop only. No CSS modules, no styled-components, no custom theme.
- Imports: relative paths (`../../types/dividend`), named imports from `@mui/material` / `@mui/icons-material`.
- `tsconfig` has `strict`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`.
- ESLint 10 flat config (`eslint.config.js`) with the strict `eslint-plugin-react-hooks` v7 (React Compiler) rules. Patterns it rejects: mutating a closure variable inside a `.map` callback (use a `for` loop), calling `setState` inside an effect to mirror props (derive with `useMemo`), and calling `Date.now()` / `new Date()` during render (capture once with a lazy `useState(() => ...)` initializer, as `Dashboard` does). The compiler silently skips a component it cannot analyse, so fixing one lint error in a file can surface others that were hidden.
- Filename typos `FileUpdload.tsx` and `AcucumulatedChart.tsx` are load-bearing imports. Do not rename.

## Dependencies and security posture

- `xlsx` is pinned to the SheetJS CDN tarball (`https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`), not the npm registry. `npm audit` does not see it and `npm update` will not bump it; change the URL in `package.json` by hand.
- Only `dependencies` reach `dist/`. Advisories in `devDependencies` (eslint, vite, typescript and their transitives) are dev-machine/CI noise, not user exposure. The gate that matters is `npm audit --omit=dev --audit-level=high`. Dependabot (`.github/dependabot.yml`) batches the rest into grouped weekly PRs; do not chase dev-only advisories individually.
- Current majors: React 19, MUI 9, Vite 8, ESLint 10, TypeScript 6. **TypeScript is pinned to `^6.0.x` on purpose**: `typescript-eslint` 8 declares `typescript <6.1.0` as a peer, so TypeScript 7 makes `npm ci` fail with an ERESOLVE conflict (this is what broke CI in September 2026 after a Dependabot bump). Only move to TypeScript 7 once `typescript-eslint` publishes support for it; do not "fix" it with `--legacy-peer-deps`.
- MUI 9 removed the system props and the `Grid item` API. Every layout prop goes inside `sx` (`<Box sx={{ display: 'flex', mb: 2 }}>`, never `<Box display="flex" mb={2}>`), grid children use `size={{ xs: 12, md: 6 }}` instead of `item xs={12} md={6}`, `TextField` uses `slotProps={{ input, inputLabel }}` instead of `InputProps` / `InputLabelProps`, and `Autocomplete` uses `renderValue` (with `getItemProps`) instead of `renderTags`. Real props such as `Container maxWidth`, `Chip size` or `Typography color` are unaffected.
- Vite `base` in `vite.config.ts` and the `homepage` in `package.json` must match the GitHub Pages repo path. The bundle is a single ~1 MB chunk; the size warning is known and accepted.

## Known dead code

Exported but unused by the app: all four skeletons in `src/components/common/LoadingSkeletons.tsx`, `sortByDate` in `dateUtils.ts`, `getLongNameByName` / `getAllCompanies` / `searchCompanies` in `Parser.tsx`, `getKeyboardShortcutsHelp` in the hook, and `src/App.css` (never imported). They have tests so they do not drag coverage down, but nothing renders or calls them. Either wire them in or delete them (with their tests); do not build on the assumption they are in use.

## Other docs

- `README.md` is the user-facing description in Spanish (how to export from eToro, expected columns, features).
- `.github/copilot-instructions.md` points here; this file is the single source of truth for agents.
