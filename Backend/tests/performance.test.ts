/**
 * ============================================================
 * TESTS DE RENDIMIENTO Y CARGA - Sistema de Tickets
 * ============================================================
 * 
 * Este archivo contiene tests de:
 * - Carga (Load Testing): Múltiples solicitudes simultáneas
 * - Tiempo de respuesta (Response Time): Latencia de endpoints
 * - Estrés (Stress Testing): Rendimiento bajo carga extrema
 * - Throughput: Capacidad de procesamiento
 */

import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { beforeAll, afterAll, afterEach, describe, test, expect } from '@jest/globals';

// Importar funciones del sistema
const { registrarUsuario, iniciarSesion, obtenerUsuarios } = require("../server/user.js");
const { createTicket, getAllTickets, updateTicketStatus } = require("../server/tickets.js");

let mongoServer: MongoMemoryServer;

// ========================================
// CONFIGURACIÓN DE TESTS
// ========================================

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  console.log("🔗 MongoDB en memoria conectado para tests de performance");
}, 30000); // Timeout de 30 segundos

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
  console.log("🔌 MongoDB desconectado");
}, 30000);

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// ========================================
// FUNCIONES AUXILIARES
// ========================================

/**
 * Mide el tiempo de ejecución de una función
 */
async function medirTiempo<T>(fn: () => Promise<T>): Promise<{ resultado: T; tiempo: number }> {
  const inicio = performance.now();
  const resultado = await fn();
  const fin = performance.now();
  const tiempo = fin - inicio;
  return { resultado, tiempo };
}

/**
 * Ejecuta múltiples promesas en paralelo y retorna métricas
 */
async function ejecutarParalelo<T>(
  tareas: (() => Promise<T>)[],
  descripcion: string = ""
): Promise<{
  resultados: T[];
  tiempoTotal: number;
  tiempoPromedio: number;
  tiempoMinimo: number;
  tiempoMaximo: number;
}> {
  const inicioTotal = performance.now();
  const tiemposIndividuales: number[] = [];
  
  const promesas = tareas.map(async (tarea) => {
    const inicio = performance.now();
    const resultado = await tarea();
    const fin = performance.now();
    tiemposIndividuales.push(fin - inicio);
    return resultado;
  });
  
  const resultados = await Promise.all(promesas);
  const finTotal = performance.now();
  
  const tiempoTotal = finTotal - inicioTotal;
  const tiempoPromedio = tiemposIndividuales.reduce((a, b) => a + b, 0) / tiemposIndividuales.length;
  const tiempoMinimo = Math.min(...tiemposIndividuales);
  const tiempoMaximo = Math.max(...tiemposIndividuales);
  
  if (descripcion) {
    console.log(`\n📊 Métricas - ${descripcion}`);
    console.log(`   ⏱️  Tiempo total: ${tiempoTotal.toFixed(2)}ms`);
    console.log(`   📈 Tiempo promedio: ${tiempoPromedio.toFixed(2)}ms`);
    console.log(`   ⚡ Tiempo mínimo: ${tiempoMinimo.toFixed(2)}ms`);
    console.log(`   🔥 Tiempo máximo: ${tiempoMaximo.toFixed(2)}ms`);
  }
  
  return { resultados, tiempoTotal, tiempoPromedio, tiempoMinimo, tiempoMaximo };
}

/**
 * Calcula percentiles de un array de tiempos
 */
function calcularPercentiles(tiempos: number[]): {
  p50: number;
  p90: number;
  p95: number;
  p99: number;
} {
  const sorted = [...tiempos].sort((a, b) => a - b);
  const len = sorted.length;
  
  return {
    p50: sorted[Math.floor(len * 0.50)],
    p90: sorted[Math.floor(len * 0.90)],
    p95: sorted[Math.floor(len * 0.95)],
    p99: sorted[Math.floor(len * 0.99)]
  };
}

// ========================================
// TESTS DE TIEMPO DE RESPUESTA
// ========================================

