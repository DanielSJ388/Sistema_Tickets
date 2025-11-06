# 📊 Tests de Rendimiento - Sistema de Tickets

Este directorio contiene una suite completa de tests de carga, rendimiento y estrés para el Sistema de Tickets.

## 📁 Estructura de Tests

```
Backend/tests/
├── performance.test.ts    # Tests de rendimiento con Jest
├── load.test.ts          # Tests de carga con Bun
├── benchmark.ts          # Script de benchmarking visual
└── README.md            # Esta documentación
```

## 🚀 Requisitos Previos

1. **Servidor Backend corriendo:**
   ```bash
   bun run dev:backend
   ```

2. **Base de datos MongoDB conectada** (configurada en `.env`)

## 🧪 Tipos de Tests

### 1. Tests de Tiempo de Respuesta
Miden la latencia de los endpoints principales del sistema.

**Qué prueban:**
- ⏱️ Registro de usuario < 500ms
- ⏱️ Inicio de sesión < 300ms
- ⏱️ Creación de ticket < 400ms
- ⏱️ Consulta de tickets < 200ms

### 2. Tests de Carga (Load Testing)
Simulan múltiples usuarios concurrentes usando el sistema.

**Qué prueban:**
- 🔄 50 registros simultáneos
- 🔄 100 creaciones de tickets simultáneas
- 🔄 200 consultas simultáneas

### 3. Tests de Estrés (Stress Testing)
Prueban el sistema bajo condiciones extremas.

**Qué prueban:**
- 💪 Rendimiento con 1000 tickets en base de datos
- 💪 100 operaciones mixtas simultáneas
- 💪 Estabilidad bajo carga continua

### 4. Tests de Throughput
Miden la capacidad de procesamiento del sistema.

**Qué prueban:**
- 📊 Operaciones por segundo
- 📊 Percentiles de latencia (P50, P90, P95, P99)
- 📊 Escalabilidad lineal vs exponencial

### 5. Tests de Concurrencia
Verifican que no haya condiciones de carrera.

**Qué prueban:**
- 🔀 Operaciones mixtas de lectura/escritura
- 🔀 Unicidad de números de ticket
- 🔀 Consistencia de datos bajo carga

## 🎯 Cómo Ejecutar los Tests

### Opción 1: Tests de Carga (Recomendado para Bun)

```bash
# Ejecutar todos los tests de carga
bun test Backend/tests/load.test.ts

# Con output verbose
bun test --verbose Backend/tests/load.test.ts
```

**Output esperado:**
```
📊 100 consultas HTTP simultáneas
   ⏱️  Tiempo total: 2458.32ms
   📈 Tiempo promedio: 24.58ms
   ✅ Exitosos: 100/100
   🚀 Throughput: 40.68 ops/seg
```

### Opción 2: Benchmark Visual

```bash
# Ejecutar benchmark completo
bun run benchmark
```

**Output esperado:**
```
╔════════════════════════════════════════════════╗
║        BENCHMARK - SISTEMA DE TICKETS         ║
╚════════════════════════════════════════════════╝

🔄 Ejecutando: Consulta de Tickets (GET /tickets)
   Cantidad: 200 | Concurrencia: 20
   Progreso: 100%

📊 Resultados: Consulta de Tickets (GET /tickets)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ⏱️  Tiempo Total:    3245.67ms
   📈 Tiempo Promedio: 16.23ms
   ⚡ Tiempo Mínimo:   12.45ms
   🔥 Tiempo Máximo:   89.34ms
   🚀 Throughput:      61.63 ops/seg
   ✅ Exitosos:        200 (100.00%)

   📊 Percentiles de Latencia:
      P50: 15.23ms
      P90: 25.67ms
      P95: 34.89ms
      P99: 78.12ms
```

### Opción 3: Tests con Jest (Performance)

```bash
# Ejecutar tests de performance
npm test -- Backend/tests/performance.test.ts

# O con Jest directamente
jest Backend/tests/performance.test.ts
```

## 📈 Métricas Clave

### Throughput (Operaciones por Segundo)
- **Excelente:** > 100 ops/seg 🟢
- **Bueno:** 50-100 ops/seg 🟡
- **Mejorar:** < 50 ops/seg 🔴

### Latencia (Tiempo de Respuesta)
- **P50 (Mediana):** < 100ms 🟢
- **P95:** < 500ms 🟢
- **P99:** < 1000ms 🟡

### Tasa de Éxito
- **Perfecta:** 100% 🟢
- **Buena:** > 95% 🟡
- **Crítica:** < 95% 🔴

## 🔍 Interpretación de Resultados

