const mongoose = require("mongoose");
const fs = require("fs"); // Agregar fs para manejo de archivos

// 📌 Modelo Ticket (colección "tickets"
const TicketSchema = new mongoose.Schema({
  Number: { type: Number, required: true, unique: true },
  Title: { type: String, required: true },
  Description: { type: String, required: true },
  Status: {
    type: String,
    enum: ["Open", "In Progress", "Closed"],
    default: "Open",
  },
  Priority: {
    type: String,
    enum: ["Low", "Medium", "High"],
    default: "Medium",
  },
  CreatedAt: { type: Date, default: Date.now },
  UpdatedAt: { type: Date, default: Date.now },
  AssignedTo: { type: String, default: null },
  // Campos para archivos adjuntos
  archivo_path: { type: String, default: null }, // Ruta del archivo en el servidor
  archivo_nombre_original: { type: String, default: null }, // Nombre original del archivo
  archivo_nombre_servidor: { type: String, default: null }, // Nombre del archivo en el servidor
  archivo_size: { type: Number, default: null }, // Tamaño del archivo en bytes
  archivo_mimetype: { type: String, default: null }, // Tipo MIME del archivo
  categoria: { type: String, default: null }, // Categoría adicional para frontend
  usuario_nombre: { type: String, default: null }, // Nombre del usuario que creó el ticket
});

const Ticket = mongoose.model("Ticket", TicketSchema);

// 📌 Función para crear un nuevo ticket
async function createTicket(data) {
  const lastTicket = await Ticket.findOne().sort({ Number: -1 });
  const newNumber = lastTicket ? lastTicket.Number + 1 : 1;

  const ticket = new Ticket({
    Number: newNumber,
    Title: data.Title,
    Description: data.Description,
    Priority: data.Priority || "Medium", // La prioridad será asignada por trabajadores, por defecto "Medium"
    AssignedTo: data.AssignedTo || null, // Asignación opcional
    archivo_path: data.archivo_path || null,
    archivo_nombre_original: data.archivo_nombre_original || null,
    archivo_nombre_servidor: data.archivo_nombre_servidor || null,
    archivo_size: data.archivo_size || null,
    archivo_mimetype: data.archivo_mimetype || null,
    categoria: data.categoria || null,
    usuario_nombre: data.usuario_nombre || null,
  });

  return await ticket.save();
}

// 📌 Función para obtener todos los tickets
async function getAllTickets() {
  return await Ticket.find().sort({ CreatedAt: -1 }); // Ordenar por fecha más reciente
}

// 📌 Función para obtener tickets por usuario (opcional)
async function getTicketsByUser(userId) {
  return await Ticket.find({ AssignedTo: userId }).sort({ CreatedAt: -1 });
}

// 📌 Función para actualizar el estado de un ticket
async function updateTicketStatus(ticketId, newStatus) {
  return await Ticket.findByIdAndUpdate(
    ticketId,
    { Status: newStatus, UpdatedAt: Date.now() },
    { new: true }
  );
}

// 📌 Función para obtener un ticket por ID
async function getTicketById(ticketId) {
  return await Ticket.findById(ticketId);
}

// 📌 Controlador para crear ticket con archivo
async function createTicketController(req, res) {
  try {
    console.log('Datos recibidos para crear ticket:', req.body);
    console.log('Archivo recibido:', req.file);
    
    // Preparar datos del ticket
    const ticketData = {
      Title: req.body.Title,
      Description: req.body.Description,
      Priority: req.body.Priority || "Medium",
      AssignedTo: req.body.AssignedTo || null,
      categoria: req.body.categoria,
      usuario_nombre: req.body.usuario_nombre
    };
    
    // Si hay archivo, agregar la información
    if (req.file) {
      ticketData.archivo_path = req.file.path;
      ticketData.archivo_nombre_original = req.file.originalname;
      ticketData.archivo_nombre_servidor = req.file.filename;
      ticketData.archivo_size = req.file.size;
      ticketData.archivo_mimetype = req.file.mimetype;
      
      console.log(`Archivo guardado: ${req.file.originalname} -> ${req.file.filename}`);
    }
    
    const nuevoTicket = await createTicket(ticketData);
    console.log('Ticket creado exitosamente:', nuevoTicket);
    res.status(201).json(nuevoTicket);
  } catch (err) {
    console.error('Error al crear ticket:', err);
    // Si hay error y se subió un archivo, eliminarlo
    if (req.file) {
      fs.unlink(req.file.path, (unlinkErr) => {
        if (unlinkErr) console.error('Error al eliminar archivo:', unlinkErr);
      });
    }
    res.status(500).json({ message: "Error al crear ticket", error: err.message });
  }
}

module.exports = {
  createTicket,
  getAllTickets,
  getTicketsByUser,
  updateTicketStatus,
  getTicketById,
  createTicketController, // Exportar el nuevo controlador
};