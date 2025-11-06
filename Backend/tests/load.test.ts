/**
 * ============================================================
 * TESTS DE CARGA CON BUN - Sistema de Tickets
 * ============================================================
 * 
 * Tests de carga optimizados para ejecutarse con Bun
 * Uso: bun test Backend/tests/load.test.ts
 */

import { describe, test, expect, beforeAll, afterAll } from "bun:test";

const BASE_URL = process.env.TEST_API_URL || "http://localhost:5000";

// ========================================
// FUNCIONES AUXILIARES
// ========================================

async function crearUsuario(index: number) {
  const response = await fetch(`${BASE_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: `user_load_${index}_${Date.now()}`,
      email: `user_load_${index}_${Date.now()}@test.com`,
      password: "test123456"
    })
  });
  return response.json();
}

async function crearTicket(index: number, userId: string = "test_user") {
  const response = await fetch(`${BASE_URL}/tickets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      Title: `Ticket de carga ${index}`,
      Description: `Este es un ticket de prueba de carga número ${index}`,
      Priority: ["Low", "Medium", "High"][index % 3],
      categoria: ["Soporte Técnico", "Hardware", "Software", "Red"][index % 4],
      usuario_nombre: userId
    })
  });
  return response.json();
}

async function obtenerTickets() {
  const response = await fetch(`${BASE_URL}/tickets`);
  return response.json();
}

function medirTiempo<T>(fn: () => Promise<T>): Promise<{ resultado: T; tiempo: number }> {
  return new Promise(async (resolve) => {
    const inicio = performance.now();
    const resultado = await fn();
    const fin = performance.now();
    resolve({ resultado, tiempo: fin - inicio });
  });
}

async function ejecutarParalelo<T>(
  cantidad: number,
  fn: (i: number) => Promise<T>,
  descripcion: string = ""
): Promise<{
  resultados: T[];
  tiempoTotal: number;
  tiempoPromedio: number;
  exitosos: number;
  fallidos: number;
}> {
  const inicio = performance.now();
  
  const promesas = Array.from({ length: cantidad }, (_, i) => fn(i));
  const resultados = await Promise.all(promesas);
  
  const fin = performance.now();
  const tiempoTotal = fin - inicio;
  const tiempoPromedio = tiempoTotal / cantidad;
  
  // Contar exitosos vs fallidos
  const exitosos = resultados.filter(r => 
    r && typeof r === 'object' && ('ok' in r ? r.ok : true)
  ).length;
  const fallidos = cantidad - exitosos;
  
  if (descripcion) {
    console.log(`\n📊 ${descripcion}`);
    console.log(`   ⏱️  Tiempo total: ${tiempoTotal.toFixed(2)}ms`);
    console.log(`   📈 Tiempo promedio: ${tiempoPromedio.toFixed(2)}ms`);
    console.log(`   ✅ Exitosos: ${exitosos}/${cantidad}`);
    if (fallidos > 0) {
      console.log(`   ❌ Fallidos: ${fallidos}`);
    }
    console.log(`   🚀 Throughput: ${((cantidad / tiempoTotal) * 1000).toFixed(2)} ops/seg`);
  }
  
  return { resultados, tiempoTotal, tiempoPromedio, exitosos, fallidos };
}

// ========================================
// TESTS DE CARGA CON HTTP
// ========================================

describe("🔥 Tests de Carga - HTTP API", () => {
  
  test("Debe manejar 100 solicitudes de consulta simultáneas", async () => {
    const SOLICITUDES = 100;
    
    const metricas = await ejecutarParalelo(
      SOLICITUDES,
      async () => await obtenerTickets(),
      `${SOLICITUDES} consultas HTTP simultáneas`
    );
    
    expect(metricas.exitosos).toBe(SOLICITUDES);
    expect(metricas.tiempoPromedio).toBeLessThan(500);
    console.log("   ✅ Test de 100 consultas completado");
  }, 30000);
  
  test("Debe crear 50 tickets de forma simultánea", async () => {
    const TICKETS = 50;
    
    const metricas = await ejecutarParalelo(
      TICKETS,
      async (i) => await crearTicket(i, "load_test_user"),
      `${TICKETS} creaciones de tickets simultáneas`
    );
    
    expect(metricas.exitosos).toBe(TICKETS);
    expect(metricas.tiempoPromedio).toBeLessThan(1000);
    console.log("   ✅ Test de 50 creaciones completado");
  }, 30000);
  
  test("Debe registrar 30 usuarios simultáneamente", async () => {
    const USUARIOS = 30;
    
    const metricas = await ejecutarParalelo(
      USUARIOS,
      async (i) => await crearUsuario(i),
      `${USUARIOS} registros simultáneos`
    );
    
    expect(metricas.exitosos).toBe(USUARIOS);
    expect(metricas.tiempoPromedio).toBeLessThan(1500);
    console.log("   ✅ Test de 30 registros completado");
  }, 30000);
});

