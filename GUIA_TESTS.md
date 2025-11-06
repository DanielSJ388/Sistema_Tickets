# 🎯 Guía Completa de Tests - Sistema de Tickets

## 📋 Resumen

Has creado una suite completa de tests de rendimiento, carga y estrés para tu Sistema de Tickets usando **Bun** y **TypeScript**.

## 🗂️ Archivos Creados

### 1. **Tests de Rendimiento**
- **📁 Ubicación:** `Backend/tests/`
- **📄 Archivos:**
  - `load.test.ts` - Tests de carga con Bun
  - `performance.test.ts` - Tests de rendimiento con Jest
  - `benchmark.ts` - Benchmark visual completo
  - `simple-test.ts` - Test rápido y simple
  - `README.md` - Documentación detallada

### 2. **Script de Generación de Datos**
- **📁 Ubicación:** `Backend/scripts/`
- **📄 Archivos:**
  - `generateTickets.js` - Genera tickets de prueba
  - `README.md` - Documentación del script

## 🚀 Comandos Rápidos

### Tests de Carga y Rendimiento

```bash
# Test simple y rápido (30 segundos)
bun run test:simple

# Benchmark completo con colores (2-3 minutos)
bun run benchmark

# Tests de carga completos (5-10 minutos)
bun test Backend/tests/load.test.ts

# Todos los tests
bun test
```

### Generar Datos de Prueba

```bash
# Generar 6000 tickets
cd Backend/scripts
node generateTickets.js 6000

# Generar cantidad personalizada
node generateTickets.js 1000

# Con tamaño de lote personalizado
node generateTickets.js 5000 200
```

## 📊 Tipos de Tests Implementados

### 1. ⏱️ Tests de Latencia
**Qué miden:** Tiempo de respuesta individual de cada endpoint

**Métricas:**
- Tiempo promedio de respuesta
- Tiempo mínimo y máximo
- Percentiles (P50, P90, P95, P99)

**Objetivo:** 
- ✅ < 200ms = Excelente
- 🟡 200-500ms = Aceptable
- 🔴 > 500ms = Necesita optimización

### 2. 🔄 Tests de Carga (Load Testing)
**Qué miden:** Comportamiento con múltiples usuarios simultáneos

**Métricas:**
- Requests por segundo (throughput)
- Tasa de éxito/fallo
- Tiempo total de procesamiento

**Escenarios:**
- 50 usuarios simultáneos
- 100 operaciones concurrentes
- 200 consultas paralelas

### 3. 💪 Tests de Estrés (Stress Testing)
**Qué miden:** Límites del sistema bajo carga extrema

**Métricas:**
- Degradación del rendimiento
- Punto de quiebre
- Recuperación del sistema

**Escenarios:**
- 1000+ tickets en BD
- Carga continua por tiempo prolongado
- Operaciones mixtas intensivas

### 4. 🔀 Tests de Concurrencia
**Qué miden:** Condiciones de carrera y consistencia de datos

**Métricas:**
- Integridad de datos
- Unicidad de identificadores
- Manejo de conflictos

**Validaciones:**
- No duplicación de números de ticket
- Consistencia en operaciones simultáneas
- Transacciones atómicas

### 5. 📈 Tests de Throughput
**Qué miden:** Capacidad de procesamiento del sistema

**Métricas:**
- Operaciones por segundo
- Escalabilidad lineal vs exponencial
- Eficiencia con diferentes cargas

**Objetivo:**
- ✅ > 100 ops/seg = Excelente
- 🟡 50-100 ops/seg = Bueno
- 🔴 < 50 ops/seg = Necesita mejora

## 📖 Ejemplo de Uso

### Escenario 1: Verificación Rápida Diaria

```bash
# Antes de empezar a trabajar
bun run test:simple
```

**Output esperado:**
```
✅ Servidor conectado
🟢 Excelente latencia (85ms promedio)
🟢 Sistema estable bajo carga
✨ Tests completados
```

### Escenario 2: Prueba Antes de Deploy

```bash
# Ejecutar benchmark completo
bun run benchmark

# Guardar resultados
bun run benchmark > benchmark_pre_deploy.txt
```

### Escenario 3: Análisis de Rendimiento Completo

```bash
# 1. Generar datos de prueba
cd Backend/scripts
node generateTickets.js 1000

# 2. Ejecutar test simple
cd ../..
bun run test:simple

# 3. Ejecutar benchmark
bun run benchmark

# 4. Tests de carga completos
bun test Backend/tests/load.test.ts
```

## 🎓 Interpretación de Resultados

### ✅ Sistema Saludable

```
📊 Consulta de Tickets
   ⏱️  Tiempo Promedio: 45.23ms
   🚀 Throughput: 125.45 ops/seg
   ✅ Exitosos: 200 (100%)
   
   📊 Percentiles:
      P50: 42.15ms
      P95: 89.34ms
      P99: 156.78ms
```

**Interpretación:**
- ✅ Latencia baja y consistente
- ✅ Alto throughput
- ✅ Sin errores
- ✅ P99 bajo indica pocos outliers

### ⚠️ Sistema con Problemas

```
📊 Consulta de Tickets
   ⏱️  Tiempo Promedio: 2174.65ms
   🚀 Throughput: 2.69 ops/seg
   ✅ Exitosos: 50 (100%)
   
   📊 Percentiles:
      P50: 1498.69ms
      P95: 3245.23ms
      P99: 4567.89ms
```

**Interpretación:**
- 🔴 Latencia muy alta (>2 segundos)
- 🔴 Bajo throughput (<5 ops/seg)
- 🟡 Sin errores pero lento
- 🔴 Gran variación en tiempos (P99 alto)