describe("⏱️ Tests de Tiempo de Respuesta", () => {
  
  test("Registro de usuario debe responder en menos de 500ms", async () => {
    const { tiempo } = await medirTiempo(async () => {
      return await registrarUsuario({
        username: "usuario_test",
        email: "test@example.com",
        password: "password123"
      });
    });
    
    console.log(`   ⏱️ Tiempo de registro: ${tiempo.toFixed(2)}ms`);
    expect(tiempo).toBeLessThan(500); // Debe responder en menos de 500ms
  });
  
  test("Inicio de sesión debe responder en menos de 300ms", async () => {
    // Primero registrar un usuario
    await registrarUsuario({
      username: "usuario_test",
      email: "test@example.com",
      password: "password123"
    });
    
    // Medir tiempo de inicio de sesión
    const { tiempo } = await medirTiempo(async () => {
      return await iniciarSesion({
        identifier: "usuario_test",
        password: "password123"
      });
    });
    
    console.log(`   ⏱️ Tiempo de login: ${tiempo.toFixed(2)}ms`);
    expect(tiempo).toBeLessThan(300); // Debe responder en menos de 300ms
  });
  
  test("Creación de ticket debe responder en menos de 400ms", async () => {
    const { tiempo } = await medirTiempo(async () => {
      return await createTicket({
        Title: "Ticket de prueba",
        Description: "Descripción de prueba",
        Priority: "High",
        categoria: "Soporte Técnico",
        usuario_nombre: "Usuario Test"
      });
    });
    
    console.log(`   ⏱️ Tiempo de creación de ticket: ${tiempo.toFixed(2)}ms`);
    expect(tiempo).toBeLessThan(400);
  });
  
  test("Consulta de tickets debe responder en menos de 200ms", async () => {
    // Crear algunos tickets primero
    for (let i = 0; i < 10; i++) {
      await createTicket({
        Title: `Ticket ${i}`,
        Description: `Descripción ${i}`,
        Priority: "Medium",
        categoria: "Hardware",
        usuario_nombre: "Usuario Test"
      });
    }
    
    const { tiempo } = await medirTiempo(async () => {
      return await getAllTickets();
    });
    
    console.log(`   ⏱️ Tiempo de consulta: ${tiempo.toFixed(2)}ms`);
    expect(tiempo).toBeLessThan(200);
  });
});

// ========================================
// TESTS DE CARGA
// ========================================

describe("🔄 Tests de Carga (Load Testing)", () => {
  
  test("Debe manejar 50 registros de usuarios simultáneos", async () => {
    const USUARIOS = 50;
    
    const tareas = Array.from({ length: USUARIOS }, (_, i) => {
      return async () => {
        return await registrarUsuario({
          username: `usuario_${i}`,
          email: `usuario_${i}@example.com`,
          password: "password123"
        });
      };
    });
    
    const metricas = await ejecutarParalelo(
      tareas,
      `${USUARIOS} registros simultáneos`
    );
    
    // Validaciones
    expect(metricas.resultados.length).toBe(USUARIOS);
    expect(metricas.tiempoPromedio).toBeLessThan(1000); // Promedio < 1s
    expect(metricas.tiempoTotal).toBeLessThan(5000); // Total < 5s
    
    // Verificar que todos se registraron correctamente
    const exitosos = metricas.resultados.filter(r => r.ok).length;
    expect(exitosos).toBe(USUARIOS);
  }, 30000); // Timeout de 30 segundos
  
  test("Debe manejar 100 creaciones de tickets simultáneas", async () => {
    const TICKETS = 100;
    
    const tareas = Array.from({ length: TICKETS }, (_, i) => {
      return async () => {
        return await createTicket({
          Title: `Ticket de carga ${i}`,
          Description: `Descripción del ticket ${i}`,
          Priority: i % 3 === 0 ? "High" : i % 2 === 0 ? "Medium" : "Low",
          categoria: "Soporte Técnico",
          usuario_nombre: "Usuario Test"
        });
      };
    });
    
    const metricas = await ejecutarParalelo(
      tareas,
      `${TICKETS} creaciones de tickets simultáneas`
    );
    
    // Validaciones
    expect(metricas.resultados.length).toBe(TICKETS);
    expect(metricas.tiempoPromedio).toBeLessThan(800); // Promedio < 800ms
    expect(metricas.tiempoTotal).toBeLessThan(10000); // Total < 10s
    
    // Verificar que todos los tickets se crearon
    const tickets = await getAllTickets();
    expect(tickets.length).toBe(TICKETS);
  }, 30000);
  
  test("Debe manejar 200 consultas simultáneas de tickets", async () => {
    const CONSULTAS = 200;
    
    // Crear algunos tickets primero
    for (let i = 0; i < 20; i++) {
      await createTicket({
        Title: `Ticket ${i}`,
        Description: `Descripción ${i}`,
        Priority: "Medium",
        categoria: "Hardware",
        usuario_nombre: "Usuario Test"
      });
    }
    
    const tareas = Array.from({ length: CONSULTAS }, () => {
      return async () => {
        return await getAllTickets();
      };
    });
    
    const metricas = await ejecutarParalelo(
      tareas,
      `${CONSULTAS} consultas simultáneas`
    );
    
    // Validaciones
    expect(metricas.resultados.length).toBe(CONSULTAS);
    expect(metricas.tiempoPromedio).toBeLessThan(500); // Promedio < 500ms
    
    // Todas las consultas deben retornar 20 tickets
    metricas.resultados.forEach(tickets => {
      expect(tickets.length).toBe(20);
    });
  }, 30000);
});