### ✅ Sistema Saludable
```
✅ Throughput: Excelente (>100 ops/seg)
✅ Latencia: Excelente (<500ms P95)
✅ Estabilidad: Perfecta (100% éxito)
```

### ⚠️ Sistema con Advertencias
```
⚠️ Throughput: Bueno (50-100 ops/seg)
⚠️ Latencia: Aceptable (500-1000ms P95)
⚠️ Estabilidad: Buena (>95% éxito)
```

### 🔴 Sistema Necesita Optimización
```
❌ Throughput: Necesita optimización (<50 ops/seg)
❌ Latencia: Alta (>1000ms P95)
❌ Estabilidad: Necesita atención (<95% éxito)
```

## 🛠️ Escenarios de Testing

### Escenario 1: Test Rápido (5 minutos)
```bash
# Solo benchmark básico
bun run benchmark
```

### Escenario 2: Test Completo (15 minutos)
```bash
# Ejecutar todos los tests de carga
bun test Backend/tests/load.test.ts
```

### Escenario 3: Test Exhaustivo (30+ minutos)
```bash
# Ejecutar todos los tests (Jest + Bun)
npm test
bun test Backend/tests/load.test.ts
bun run benchmark
```

## 📊 Reportes y Análisis

### Generar Reporte de Benchmark
Los resultados del benchmark se muestran directamente en la terminal con colores y formato visual.

### Guardar Resultados
```bash
# Guardar output del benchmark en archivo
bun run benchmark > resultados_$(date +%Y%m%d_%H%M%S).txt
```

### Comparar Rendimiento
```bash
# Ejecutar antes de cambios
bun run benchmark > benchmark_antes.txt

# Hacer cambios en el código...

# Ejecutar después de cambios
bun run benchmark > benchmark_despues.txt

# Comparar resultados
diff benchmark_antes.txt benchmark_despues.txt
```

## 🎓 Conceptos Importantes

### Percentiles de Latencia
- **P50 (Mediana):** 50% de las requests son más rápidas que este valor
- **P90:** 90% de las requests son más rápidas que este valor
- **P95:** 95% de las requests son más rápidas que este valor
- **P99:** 99% de las requests son más rápidas que este valor

### Throughput vs Latencia
- **Throughput:** Cuántas operaciones se pueden procesar por segundo
- **Latencia:** Cuánto tiempo tarda cada operación individual
- Un sistema puede tener alto throughput pero alta latencia si procesa muchas operaciones en paralelo

### Carga vs Estrés
- **Test de Carga:** Simula uso normal con múltiples usuarios
- **Test de Estrés:** Lleva el sistema al límite para encontrar puntos de falla

## 🐛 Troubleshooting

### Error: "No se puede conectar al servidor"
```bash
# Asegúrate de que el backend esté corriendo
bun run dev:backend
```

### Error: "MongoDB connection failed"
```bash
# Verifica tu archivo .env
# MONGODB_URI debe estar configurado correctamente
```

### Tests muy lentos
```bash
# Reduce la cantidad de operaciones en los tests
# O ejecuta solo el benchmark rápido
bun run benchmark
```

### Memoria insuficiente
```bash
# Aumenta el límite de memoria de Node
NODE_OPTIONS="--max-old-space-size=4096" bun test
```

## 📝 Personalizar Tests

### Cambiar número de operaciones
Edita los archivos de test y modifica las constantes:
```typescript
const SOLICITUDES = 100;  // Cambiar a tu valor deseado
const CONCURRENCIA = 10;  // Cambiar concurrencia
```

### Cambiar URL del servidor
```bash
# Variable de entorno
API_URL=http://localhost:3000 bun run benchmark

# O edita en .env
TEST_API_URL=http://localhost:3000
```

## 🎯 Objetivos de Rendimiento

Para un sistema de tickets empresarial:

| Métrica | Objetivo | Excelente |
|---------|----------|-----------|
| Latencia P95 | < 500ms | < 200ms |
| Throughput | > 50 ops/seg | > 100 ops/seg |
| Tasa de éxito | > 99% | 100% |
| Concurrencia | 50 usuarios | 100+ usuarios |

## 📚 Referencias

- [Web Performance Metrics](https://web.dev/metrics/)
- [Load Testing Best Practices](https://k6.io/docs/test-types/load-testing/)
- [Understanding Percentiles](https://www.elastic.co/blog/averages-can-dangerous-use-percentile)

## 🤝 Contribuir

Si agregas nuevos tests:
1. Documenta qué miden
2. Incluye métricas claras de éxito/falla
3. Actualiza este README
4. Usa nombres descriptivos

---

**Última actualización:** Noviembre 2025
**Versión:** 1.0.0
