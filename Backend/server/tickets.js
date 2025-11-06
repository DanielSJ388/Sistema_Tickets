const mongoose = require("mongoose");
const fs = require("fs"); // Agregar fs para manejo de archivos

// 📌 Esquema para comentarios dentro del ticket con soporte para archivos
const ComentarioSchema = new mongoose.Schema({
  texto: { type: String, required: true },
  fecha: { type: Date, default: Date.now },
  usuario: { type: String, required: true },
  usuario_id: { type: String, default: null },
  // Campos para archivos adjuntos en comentarios
  archivo_path: { type: String, default: null },
  archivo_nombre_original: { type: String, default: null },
  archivo_nombre_servidor: { type: String, default: null },
  archivo_size: { type: Number, default: null },
  archivo_mimetype: { type: String, default: null },
  es_imagen: { type: Boolean, default: false }
});

// 📌 Modelo Ticket actualizado con comentarios
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
  // Campos para archivos adjuntos
  archivo_path: { type: String, default: null },
  archivo_nombre_original: { type: String, default: null },
  archivo_nombre_servidor: { type: String, default: null },
  archivo_size: { type: Number, default: null },
  archivo_mimetype: { type: String, default: null },
  categoria: { type: String, default: null },
  usuario_nombre: { type: String, default: null },
  // Array de comentarios
  comentarios: [ComentarioSchema]
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

// 📌 Función para obtener tickets asignados a un usuario específico
async function getTicketsByAssignedUser(userId) {
  try {
    console.log(`🔍 Buscando tickets asignados a usuario: ${userId}`);
    
    // Buscar tickets donde AssignedTo coincida con el userId
    const tickets = await Ticket.find({ 
      AssignedTo: userId 
    }).sort({ CreatedAt: -1 });
    
    console.log(`✅ Se encontraron ${tickets.length} tickets asignados al usuario`);
    return tickets;
    
  } catch (error) {
    console.error('❌ Error al obtener tickets por usuario:', error);
    throw error;
  }
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

// 📌 Función para actualizar ticket completo (prioridad, estado, asignación, comentarios)
async function updateTicket(ticketNumber, updateData) {
  try {
    console.log('Actualizando ticket:', ticketNumber, 'con datos:', updateData);
    
    // Buscar ticket por Number (no por _id)
    const ticket = await Ticket.findOne({ Number: ticketNumber });
    
    if (!ticket) {
      // Listar tickets disponibles para debug
      const ticketsDisponibles = await Ticket.find({}, 'Number Title').limit(10);
      console.log('Tickets disponibles:', ticketsDisponibles.map(t => `#${t.Number}: ${t.Title}`));
      throw new Error(`Ticket #${ticketNumber} no encontrado`);
    }
    
    // Preparar datos de actualización
    const updateFields = {
      UpdatedAt: Date.now()
    };
    
    // Actualizar campos si están presentes
    if (updateData.Priority) {
      updateFields.Priority = updateData.Priority;
    }
    
    if (updateData.Status) {
      updateFields.Status = updateData.Status;
    }
    
    if (updateData.AssignedTo !== undefined) {
      updateFields.AssignedTo = updateData.AssignedTo;
    }
    
    // Agregar comentario si existe
    if (updateData.comentario && updateData.comentario.trim()) {
      const nuevoComentario = {
        texto: updateData.comentario.trim(),
        fecha: new Date(),
        usuario: updateData.usuario_comentario || 'Usuario desconocido',
        usuario_id: updateData.usuario_id || null
      };
      
      // Agregar comentario al array
      if (!ticket.comentarios) {
        ticket.comentarios = [];
      }
      ticket.comentarios.push(nuevoComentario);
    }
    
    // Aplicar actualizaciones
    Object.assign(ticket, updateFields);
    
    const ticketActualizado = await ticket.save();
    console.log('Ticket actualizado exitosamente:', ticketActualizado);
    
    return ticketActualizado;
    
  } catch (error) {
    console.error('Error en updateTicket:', error);
    throw error;
  }
}

// 📌 Controlador para actualizar ticket
async function updateTicketController(req, res) {
  try {
    const ticketNumber = parseInt(req.params.id);
    const updateData = req.body;
    
    console.log(`Recibida petición para actualizar ticket #${ticketNumber}`);
    console.log('Datos de actualización:', updateData);
    
    if (isNaN(ticketNumber)) {
      return res.status(400).json({ 
        message: "ID de ticket inválido", 
        receivedId: req.params.id 
      });
    }
    
    const ticketActualizado = await updateTicket(ticketNumber, updateData);
    
    res.status(200).json({
      message: "Ticket actualizado exitosamente",
      ticket: ticketActualizado
    });
    
  } catch (error) {
    console.error('Error al actualizar ticket:', error);
    
    if (error.message.includes('no encontrado')) {
      // Obtener lista de tickets disponibles para el error
      try {
        const ticketsDisponibles = await Ticket.find({}, 'Number Title').limit(5);
        res.status(404).json({ 
          message: error.message,
          ticketsDisponibles: ticketsDisponibles.map(t => ({ number: t.Number, title: t.Title }))
        });
      } catch (listError) {
        res.status(404).json({ message: error.message });
      }
    } else {
      res.status(500).json({ 
        message: "Error interno al actualizar ticket", 
        error: error.message 
      });
    }
  }
}

// 📌 Controlador para obtener tickets por usuario asignado
async function getTicketsByAssignedUserController(req, res) {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ 
        message: "ID de usuario requerido" 
      });
    }
    
    console.log(`Obteniendo tickets para usuario: ${userId}`);
    
    const tickets = await getTicketsByAssignedUser(userId);
    
    res.status(200).json({
      message: `Se encontraron ${tickets.length} tickets asignados`,
      tickets: tickets
    });
    
  } catch (error) {
    console.error('Error al obtener tickets por usuario:', error);
    res.status(500).json({ 
      message: "Error al obtener tickets", 
      error: error.message 
    });
  }
}

module.exports = {
  createTicket,
  getAllTickets,
  getTicketsByUser,
  updateTicketStatus,
  getTicketById,
  createTicketController,
  updateTicket,
  updateTicketController,
  getTicketsByAssignedUser,
  getTicketsByAssignedUserController,
  Ticket 
};