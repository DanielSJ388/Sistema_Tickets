// ============================================================
// Script para generar 6000 tickets de prueba en MongoDB
// ============================================================

import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import mongoose from "mongoose";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, "../../.env") });

// Importar el modelo Ticket directamente
const TicketSchema = new mongoose.Schema({
  Number: { type: Number, required: true, unique: true },
  Title: { type: String, required: true },
  Description: { type: String, required: true },
  Status: {
    type: String,
    enum: ["Open", "In Progress", "Closed", "open", "in-progress", "resolved", "closed"],
    default: "Open",
  },
  Priority: {
    type: String,
    enum: ["Low", "Medium", "High", "low", "medium", "high"],
    default: "Medium",
  },
  CreatedAt: { type: Date, default: Date.now },
  UpdatedAt: { type: Date, default: Date.now },
  AssignedTo: { type: String, default: null },
  archivo_path: { type: String, default: null },
  archivo_nombre_original: { type: String, default: null },
  archivo_nombre_servidor: { type: String, default: null },
  archivo_size: { type: Number, default: null },
  archivo_mimetype: { type: String, default: null },
  categoria: { type: String, default: null },
  usuario_nombre: { type: String, default: null },
  comentarios: { type: Array, default: [] }
});

const Ticket = mongoose.model("Ticket", TicketSchema);

// Datos de ejemplo para generar tickets variados
const CATEGORIAS = [
  "Soporte Técnico",
  "Hardware",
  "Software",
  "Red",
  "Impresoras",
  "Accesos",
  "Correo electrónico",
  "Teléfono",
  "Aplicaciones",
  "Base de datos"
];

const TITULOS_BASE = [
  "Problema con",
  "Error en",
  "Falla de",
  "No funciona",
  "Solicitud de",
  "Consulta sobre",
  "Ayuda con",
  "Configuración de",
  "Instalación de",
  "Actualización de"
];

const DESCRIPCIONES_BASE = [
  "Se requiere atención inmediata para resolver el problema reportado.",
  "El usuario reporta dificultades al utilizar el sistema.",
  "Se necesita asistencia técnica para continuar con las operaciones normales.",
  "El equipo presenta comportamiento anormal y requiere revisión.",
  "Se solicita soporte para completar la tarea asignada.",
  "Hay inconvenientes que impiden el trabajo normal del usuario.",
  "Se reportan errores recurrentes que necesitan ser corregidos.",
  "El sistema no responde como se esperaba según las especificaciones.",
  "Se necesita configurar o instalar el recurso solicitado.",
  "El usuario requiere capacitación o asistencia para usar la herramienta."
];

const PRIORIDADES = ["Low", "Medium", "High"];
const ESTADOS = ["Open", "In Progress", "Closed"];

// Función para generar un ticket aleatorio
function generarTicketAleatorio(numero, usuarioNombre = "Usuario de Prueba") {
  const categoria = CATEGORIAS[Math.floor(Math.random() * CATEGORIAS.length)];
  const tituloBase = TITULOS_BASE[Math.floor(Math.random() * TITULOS_BASE.length)];
  const descripcionBase = DESCRIPCIONES_BASE[Math.floor(Math.random() * DESCRIPCIONES_BASE.length)];
  const prioridad = PRIORIDADES[Math.floor(Math.random() * PRIORIDADES.length)];
  const estado = ESTADOS[Math.floor(Math.random() * ESTADOS.length)];
  
  // Generar fechas aleatorias en los últimos 90 días
  const diasAtras = Math.floor(Math.random() * 90);
  const fechaCreacion = new Date();
  fechaCreacion.setDate(fechaCreacion.getDate() - diasAtras);
  
  return {
    Number: numero,
    Title: `${tituloBase} ${categoria} #${numero}`,
    Description: `${descripcionBase} Ticket generado automáticamente para pruebas del sistema. ID: ${numero}, Categoría: ${categoria}.`,
    Status: estado,
    Priority: prioridad,
    CreatedAt: fechaCreacion,
    UpdatedAt: fechaCreacion,
    AssignedTo: Math.random() > 0.3 ? null : `user_${Math.floor(Math.random() * 10) + 1}`, // 70% sin asignar
    archivo_path: null,
    archivo_nombre_original: null,
    archivo_nombre_servidor: null,
    archivo_size: null,
    archivo_mimetype: null,
    categoria: categoria,
    usuario_nombre: usuarioNombre,
    comentarios: []
  };
}

// Función principal para generar los tickets
async function generarTickets(cantidad = 6000, batchSize = 100) {
  try {
    console.log("🔗 Conectando a MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Conectado a MongoDB Atlas");
    
    // Obtener el último número de ticket existente
    const ultimoTicket = await Ticket.findOne().sort({ Number: -1 });
    const numeroInicial = ultimoTicket ? ultimoTicket.Number + 1 : 1;
    
    console.log(`📊 Último ticket en DB: #${ultimoTicket ? ultimoTicket.Number : 0}`);
    console.log(`🎯 Generando ${cantidad} tickets desde el número ${numeroInicial}...`);
    console.log(`📦 Procesando en lotes de ${batchSize} tickets\n`);
    
    let ticketsCreados = 0;
    const totalBatches = Math.ceil(cantidad / batchSize);
    
    // Procesar en lotes para evitar sobrecarga de memoria
    for (let batch = 0; batch < totalBatches; batch++) {
      const tickets = [];
      const inicio = batch * batchSize;
      const fin = Math.min(inicio + batchSize, cantidad);
      
      // Generar tickets del lote actual
      for (let i = inicio; i < fin; i++) {
        const numeroTicket = numeroInicial + i;
        tickets.push(generarTicketAleatorio(numeroTicket));
      }
      
      // Insertar lote en la base de datos
      await Ticket.insertMany(tickets, { ordered: false });
      
      ticketsCreados += tickets.length;
      const progreso = ((ticketsCreados / cantidad) * 100).toFixed(1);
      
      console.log(`✅ Lote ${batch + 1}/${totalBatches} completado | Tickets: ${ticketsCreados}/${cantidad} (${progreso}%)`);
    }
    
    console.log(`\n🎉 ¡Proceso completado exitosamente!`);
    console.log(`📊 Total de tickets generados: ${ticketsCreados}`);
    console.log(`🔢 Rango de números: #${numeroInicial} a #${numeroInicial + ticketsCreados - 1}`);
    
    // Mostrar estadísticas
    const stats = await Ticket.aggregate([
      {
        $group: {
          _id: "$Status",
          count: { $sum: 1 }
        }
      }
    ]);
    
    console.log(`\n📈 Estadísticas por estado:`);
    stats.forEach(stat => {
      console.log(`   - ${stat._id}: ${stat.count} tickets`);
    });
    
  } catch (error) {
    console.error("❌ Error al generar tickets:", error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log("\n🔌 Conexión a MongoDB cerrada");
  }
}

// Ejecutar el script
const cantidadTickets = process.argv[2] ? parseInt(process.argv[2]) : 6000;
const batchSize = process.argv[3] ? parseInt(process.argv[3]) : 100;

if (isNaN(cantidadTickets) || cantidadTickets <= 0) {
  console.error("❌ La cantidad de tickets debe ser un número positivo");
  process.exit(1);
}

console.log("╔════════════════════════════════════════════════╗");
console.log("║   Generador de Tickets - Sistema de Tickets   ║");
console.log("╚════════════════════════════════════════════════╝\n");

generarTickets(cantidadTickets, batchSize)
  .then(() => {
    console.log("\n✨ Script finalizado correctamente\n");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Error fatal:", error);
    process.exit(1);
  });