// ========================================
// TESTS DE ESTRÉS
// ========================================

describe("💪 Tests de Estrés - HTTP API", () => {
  
  test("Debe mantener rendimiento con 500 solicitudes consecutivas", async () => {
    const SOLICITUDES = 500;
    const BATCH_SIZE = 50;
    const tiempos: number[] = [];
    
    console.log(`\n🔥 Enviando ${SOLICITUDES} solicitudes en batches de ${BATCH_SIZE}...`);
    
    for (let batch = 0; batch < SOLICITUDES / BATCH_SIZE; batch++) {
      const inicio = performance.now();
      
      const promesas = Array.from({ length: BATCH_SIZE }, () => obtenerTickets());
      await Promise.all(promesas);
      
      const fin = performance.now();
      const tiempoBatch = fin - inicio;
      tiempos.push(tiempoBatch);
      
      console.log(`   Batch ${batch + 1}/${SOLICITUDES / BATCH_SIZE}: ${tiempoBatch.toFixed(2)}ms`);
    }
    
    const tiempoPromedio = tiempos.reduce((a, b) => a + b, 0) / tiempos.length;
    const tiempoMaximo = Math.max(...tiempos);
    const tiempoMinimo = Math.min(...tiempos);
    
    console.log(`\n   📊 Resultados:`);
    console.log(`      Promedio por batch: ${tiempoPromedio.toFixed(2)}ms`);
    console.log(`      Mínimo: ${tiempoMinimo.toFixed(2)}ms`);
    console.log(`      Máximo: ${tiempoMaximo.toFixed(2)}ms`);
    
    // El tiempo máximo no debe ser más del doble del promedio
    // (indica que el sistema se degrada bajo carga)
    expect(tiempoMaximo).toBeLessThan(tiempoPromedio * 2);
    
    console.log("   ✅ El sistema mantiene rendimiento estable bajo carga");
  }, 60000);
  
  test("Test de resistencia - 5 segundos de carga continua", async () => {
    const DURACION_MS = 5000;
    let solicitudesEnviadas = 0;
    let solicitudesExitosas = 0;
    let solicitudesFallidas = 0;
    
    console.log(`\n⏰ Enviando solicitudes durante ${DURACION_MS / 1000} segundos...`);
    
    const inicio = Date.now();
    
    while (Date.now() - inicio < DURACION_MS) {
      try {
        const promesas = Array.from({ length: 10 }, () => obtenerTickets());
        await Promise.all(promesas);
        solicitudesEnviadas += 10;
        solicitudesExitosas += 10;
      } catch (error) {
        solicitudesFallidas += 10;
      }
      
      // Pequeña pausa para no saturar completamente
      await Bun.sleep(10);
    }
    
    const tiempoTotal = Date.now() - inicio;
    const throughput = (solicitudesEnviadas / tiempoTotal) * 1000;
    const tasaExito = (solicitudesExitosas / solicitudesEnviadas) * 100;
    
    console.log(`\n   📊 Resultados del test de resistencia:`);
    console.log(`      Solicitudes enviadas: ${solicitudesEnviadas}`);
    console.log(`      Exitosas: ${solicitudesExitosas} (${tasaExito.toFixed(2)}%)`);
    console.log(`      Fallidas: ${solicitudesFallidas}`);
    console.log(`      Throughput: ${throughput.toFixed(2)} req/seg`);
    
    // Al menos 80% de las solicitudes deben ser exitosas
    expect(tasaExito).toBeGreaterThanOrEqual(80);
    
    // El throughput debe ser razonable (al menos 50 req/seg)
    expect(throughput).toBeGreaterThanOrEqual(50);
    
    console.log("   ✅ Test de resistencia completado");
  }, 30000);
});

