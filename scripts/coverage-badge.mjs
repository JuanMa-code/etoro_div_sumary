// Genera un badge SVG de cobertura a partir de coverage/coverage-summary.json
// (reporter json-summary de Vitest). Uso: node scripts/coverage-badge.mjs [salida.svg]
import fs from 'node:fs';
import path from 'node:path';

const summaryPath = path.resolve('coverage', 'coverage-summary.json');
const outPath = path.resolve(process.argv[2] ?? path.join('coverage', 'badge.svg'));

if (!fs.existsSync(summaryPath)) {
  console.error(`No existe ${summaryPath}. Ejecuta antes "npm run test:coverage".`);
  process.exit(1);
}

const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
const pct = Number(summary.total.lines.pct);
if (!Number.isFinite(pct)) {
  console.error('coverage-summary.json no contiene total.lines.pct');
  process.exit(1);
}

const color =
  pct >= 90 ? '#4c1' :
  pct >= 80 ? '#97ca00' :
  pct >= 70 ? '#a4a61d' :
  pct >= 60 ? '#dfb317' :
  pct >= 50 ? '#fe7d37' :
  '#e05d44';

const label = 'coverage';
const value = `${pct.toFixed(1)}%`;
// Anchura aproximada: 6.5px por caracter mas margenes, como los badges de shields.io.
const labelWidth = Math.round(label.length * 6.5) + 10;
const valueWidth = Math.round(value.length * 6.5) + 10;
const width = labelWidth + valueWidth;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="20" role="img" aria-label="${label}: ${value}">
  <title>${label}: ${value}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r"><rect width="${width}" height="20" rx="3" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelWidth}" height="20" fill="#555"/>
    <rect x="${labelWidth}" width="${valueWidth}" height="20" fill="${color}"/>
    <rect width="${width}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">
    <text x="${labelWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${label}</text>
    <text x="${labelWidth / 2}" y="14">${label}</text>
    <text x="${labelWidth + valueWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${value}</text>
    <text x="${labelWidth + valueWidth / 2}" y="14">${value}</text>
  </g>
</svg>
`;

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, svg);
console.log(`Badge de cobertura (${value}) escrito en ${path.relative(process.cwd(), outPath)}`);
