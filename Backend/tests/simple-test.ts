/**
 * ============================================================
 * TEST SIMPLE DE RENDIMIENTO - Sistema de Tickets
 * ============================================================
 * 
 * Test básico y rápido para verificar el rendimiento del sistema
 * Uso: bun run Backend/tests/simple-test.ts
 */

const BASE_URL = "http://localhost:5000";

// Colores para terminal
const c = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  red: "\x1b[31m"
};

console.log(`\n${c.blue}╔════════════════════════════════════════════════╗${c.reset}`);
console.log(`${c.blue}║     Test Simple de Rendimiento - Tickets      ║${c.reset}`);
console.log(`${c.blue}╚════════════════════════════════════════════════╝${c.reset}\n`);

async function testConexion() {
  console.log(`${c.yellow}🔗 Verificando conexión al servidor...${c.reset}`);
  try {
    const response = await fetch(`${BASE_URL}/tickets`);
    if (response.ok) {
      console.log(`${c.green}✅ Servidor conectado: ${BASE_URL}${c.reset}\n`);
      return true;
    }
  } catch (error) {
    console.log(`${c.red}❌ Error: No se puede conectar al servidor${c.reset}`);
    console.log(`${c.yellow}   Ejecuta: bun run dev:backend${c.reset}\n`);
    return false;
  }
  return false;
}

async function testLatencia() {
  console.log(`${c.blue}⏱️  Test de Latencia${c.reset}`);
  console.log(`${c.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}`);
  
  const tiempos: number[] = [];
  
  for (let i = 0; i < 10; i++) {
    const inicio = performance.now();
    await fetch(`${BASE_URL}/tickets`);
    const tiempo = performance.now() - inicio;
    tiempos.push(tiempo);
    process.stdout.write(`   Request ${i + 1}/10: ${tiempo.toFixed(2)}ms\r`);
  }
  
  console.log(""); // Nueva línea
  
  const promedio = tiempos.reduce((a, b) => a + b, 0) / tiempos.length;
  const min = Math.min(...tiempos);
  const max = Math.max(...tiempos);
  
  console.log(`\n   Promedio: ${promedio.toFixed(2)}ms`);
  console.log(`   Mínimo:   ${min.toFixed(2)}ms`);
  console.log(`   Máximo:   ${max.toFixed(2)}ms`);
  
  if (promedio < 100) {
    console.log(`   ${c.green}🟢 Excelente latencia${c.reset}\n`);
  } else if (promedio < 300) {
    console.log(`   ${c.yellow}🟡 Latencia aceptable${c.reset}\n`);
  } else {
    console.log(`   ${c.red}🔴 Latencia alta${c.reset}\n`);
  }
}

async function testCargaSimultanea() {
  console.log(`${c.blue}🔄 Test de Carga Simultánea (50 requests)${c.reset}`);
  console.log(`${c.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}`);
  
  const inicio = performance.now();
  
  const promesas = Array.from({ length: 50 }, () => 
    fetch(`${BASE_URL}/tickets`)
  );
  
  const resultados = await Promise.all(promesas);
  const tiempoTotal = performance.now() - inicio;
  
  const exitosos = resultados.filter(r => r.ok).length;
  const throughput = (50 / tiempoTotal) * 1000;
  
  console.log(`\n   Tiempo total: ${tiempoTotal.toFixed(2)}ms`);
  console.log(`   Exitosos: ${exitosos}/50`);
  console.log(`   Throughput: ${throughput.toFixed(2)} req/seg`);
  
  if (exitosos === 50 && throughput > 20) {
    console.log(`   ${c.green}🟢 Sistema estable bajo carga${c.reset}\n`);
  } else {
    console.log(`   ${c.yellow}🟡 Rendimiento moderado${c.reset}\n`);
  }
}

async function testBD() {
  console.log(`${c.blue}📊 Test de Consulta de Base de Datos${c.reset}`);
  console.log(`${c.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}`);
  
  const inicio = performance.now();
  const response = await fetch(`${BASE_URL}/tickets`);
  const datos = await response.json();
  const tiempo = performance.now() - inicio;
  
  console.log(`\n   Tickets en BD: ${datos.length}`);
  console.log(`   Tiempo de consulta: ${tiempo.toFixed(2)}ms`);
  
  if (tiempo < 200) {
    console.log(`   ${c.green}🟢 Consulta rápida${c.reset}\n`);
  } else if (tiempo < 500) {
    console.log(`   ${c.yellow}🟡 Consulta normal${c.reset}\n`);
  } else {
    console.log(`   ${c.red}🔴 Consulta lenta${c.reset}\n`);
  }
}

async function testUsuarios() {
  console.log(`${c.blue}👥 Test de Consulta de Usuarios${c.reset}`);
  console.log(`${c.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}`);
  
  const tiempos: number[] = [];
  
  for (let i = 0; i < 5; i++) {
    const inicio = performance.now();
    await fetch(`${BASE_URL}/users`);
    const tiempo = performance.now() - inicio;
    tiempos.push(tiempo);
  }
  
  const promedio = tiempos.reduce((a, b) => a + b, 0) / tiempos.length;
  
  console.log(`\n   Tiempo promedio: ${promedio.toFixed(2)}ms (5 muestras)`);
  
  if (promedio < 150) {
    console.log(`   ${c.green}🟢 Consulta eficiente${c.reset}\n`);
  } else {
    console.log(`   ${c.yellow}🟡 Consulta normal${c.reset}\n`);
  }
}

async function testResistencia() {
  console.log(`${c.blue}💪 Test de Resistencia (3 segundos)${c.reset}`);
  console.log(`${c.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}`);
  
  let requests = 0;
  let exitosos = 0;
  const inicio = Date.now();
  
  while (Date.now() - inicio < 3000) {
    const promesas = Array.from({ length: 5 }, () => fetch(`${BASE_URL}/tickets`));
    const resultados = await Promise.all(promesas);
    requests += 5;
    exitosos += resultados.filter(r => r.ok).length;
  }
  
  const tiempo = Date.now() - inicio;
  const throughput = (requests / tiempo) * 1000;
  const tasaExito = (exitosos / requests) * 100;
  
  console.log(`\n   Requests enviados: ${requests}`);
  console.log(`   Exitosos: ${exitosos} (${tasaExito.toFixed(1)}%)`);
  console.log(`   Throughput: ${throughput.toFixed(2)} req/seg`);
  
  if (tasaExito === 100 && throughput > 30) {
    console.log(`   ${c.green}🟢 Sistema resistente${c.reset}\n`);
  } else if (tasaExito > 90) {
    console.log(`   ${c.yellow}🟡 Sistema estable${c.reset}\n`);
  } else {
    console.log(`   ${c.red}🔴 Sistema con problemas bajo carga${c.reset}\n`);
  }
}

// Ejecutar todos los tests
async function ejecutarTests() {
  const conectado = await testConexion();
  
  if (!conectado) {
    process.exit(1);
  }
  
  await testLatencia();
  await new Promise(resolve => setTimeout(resolve, 500));
  
  await testCargaSimultanea();
  await new Promise(resolve => setTimeout(resolve, 500));
  
  await testBD();
  await new Promise(resolve => setTimeout(resolve, 500));
  
  await testUsuarios();
  await new Promise(resolve => setTimeout(resolve, 500));
  
  await testResistencia();
  
  console.log(`${c.green}✨ Tests completados${c.reset}\n`);
}

ejecutarTests().catch(error => {
  console.log(`${c.red}❌ Error: ${error.message}${c.reset}\n`);
  process.exit(1);
});
