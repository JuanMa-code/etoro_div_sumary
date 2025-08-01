# 📊 Analizador de Dividendos eToro

Una aplicación web moderna para analizar y visualizar dividendos desde archivos Excel descargados de eToro de forma sencilla e intuitiva.

## ✨ Características Principales

### 🔄 Carga de Archivos de eToro
- **Compatibilidad eToro**: Diseñado específicamente para archivos Excel de dividendos de eToro
- **Validación robusta**: Verifica formato, tamaño (máx. 10MB) y estructura
- **Selección flexible de hojas**: Detecta automáticamente hojas de dividendos o permite selección manual
- **Información del archivo**: Muestra nombre, tamaño y fecha de modificación
- **Manejo de errores**: Mensajes claros y específicos para problemas comunes
- **Estados de carga**: Indicadores visuales durante el procesamiento

### 📅 Manejo Inteligente de Fechas
- **Múltiples formatos**: Soporta DD/MM/YYYY, DD-MM-YYYY, YYYY/MM/DD
- **Fechas Excel**: Convierte automáticamente números seriales de Excel
- **Formato consistente**: Muestra todas las fechas en formato DD/MM/YYYY
- **Ordenación inteligente**: Ordena cronológicamente para análisis precisos

### 📊 Tabla de Dividendos Mejorada
- **Ordenación avanzada**: Click en columnas para ordenar por cualquier campo
- **Nombres dinámicos**: Alterna entre tickers cortos y nombres completos
- **Formato de moneda**: Números formateados con separadores de miles
- **Totales destacados**: Chips con totales USD y EUR
- **Interfaz responsive**: Tabla con scroll y headers fijos

### 📈 Tabla de Acumulados por Fecha
- **Totales por fecha**: Agrupa dividendos por fecha de pago
- **Acumulados progresivos**: Calcula totales acumulados hasta cada fecha
- **Dual currency**: Muestra tanto USD como EUR
- **Ordenación flexible**: Ordena por fecha o importes
- **Formato profesional**: Diseño limpio y fácil de leer

### 🎯 Gráficos Interactivos
- **Dos tipos de vista**:
  - Por fecha: Dividendos recibidos en cada fecha
  - Acumulativo: Evolución del total acumulado
- **Múltiples monedas**: USD, EUR, o ambas simultáneamente
- **Interactividad**: Tooltips con información detallada
- **Responsive**: Se adapta al tamaño de pantalla
- **Estilo profesional**: Colores y diseño cuidados

### 🏢 Base de Datos de Empresas
- **Mapeo inteligente**: Convierte nombres largos a tickers cortos
- **Empresas principales**: Incluye las principales empresas de dividendos
- **Búsqueda avanzada**: Funciones para buscar y filtrar empresas
- **Extensible**: Fácil agregar nuevas empresas

## 🚀 Mejoras Implementadas

### Gestión de Archivos
- ✅ Compatibilidad completa con archivos de eToro
- ✅ Reemplazado `readAsBinaryString` (deprecated) por `readAsArrayBuffer`
- ✅ Validación de tipos MIME y extensiones
- ✅ Límite de tamaño de archivo (10MB)
- ✅ Detección automática de hojas de dividendos
- ✅ Selector manual de hojas disponibles
- ✅ Manejo robusto de errores con mensajes específicos

### Procesamiento de Datos
- ✅ Validación estricta de estructura de datos
- ✅ Limpieza automática de datos inconsistentes
- ✅ Conversión segura de tipos numéricos
- ✅ Filtrado de registros inválidos
- ✅ Eliminado uso de `any` type

### Fechas y Formato
- ✅ Parser inteligente para múltiples formatos de fecha
- ✅ Conversión de fechas seriales de Excel
- ✅ Formato consistente DD/MM/YYYY
- ✅ Ordenación cronológica correcta
- ✅ Validación de fechas válidas

### Interfaz de Usuario
- ✅ Estados de carga con spinners
- ✅ Alertas informativas (éxito/error)
- ✅ Chips informativos para totales
- ✅ Botones de alternancia mejorados
- ✅ Información del archivo cargado
- ✅ Diseño responsive y profesional

## 📋 Uso de la Aplicación

### 📥 Descargar Archivo de eToro
1. Accede a tu cuenta de eToro
2. Ve a "Portfolio" → "Historial" 
3. Filtra por "Dividendos" y selecciona el rango de fechas deseado
4. Descarga el archivo Excel con tus dividendos

### 1. Cargar Archivo
1. Haz click en "Seleccionar Archivo"
2. Elige el archivo Excel descargado de eToro (.xlsx o .xls)
3. La aplicación validará el archivo automáticamente
4. Se mostrará información del archivo cargado

### 2. Seleccionar Hoja
1. Si el archivo tiene múltiples hojas, aparecerá un selector
2. La aplicación intentará detectar hojas de dividendos automáticamente
3. Puedes cambiar manualmente la hoja seleccionada

### 3. Analizar Datos
Una vez cargados los datos, puedes:
- **Ver tabla de dividendos**: Todos los pagos organizados por empresa y fecha
- **Ver acumulados por fecha**: Totales agrupados por fecha de pago
- **Ver gráficos**: Visualizaciones interactivas de la evolución

### 4. Interactuar con las Vistas
- **Ordenar**: Click en headers de columnas
- **Alternar nombres**: Botón de visibilidad en tabla de dividendos  
- **Cambiar gráfico**: Botones para tipo y moneda
- **Explorar datos**: Tooltips y información detallada

## 🔧 Estructura de Datos de eToro

El archivo Excel descargado de eToro debe contener las siguientes columnas:
- `Fecha de pago`: Fecha del dividendo
- `Nombre del instrumento`: Nombre de la empresa
- `Dividendo neto recibido (USD)`: Importe en dólares
- `Dividendo neto recibido (EUR)`: Importe en euros
- `Tasa de retención fiscal (%)`: Porcentaje de retención
- `Importe de la retención tributaria (USD)`: Retención en USD
- `Importe de la retención tributaria (EUR)`: Retención en EUR
- `ID de posición`: Identificador único
- `Tipo`: Tipo de operación
- `ISIN`: Código ISIN del instrumento

> **Nota**: Esta estructura corresponde al formato estándar de exportación de dividendos de eToro.

## 🛠️ Tecnologías Utilizadas

- **React 18** con TypeScript
- **Material-UI** para la interfaz
- **Chart.js** para gráficos
- **XLSX** para procesamiento Excel
- **ESLint** para calidad de código
- **Vite** para desarrollo rápido

## 🚀 Desarrollo

```bash
# Instalar dependencias
npm install

# Iniciar desarrollo
npm run dev

# Build para producción
npm run build

# Lint del código
npm run lint

# Deploy a GitHub Pages
npm run deploy
```

## 📝 Notas Técnicas

- La aplicación maneja automáticamente diferentes formatos de fecha
- Los archivos grandes se procesan de forma asíncrona con estados de carga
- Los errores se muestran de forma user-friendly
- El código está completamente tipado con TypeScript
- Responsive design para móviles y tablets
