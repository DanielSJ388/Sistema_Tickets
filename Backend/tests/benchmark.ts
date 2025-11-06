/**
 * ============================================================
 * BENCHMARK - Sistema de Tickets
 * ============================================================
 * 
 * Script de benchmarking para medir el rendimiento del sistema
 * Uso: bun run Backend/tests/benchmark.ts
 */

const BASE_URL = process.env.API_URL || "http://localhost:5000";

// ========================================
// COLORES PARA TERMINAL
// ========================================

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  red: "\x1b[31m",
  magenta: "\x1b[35m"
};

function log(message: string, color: keyof typeof colors = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// ========================================
// FUNCIONES DE BENCHMARK
// ========================================

interface BenchmarkResult {
  nombre: string;
  tiempoTotal: number;
  tiempoPromedio: number;
  tiempoMin: number;
  tiempoMax: number;
  throughput: number;
  exitosos: number;
  fallidos: number;
  percentiles: {
    p50: number;
    p90: number;
    p95: number;
    p99: number;
  };
}

async function medirOperacion<T>(
  operacion: () => Promise<T>
): Promise<{ resultado: T; tiempo: number }> {
  const inicio = performance.now();
  const resultado = await operacion();
  const tiempo = performance.now() - inicio;
  return { resultado, tiempo };
}

function calcularPercentiles(tiempos: number[]) {
  const sorted = [...tiempos].sort((a, b) => a - b);
  return {
    p50: sorted[Math.floor(sorted.length * 0.50)],
    p90: sorted[Math.floor(sorted.length * 0.90)],
    p95: sorted[Math.floor(sorted.length * 0.95)],
    p99: sorted[Math.floor(sorted.length * 0.99)]
  };
}

async function ejecutarBenchmark(
  nombre: string,
  operacion: () => Promise<any>,
  cantidad: number,
  concurrencia: number = 10
): Promise<BenchmarkResult> {
  log(`\n🔄 Ejecutando: ${nombre}`, "cyan");
  log(`   Cantidad: ${cantidad} | Concurrencia: ${concurrencia}`, "blue");
  
  const tiempos: number[] = [];
  let exitosos = 0;
  let fallidos = 0;
  
  const inicioTotal = performance.now();
  
  // Ejecutar en lotes según la concurrencia
  const lotes = Math.ceil(cantidad / concurrencia);
  
  for (let i = 0; i < lotes; i++) {
    const tareasEnLote = Math.min(concurrencia, cantidad - (i * concurrencia));
    
    const promesas = Array.from({ length: tareasEnLote }, async () => {
      try {
        const { tiempo } = await medirOperacion(operacion);
        tiempos.push(tiempo);
        exitosos++;
        return true;
      } catch (error) {
        fallidos++;
        return false;
      }
    });
    
    await Promise.all(promesas);
    
    // Mostrar progreso
    const progreso = ((exitosos + fallidos) / cantidad * 100).toFixed(1);
    process.stdout.write(`\r   Progreso: ${progreso}%`);
  }
  
  const tiempoTotal = performance.now() - inicioTotal;
  console.log(""); // Nueva línea después del progreso
  
  const tiempoPromedio = tiempos.reduce((a, b) => a + b, 0) / tiempos.length;
  const tiempoMin = Math.min(...tiempos);
  const tiempoMax = Math.max(...tiempos);
  const throughput = (cantidad / tiempoTotal) * 1000;
  const percentiles = calcularPercentiles(tiempos);
  
  return {
    nombre,
    tiempoTotal,
    tiempoPromedio,
    tiempoMin,
    tiempoMax,
    throughput,
    exitosos,
    fallidos,
    percentiles
  };
}

function mostrarResultado(resultado: BenchmarkResult) {
  log(`\n📊 Resultados: ${resultado.nombre}`, "bright");
  log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, "blue");
  
  // Tiempos
  log(`   ⏱️  Tiempo Total:    ${resultado.tiempoTotal.toFixed(2)}ms`, "cyan");
  log(`   📈 Tiempo Promedio: ${resultado.tiempoPromedio.toFixed(2)}ms`, "cyan");
  log(`   ⚡ Tiempo Mínimo:   ${resultado.tiempoMin.toFixed(2)}ms`, "green");
  log(`   🔥 Tiempo Máximo:   ${resultado.tiempoMax.toFixed(2)}ms`, "yellow");
  
  // Throughput
  log(`   🚀 Throughput:      ${resultado.throughput.toFixed(2)} ops/seg`, "magenta");
  
  // Resultados
  const tasaExito = (resultado.exitosos / (resultado.exitosos + resultado.fallidos) * 100).toFixed(2);
  log(`   ✅ Exitosos:        ${resultado.exitosos} (${tasaExito}%)`, "green");
  if (resultado.fallidos > 0) {
    log(`   ❌ Fallidos:        ${resultado.fallidos}`, "red");
  }
  
  // Percentiles
  log(`\n   📊 Percentiles de Latencia:`, "bright");
  log(`      P50: ${resultado.percentiles.p50.toFixed(2)}ms`, "cyan");
  log(`      P90: ${resultado.percentiles.p90.toFixed(2)}ms`, "cyan");
  log(`      P95: ${resultado.percentiles.p95.toFixed(2)}ms`, "yellow");
  log(`      P99: ${resultado.percentiles.p99.toFixed(2)}ms`, "red");
}

// ========================================
// OPERACIONES A TESTEAR
// ========================================

async function obtenerTickets() {
  const response = await fetch(`${BASE_URL}/tickets`);
  if (!response.ok) throw new Error("Error al obtener tickets");
  return await response.json();
}