// ========================================
// TESTS DE ESTRÉS
// ========================================

describe("💪 Tests de Estrés (Stress Testing)", () => {
  
  test("Debe mantener rendimiento con 1000 tickets en base de datos", async () => {
    const TICKETS_INICIALES = 1000;
    
    console.log(`   📦 Creando ${TICKETS_INICIALES} tickets...`);
    
    // Crear tickets en lotes para no saturar
    const loteSize = 100;
    for (let lote = 0; lote < TICKETS_INICIALES / loteSize; lote++) {
      const promesas = Array.from({ length: loteSize }, (_, i) => {
        const index = lote * loteSize + i;
        return createTicket({
          Title: `Ticket estrés ${index}`,
          Description: `Descripción larga para simular datos reales. Este es el ticket número ${index} generado para pruebas de estrés.`,
          Priority: index % 3 === 0 ? "High" : index % 2 === 0 ? "Medium" : "Low",
          categoria: ["Soporte Técnico", "Hardware", "Software", "Red"][index % 4],
          usuario_nombre: `Usuario ${index % 10}`
        });
      });
      await Promise.all(promesas);
    }
    
    console.log(`   ✅ ${TICKETS_INICIALES} tickets creados`);
    
    // Ahora medir el tiempo de consulta con muchos tickets
    const { tiempo } = await medirTiempo(async () => {
      return await getAllTickets();
    });
    
    console.log(`   ⏱️ Tiempo de consulta con ${TICKETS_INICIALES} tickets: ${tiempo.toFixed(2)}ms`);
    
    // Incluso con 1000 tickets, debe responder en menos de 1 segundo
    expect(tiempo).toBeLessThan(1000);
  }, 60000); // Timeout de 60 segundos
  
  test("Debe manejar operaciones mixtas bajo carga", async () => {
    const OPERACIONES = 100;
    
    // Crear algunos datos iniciales
    await registrarUsuario({
      username: "admin",
      email: "admin@example.com",
      password: "admin123"
    });
    
    for (let i = 0; i < 10; i++) {
      await createTicket({
        Title: `Ticket inicial ${i}`,
        Description: `Descripción ${i}`,
        Priority: "Medium",
        categoria: "Hardware",
        usuario_nombre: "Admin"
      });
    }
    
    // Crear operaciones mixtas (lecturas, escrituras, actualizaciones)
    const tareas = Array.from({ length: OPERACIONES }, (_, i) => {
      const tipo = i % 3;
      
      if (tipo === 0) {
        // Operación de lectura
        return async () => await getAllTickets();
      } else if (tipo === 1) {
        // Operación de escritura
        return async () => await createTicket({
          Title: `Ticket mixto ${i}`,
          Description: `Descripción ${i}`,
          Priority: "Low",
          categoria: "Software",
          usuario_nombre: "Usuario Test"
        });
      } else {
        // Operación de actualización (simulada con lectura)
        return async () => await obtenerUsuarios();
      }
    });
    
    const metricas = await ejecutarParalelo(
      tareas,
      `${OPERACIONES} operaciones mixtas`
    );
    
    // Validaciones
    expect(metricas.resultados.length).toBe(OPERACIONES);
    expect(metricas.tiempoPromedio).toBeLessThan(1000);
    
    console.log(`   ✅ ${OPERACIONES} operaciones mixtas completadas`);
  }, 60000);
});

// ========================================
// TESTS DE THROUGHPUT
// ========================================

