# Project Guidelines

The single source of truth for this repository is [`CLAUDE.md`](../CLAUDE.md) at the repo root. Read it before making changes; it covers commands, the file-to-view data pipeline, cross-component contracts, date handling, lint rules and the dependency/security posture.

Non-negotiables, repeated here so they are never missed:

- `npm run lint` (zero warnings) and `npm run build` (tsc + vite) must both pass.
- Do not rename `FileUpdload.tsx` or `AcucumulatedChart.tsx`; the typos are load-bearing.
- Parse dates only with `parseExcelDate` / `parseDateInputValue` from `src/utils/dateUtils.ts`.
- MUI `sx` prop only; no CSS modules, styled-components or custom theme.
- Commit messages in English. UI copy in Spanish. Code comments follow the language already used in the file.