async function crearTicket(index: number) {
  const response = await fetch(`${BASE_URL}/tickets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      Title: `Benchmark Ticket ${index}`,
      Description: `Ticket de prueba de rendimiento ${index}`,
      Priority: ["Low", "Medium", "High"][index % 3],
      categoria: "Benchmark Test",
      usuario_nombre: "Benchmark User"
    })
  });
  if (!response.ok) throw new Error("Error al crear ticket");
  return await response.json();
}

async function obtenerUsuarios() {
  const response = await fetch(`${BASE_URL}/users`);
  if (!response.ok) throw new Error("Error al obtener usuarios");
  return await response.json();
}

// ========================================
// SUITE DE BENCHMARKS
// ========================================

async function ejecutarSuiteBenchmarks() {
  log("\n╔════════════════════════════════════════════════╗", "bright");
  log("║        BENCHMARK - SISTEMA DE TICKETS         ║", "bright");
  log("╚════════════════════════════════════════════════╝", "bright");
  
  log(`\n🔗 API URL: ${BASE_URL}`, "blue");
  log(`⏰ Fecha: ${new Date().toLocaleString()}`, "blue");
  
  // Verificar que el servidor esté corriendo
  try {
    await fetch(`${BASE_URL}/tickets`);
    log(`✅ Servidor conectado correctamente\n`, "green");
  } catch (error) {
    log(`\n❌ Error: No se puede conectar al servidor en ${BASE_URL}`, "red");
    log(`   Asegúrate de ejecutar: bun run dev:backend\n`, "yellow");
    process.exit(1);
  }
  
  const resultados: BenchmarkResult[] = [];
  
  // BENCHMARK 1: Consulta de tickets (lectura)
  const bench1 = await ejecutarBenchmark(
    "Consulta de Tickets (GET /tickets)",
    () => obtenerTickets(),
    200,
    20
  );
  mostrarResultado(bench1);
  resultados.push(bench1);
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // BENCHMARK 2: Creación de tickets (escritura)
  let ticketIndex = 0;
  const bench2 = await ejecutarBenchmark(
    "Creación de Tickets (POST /tickets)",
    () => crearTicket(ticketIndex++),
    100,
    10
  );
  mostrarResultado(bench2);
  resultados.push(bench2);
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // BENCHMARK 3: Consulta de usuarios
  const bench3 = await ejecutarBenchmark(
    "Consulta de Usuarios (GET /users)",
    () => obtenerUsuarios(),
    150,
    15
  );
  mostrarResultado(bench3);
  resultados.push(bench3);
  
  // RESUMEN FINAL
  log("\n\n╔════════════════════════════════════════════════╗", "bright");
  log("║              RESUMEN DE RESULTADOS             ║", "bright");
  log("╚════════════════════════════════════════════════╝", "bright");
  
  log("\n📊 Comparación de Throughput:", "cyan");
  resultados.forEach(r => {
    log(`   ${r.nombre.padEnd(45)} ${r.throughput.toFixed(2).padStart(10)} ops/seg`, "blue");
  });
  
  log("\n⏱️  Comparación de Latencia (P95):", "cyan");
  resultados.forEach(r => {
    log(`   ${r.nombre.padEnd(45)} ${r.percentiles.p95.toFixed(2).padStart(10)} ms`, "blue");
  });
  
  log("\n✅ Tasa de Éxito:", "cyan");
  resultados.forEach(r => {
    const tasaExito = (r.exitosos / (r.exitosos + r.fallidos) * 100).toFixed(2);
    const color = parseFloat(tasaExito) === 100 ? "green" : "yellow";
    log(`   ${r.nombre.padEnd(45)} ${tasaExito.padStart(10)}%`, color);
  });
  
  // Evaluación general
  log("\n\n📋 Evaluación de Rendimiento:", "bright");
  
  const throughputPromedio = resultados.reduce((sum, r) => sum + r.throughput, 0) / resultados.length;
  const latenciaP95Promedio = resultados.reduce((sum, r) => sum + r.percentiles.p95, 0) / resultados.length;
  
  if (throughputPromedio > 100) {
    log("   🟢 Throughput: Excelente (>100 ops/seg)", "green");
  } else if (throughputPromedio > 50) {
    log("   🟡 Throughput: Bueno (50-100 ops/seg)", "yellow");
  } else {
    log("   🔴 Throughput: Necesita optimización (<50 ops/seg)", "red");
  }
  
  if (latenciaP95Promedio < 500) {
    log("   🟢 Latencia: Excelente (<500ms P95)", "green");
  } else if (latenciaP95Promedio < 1000) {
    log("   🟡 Latencia: Aceptable (500-1000ms P95)", "yellow");
  } else {
    log("   🔴 Latencia: Alta (>1000ms P95)", "red");
  }
  
  const tasaExitoTotal = resultados.reduce((sum, r) => 
    sum + (r.exitosos / (r.exitosos + r.fallidos)), 0
  ) / resultados.length * 100;
  
  if (tasaExitoTotal === 100) {
    log("   🟢 Estabilidad: Perfecta (100% éxito)", "green");
  } else if (tasaExitoTotal > 95) {
    log("   🟡 Estabilidad: Buena (>95% éxito)", "yellow");
  } else {
    log("   🔴 Estabilidad: Necesita atención (<95% éxito)", "red");
  }
  
  log("\n✨ Benchmark completado\n", "bright");
}

// Ejecutar benchmarks
ejecutarSuiteBenchmarks().catch(error => {
  log(`\n❌ Error fatal en benchmark: ${error.message}`, "red");
  console.error(error);
  process.exit(1);
});