describe("📊 Tests de Throughput (Capacidad de Procesamiento)", () => {
  
  test("Debe procesar al menos 50 tickets por segundo", async () => {
    const DURACION_MS = 2000; // 2 segundos
    const MINIMO_TICKETS = 100; // Al menos 100 tickets en 2 segundos = 50 tps
    
    let ticketsCreados = 0;
    const inicio = Date.now();
    
    // Crear tickets durante 2 segundos
    while (Date.now() - inicio < DURACION_MS) {
      const promesas = Array.from({ length: 10 }, (_, i) => {
        return createTicket({
          Title: `Ticket throughput ${ticketsCreados + i}`,
          Description: `Descripción rápida`,
          Priority: "Medium",
          categoria: "Soporte Técnico",
          usuario_nombre: "Usuario Test"
        });
      });
      await Promise.all(promesas);
      ticketsCreados += 10;
      
      // Pequeña pausa para no saturar
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    const tiempoTotal = Date.now() - inicio;
    const ticketsPorSegundo = (ticketsCreados / tiempoTotal) * 1000;
    
    console.log(`   📊 Tickets creados: ${ticketsCreados}`);
    console.log(`   ⏱️  Tiempo total: ${tiempoTotal}ms`);
    console.log(`   🚀 Throughput: ${ticketsPorSegundo.toFixed(2)} tickets/segundo`);
    
    expect(ticketsCreados).toBeGreaterThanOrEqual(MINIMO_TICKETS);
    expect(ticketsPorSegundo).toBeGreaterThanOrEqual(50);
  }, 30000);
  
  test("Debe calcular percentiles de latencia correctamente", async () => {
    const REQUESTS = 100;
    const tiempos: number[] = [];
    
    // Ejecutar múltiples requests y medir tiempos individuales
    for (let i = 0; i < REQUESTS; i++) {
      const inicio = performance.now();
      await createTicket({
        Title: `Ticket percentil ${i}`,
        Description: `Descripción ${i}`,
        Priority: "Medium",
        categoria: "Hardware",
        usuario_nombre: "Usuario Test"
      });
      const fin = performance.now();
      tiempos.push(fin - inicio);
    }
    
    const percentiles = calcularPercentiles(tiempos);
    
    console.log(`\n   📈 Percentiles de Latencia (${REQUESTS} requests):`);
    console.log(`      P50 (mediana): ${percentiles.p50.toFixed(2)}ms`);
    console.log(`      P90: ${percentiles.p90.toFixed(2)}ms`);
    console.log(`      P95: ${percentiles.p95.toFixed(2)}ms`);
    console.log(`      P99: ${percentiles.p99.toFixed(2)}ms`);
    
    // Validaciones de SLA (Service Level Agreement)
    expect(percentiles.p50).toBeLessThan(200); // 50% debe responder en < 200ms
    expect(percentiles.p90).toBeLessThan(500); // 90% debe responder en < 500ms
    expect(percentiles.p95).toBeLessThan(800); // 95% debe responder en < 800ms
    expect(percentiles.p99).toBeLessThan(1500); // 99% debe responder en < 1.5s
  }, 60000);
});

// ========================================
// TESTS DE ESCALABILIDAD
// ========================================

describe("📈 Tests de Escalabilidad", () => {
  
  test("El tiempo de respuesta debe crecer linealmente con la carga", async () => {
    const cargas = [10, 50, 100, 200];
    const resultados: { carga: number; tiempo: number }[] = [];
    
    for (const carga of cargas) {
      // Limpiar base de datos
      const collections = mongoose.connection.collections;
      for (const key in collections) {
        await collections[key].deleteMany({});
      }
      
      // Crear tickets según la carga
      const tareas = Array.from({ length: carga }, (_, i) => {
        return async () => await createTicket({
          Title: `Ticket escala ${i}`,
          Description: `Descripción ${i}`,
          Priority: "Medium",
          categoria: "Hardware",
          usuario_nombre: "Usuario Test"
        });
      });
      
      const metricas = await ejecutarParalelo(tareas, `Carga de ${carga} tickets`);
      resultados.push({ carga, tiempo: metricas.tiempoPromedio });
    }
    
    console.log(`\n   📊 Resultados de Escalabilidad:`);
    resultados.forEach(r => {
      console.log(`      Carga ${r.carga}: ${r.tiempo.toFixed(2)}ms promedio`);
    });
    
    // Validar que el crecimiento no es exponencial
    // El tiempo promedio no debe duplicarse cuando duplicamos la carga
    for (let i = 1; i < resultados.length; i++) {
      const anterior = resultados[i - 1];
      const actual = resultados[i];
      const factorCarga = actual.carga / anterior.carga;
      const factorTiempo = actual.tiempo / anterior.tiempo;
      
      // El tiempo no debe crecer más rápido que la carga
      expect(factorTiempo).toBeLessThan(factorCarga * 1.5);
    }
  }, 120000); // Timeout de 2 minutos
});