// ========================================
// TESTS DE LATENCIA
// ========================================

describe("⚡ Tests de Latencia", () => {
  
  test("Medir latencia de endpoints principales", async () => {
    const endpoints = [
      { name: "GET /tickets", fn: () => obtenerTickets() },
      { name: "POST /tickets", fn: () => crearTicket(Date.now(), "latency_test") },
    ];
    
    console.log(`\n📊 Midiendo latencia de ${endpoints.length} endpoints (10 muestras cada uno)...\n`);
    
    for (const endpoint of endpoints) {
      const tiempos: number[] = [];
      
      for (let i = 0; i < 10; i++) {
        const { tiempo } = await medirTiempo(endpoint.fn);
        tiempos.push(tiempo);
        await Bun.sleep(100); // Pequeña pausa entre mediciones
      }
      
      const promedio = tiempos.reduce((a, b) => a + b, 0) / tiempos.length;
      const minimo = Math.min(...tiempos);
      const maximo = Math.max(...tiempos);
      const sorted = [...tiempos].sort((a, b) => a - b);
      const p95 = sorted[Math.floor(sorted.length * 0.95)];
      
      console.log(`   ${endpoint.name}:`);
      console.log(`      Promedio: ${promedio.toFixed(2)}ms`);
      console.log(`      Mínimo: ${minimo.toFixed(2)}ms`);
      console.log(`      Máximo: ${maximo.toFixed(2)}ms`);
      console.log(`      P95: ${p95.toFixed(2)}ms`);
      console.log("");
      
      // Validar que la latencia sea aceptable
      expect(promedio).toBeLessThan(500);
      expect(p95).toBeLessThan(1000);
    }
    
    console.log("   ✅ Latencias dentro de los límites aceptables");
  }, 30000);
});

// ========================================
// TESTS DE CONCURRENCIA
// ========================================

describe("🔀 Tests de Concurrencia", () => {
  
  test("Operaciones simultáneas de lectura y escritura", async () => {
    const OPERACIONES = 100;
    const RATIO_LECTURA = 0.7; // 70% lecturas, 30% escrituras
    
    console.log(`\n🔀 Ejecutando ${OPERACIONES} operaciones mixtas (70% lecturas, 30% escrituras)...`);
    
    const metricas = await ejecutarParalelo(
      OPERACIONES,
      async (i) => {
        if (Math.random() < RATIO_LECTURA) {
          // Operación de lectura
          return await obtenerTickets();
        } else {
          // Operación de escritura
          return await crearTicket(i, "concurrent_test");
        }
      },
      "Operaciones mixtas concurrentes"
    );
    
    expect(metricas.exitosos).toBe(OPERACIONES);
    expect(metricas.tiempoPromedio).toBeLessThan(800);
    
    console.log("   ✅ Operaciones concurrentes manejadas correctamente");
  }, 30000);
  
  test("No debe haber condiciones de carrera en números de ticket", async () => {
    const TICKETS = 50;
    
    console.log(`\n🔢 Creando ${TICKETS} tickets simultáneamente para verificar números únicos...`);
    
    const resultados = await ejecutarParalelo(
      TICKETS,
      async (i) => await crearTicket(i, "race_condition_test"),
      "Creación simultánea para test de race condition"
    );
    
    // Obtener todos los tickets creados
    const tickets = await obtenerTickets();
    
    // Extraer los números de ticket
    const numeros = tickets.map((t: any) => t.Number);
    
    // Verificar que no haya duplicados
    const numerosUnicos = new Set(numeros);
    
    console.log(`\n   📊 Análisis de números de ticket:`);
    console.log(`      Total de tickets: ${tickets.length}`);
    console.log(`      Números únicos: ${numerosUnicos.size}`);
    console.log(`      Duplicados encontrados: ${tickets.length - numerosUnicos.size}`);
    
    expect(numerosUnicos.size).toBe(tickets.length);
    console.log("   ✅ No se detectaron condiciones de carrera");
  }, 30000);
});

console.log(`
╔════════════════════════════════════════════════╗
║     Tests de Carga - Sistema de Tickets       ║
║                                                ║
║  Asegúrate de tener el servidor corriendo:    ║
║  bun run dev:backend                           ║
╚════════════════════════════════════════════════╝
`);