**Posibles causas:**
1. Demasiados datos en BD sin índices
2. Consultas no optimizadas
3. Conexión lenta a MongoDB
4. Servidor con pocos recursos

**Soluciones:**
1. Agregar índices a MongoDB
2. Paginar resultados
3. Usar caché (Redis)
4. Optimizar queries

## 🔧 Optimizaciones Comunes

### 1. Base de Datos Lenta

**Problema:** Consulta de 6000 tickets tarda 3+ segundos

**Solución:**
```javascript
// En tickets.js - Agregar paginación
async function getAllTickets(page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  return await Ticket.find()
    .sort({ CreatedAt: -1 })
    .limit(limit)
    .skip(skip);
}

// Agregar índices en MongoDB
TicketSchema.index({ CreatedAt: -1 });
TicketSchema.index({ Status: 1 });
TicketSchema.index({ Priority: 1 });
```

### 2. Demasiados Datos en Respuesta

**Problema:** Respuestas muy grandes ralentizan el sistema

**Solución:**
```javascript
// Seleccionar solo campos necesarios
async function getAllTickets() {
  return await Ticket.find()
    .select('Number Title Status Priority CreatedAt')
    .sort({ CreatedAt: -1 })
    .limit(100);
}
```

### 3. Sin Caché

**Problema:** Consultas repetidas golpean la BD cada vez

**Solución:**
```javascript
// Usar caché simple en memoria
const cache = new Map();
const CACHE_TTL = 60000; // 1 minuto

async function getAllTicketsCached() {
  const cacheKey = 'all_tickets';
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  const data = await getAllTickets();
  cache.set(cacheKey, { data, timestamp: Date.now() });
  return data;
}
```

## 📊 Métricas Objetivo por Endpoint

| Endpoint | P50 | P95 | P99 | Throughput | Tasa Éxito |
|----------|-----|-----|-----|------------|------------|
| GET /tickets | <50ms | <200ms | <500ms | >100 ops/s | 100% |
| POST /tickets | <100ms | <300ms | <800ms | >50 ops/s | 100% |
| GET /users | <30ms | <100ms | <200ms | >150 ops/s | 100% |
| PUT /tickets/:id | <80ms | <250ms | <600ms | >80 ops/s | 100% |

## 🐛 Troubleshooting

### Problema: Tests fallan con "Cannot connect"

```bash
# Solución: Asegúrate de que el servidor esté corriendo
bun run dev:backend
```

### Problema: Resultados inconsistentes

```bash
# Solución: Limpia la BD entre tests
curl -X DELETE http://localhost:5000/tickets/debug/clear

# O regenera datos
cd Backend/scripts
node generateTickets.js 100
```

### Problema: Tests muy lentos

**Causa:** Muchos tickets en BD

**Solución:**
1. Reduce cantidad en tests
2. Usa BD de prueba separada
3. Implementa paginación

### Problema: Out of Memory

```bash
# Solución: Aumenta memoria de Node
NODE_OPTIONS="--max-old-space-size=4096" bun test
```

## 📚 Recursos Adicionales

### Para Aprender Más

1. **Web Performance:**
   - https://web.dev/metrics/
   - https://developer.mozilla.org/es/docs/Web/Performance

2. **Load Testing:**
   - https://k6.io/docs/
   - https://www.artillery.io/docs

3. **Database Optimization:**
   - https://www.mongodb.com/docs/manual/indexes/
   - https://mongoosejs.com/docs/queries.html

### Herramientas Recomendadas

1. **Artillery** - Load testing avanzado
2. **K6** - Performance testing moderno
3. **MongoDB Compass** - Análisis de queries
4. **New Relic/DataDog** - Monitoreo en producción

## 🎯 Checklist de Performance

Antes de deploy, verifica:

- [ ] Test simple pasa sin errores
- [ ] Latencia P95 < 500ms
- [ ] Throughput > 50 ops/seg
- [ ] Tasa de éxito 100%
- [ ] Sin memory leaks
- [ ] Base de datos tiene índices
- [ ] Respuestas están paginadas
- [ ] Hay manejo de errores adecuado
- [ ] Timeouts configurados correctamente
- [ ] Logs de performance habilitados

## 💡 Mejores Prácticas

1. **Ejecuta tests regularmente**
   - Diariamente: `test:simple`
   - Semanalmente: `benchmark`
   - Antes de deploy: Suite completa

2. **Mantén histórico de resultados**
   ```bash
   bun run benchmark > resultados/$(date +%Y%m%d).txt
   ```

3. **Monitorea en producción**
   - Usa herramientas como PM2, New Relic
   - Configura alertas para latencia alta
   - Revisa logs regularmente

4. **Optimiza iterativamente**
   - Identifica el cuello de botella
   - Optimiza una cosa a la vez
   - Mide el impacto con tests
   - Repite

## 📝 Conclusión

Ahora tienes una suite completa de tests de rendimiento que te permite:

✅ Medir el rendimiento actual del sistema
✅ Detectar cuellos de botella
✅ Validar optimizaciones
✅ Prevenir regresiones de performance
✅ Asegurar calidad antes de deploy

**Próximos pasos recomendados:**

1. Ejecuta `bun run test:simple` para establecer baseline
2. Implementa paginación en endpoints lentos
3. Agrega índices a MongoDB
4. Ejecuta `benchmark` para verificar mejoras
5. Configura CI/CD para correr tests automáticamente

---

**Creado:** Noviembre 2025  
**Tecnologías:** Bun, TypeScript, MongoDB, Express  
**Última actualización:** 5 de Noviembre, 2025
