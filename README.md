# 📊 Analizador de Dividendos eToro

[![CI](https://github.com/JuanMa-code/etoro_div_sumary/actions/workflows/deploy.yml/badge.svg)](https://github.com/JuanMa-code/etoro_div_sumary/actions/workflows/deploy.yml)
![Cobertura de tests](https://JuanMa-code.github.io/etoro_div_sumary/coverage-badge.svg)

Aplicación web que lee el Excel de historial de dividendos que exporta eToro y lo convierte en un dashboard, tablas, gráficos y una proyección sencilla. Todo se procesa en el navegador: el fichero nunca sale de tu equipo.

Desplegada en GitHub Pages: <https://JuanMa-code.github.io/etoro_div_sumary>

## Cómo obtener el Excel

1. Entra en tu cuenta de eToro.
2. Ve a **Portfolio → Historial**.
3. Elige el rango de fechas y descarga el informe en Excel (`.xlsx`).

El fichero trae varias hojas. La aplicación selecciona automáticamente la de dividendos (normalmente la cuarta) y permite cambiarla desde un desplegable.

### Columnas que se leen

| Columna | Uso |
|---|---|
| `Fecha de pago` | Fecha del dividendo (obligatoria) |
| `Nombre del instrumento` | Empresa (obligatoria) |
| `Dividendo neto recibido (USD)` | Importe neto en dólares |
| `Dividendo neto recibido (EUR)` | Importe neto en euros |
| `Tasa de retención fiscal (%)` | Porcentaje retenido |
| `Importe de la retención tributaria (USD)` / `(EUR)` | Retención en cada moneda |
| `ID de posición`, `Tipo`, `ISIN` | Informativas |

Las filas sin fecha, sin instrumento o con importe cero en ambas monedas se descartan.

## Vistas

- **Dashboard** — totales USD/EUR, número de pagos y empresas, mejor mes, mejor empresa, tendencia de los últimos tres meses.
- **Tabla de Dividendos** — un registro por empresa y fecha, ordenable por columna, alternando ticker corto y nombre completo.
- **Acumulado por Fecha** — totales por fecha de pago y acumulado progresivo en ambas monedas.
- **Gráficos** — línea por fecha o acumulativa, en USD, EUR o ambas.
- **Predicciones** — estimación del próximo trimestre y año por regresión lineal sobre los totales mensuales, patrón estacional, empresas con mayor crecimiento y nivel de riesgo por volatilidad. Es una estimación orientativa, no un consejo de inversión.

Los filtros (búsqueda por empresa, ticker o ISIN, selección de empresas, rango de fechas, rango de importe y ordenación) se aplican a las tablas y al gráfico. El dashboard y las predicciones usan siempre el conjunto completo.

Atajos de teclado: `Alt+1` a `Alt+5` cambian de vista.

## Tickers

La correspondencia nombre largo → ticker está en `src/components/Parser.tsx`. Si una empresa aparece con su nombre completo en vez del ticker, añádela ahí.

## Desarrollo

```bash
npm install
npm run dev        # servidor de desarrollo
npm run lint       # ESLint, cero avisos
npm run test       # tests con Vitest (npm run test:watch para modo interactivo)
npm run test:coverage  # tests + informe de cobertura en coverage/
npm run coverage:badge # genera coverage/badge.svg a partir del informe
npm run build      # type-check + bundle en dist/
npm run preview    # sirve dist/ en local
npm run deploy     # publica dist/ en GitHub Pages
```

Stack: React 18, TypeScript, MUI 5, Chart.js 4, SheetJS, Vite 7. No hay tests.

Las notas para agentes de código (arquitectura, convenciones, trampas conocidas) están en [CLAUDE.md](CLAUDE.md).
