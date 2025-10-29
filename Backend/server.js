// ============================================================
// Backend: API de registro de usuarios para Sistema_Tickets
// ============================================================

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const multer = require("multer"); // Para manejo de archivos
const path = require("path");
const fs = require("fs");
const { registrarUsuario, iniciarSesion, obtenerUsuarios } = require("./server/user");
const { 
  getAllTickets, 
  createTicketController, 
  updateTicketController,
  getTicketsByAssignedUserController
} = require("./server/tickets");

const app = express();

app.use(cors());
app.use(bodyParser.json());

// Crear directorio para archivos si no existe
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Función para sanitizar nombres de archivo (eliminar caracteres especiales)
function sanitizeFileName(text) {
  return text
    .normalize('NFD') // Descomponer caracteres con tildes
    .replace(/[\u0300-\u036f]/g, '') // Eliminar tildes y acentos
    .replace(/[^a-zA-Z0-9\s]/g, '') // Solo letras, números y espacios
    .replace(/\s+/g, '_') // Reemplazar espacios con guiones bajos
    .substring(0, 50) // Limitar longitud
    .toLowerCase();
}

// Configuración de multer para archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/') // Carpeta donde se guardarán los archivos
  },
  filename: function (req, file, cb) {
    // Obtener datos del formulario para el nombre
    const titulo = req.body.Title || 'ticket';
    const usuario = req.body.usuario_nombre || 'usuario';
    
    // Sanitizar título y nombre de usuario
    const tituloSanitizado = sanitizeFileName(titulo);
    const usuarioSanitizado = sanitizeFileName(usuario);
    
    // Obtener extensión del archivo original
    const extension = path.extname(file.originalname);
    
    // Generar timestamp único
    const timestamp = Date.now();
    
    // Formato final: titulo-usuario-timestamp.ext
    const nombreFinal = `${tituloSanitizado}-${usuarioSanitizado}-${timestamp}${extension}`;
    
    console.log(`Archivo renombrado de "${file.originalname}" a "${nombreFinal}"`);
    cb(null, nombreFinal);
  }
});

// Filtro para tipos de archivo permitidos
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf|txt|docx|doc/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo se permiten: JPG, PNG, GIF, PDF, TXT, DOCX, DOC'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // Límite de 10MB
  },
  fileFilter: fileFilter
});

// Servir archivos estáticos desde la carpeta uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 🔗 Conexión con MongoDB Atlas
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ Conectado a MongoDB Atlas"))
  .catch((err) => console.error("❌ Error de conexión:", err));

// 📌 Ruta para registrar usuario (POST /register)
app.post("/register", async (req, res) => {
  try {
    // Llama la función de registro del módulo user.js
    const resultado = await registrarUsuario(req.body);
    if (!resultado.ok) {
      return res.status(400).json({ message: resultado.message });
    }
    res.status(201).json({ message: resultado.message });
  } catch (err) {
    res.status(500).json({ message: "Error en el servidor", error: err });
  }
});

// 📌 Ruta para iniciar sesión (POST /login)
// Body esperado: { "identifier": "usuario_o_email", "password": "..." }
app.post("/login", async (req, res) => {
  try {
    const resultado = await iniciarSesion(req.body);
    if (!resultado.ok) {
      return res.status(400).json({ message: resultado.message });
    }
    res.status(200).json({ message: resultado.message, user: resultado.user });
  } catch (err) {
    res.status(500).json({ message: "Error en el servidor", error: err });
  }
});

app.get("/users", async (req, res) => {
  try {
    const usuarios = await obtenerUsuarios();
    res.status(200).json(usuarios);
  } catch (err) {
    res.status(500).json({ message: "Error al obtener usuarios", error: err });
  }
});


// 📌 Ruta para crear un nuevo ticket con archivo (POST /tickets)
app.post("/tickets", upload.single('archivo'), createTicketController);

// 📌 Ruta para obtener todos los tickets (GET /tickets)
app.get("/tickets", async (req, res) => {
  try {
    const tickets = await getAllTickets();
    console.log(`Enviando ${tickets.length} tickets`);
    res.status(200).json(tickets);
  } catch (err) {
    console.error('Error al obtener tickets:', err);
    res.status(500).json({ message: "Error al obtener tickets", error: err.message });
  }
});

// 📌 Ruta para obtener tickets asignados a un usuario específico (GET /tickets/assigned/:userId)
app.get("/tickets/assigned/:userId", getTicketsByAssignedUserController);

// 📌 Ruta para descargar archivos con nombre original
app.get("/tickets/:ticketId/archivo", async (req, res) => {
  try {
    const { ticketId } = req.params;
    
    // Buscar el ticket para obtener información del archivo
    const { getTicketById } = require("./server/tickets");
    const ticket = await getTicketById(ticketId);
    
    if (!ticket || !ticket.archivo_path) {
      return res.status(404).json({ message: "Archivo no encontrado" });
    }
    
    // Verificar que el archivo existe en el sistema
    if (!fs.existsSync(ticket.archivo_path)) {
      return res.status(404).json({ message: "Archivo no encontrado en el servidor" });
    }
    
    // Descargar con el nombre original
    res.download(ticket.archivo_path, ticket.archivo_nombre_original);
  } catch (err) {
    console.error('Error al descargar archivo:', err);
    res.status(500).json({ message: "Error al descargar archivo" });
  }
});

// 📌 Ruta para actualizar ticket completo (PUT /tickets/:id)
app.put("/tickets/:id", updateTicketController);

// 📌 Ruta para agregar comentario a un ticket (POST /tickets/:id/comentarios)
app.post("/tickets/:id/comentarios", async (req, res) => {
  try {
    const ticketNumber = parseInt(req.params.id);
    const { texto, usuario_id, usuario_nombre } = req.body;
    
    console.log(`Agregando comentario al ticket #${ticketNumber}`);
    console.log('Datos del comentario:', { texto, usuario_id, usuario_nombre });
    
    if (isNaN(ticketNumber)) {
      return res.status(400).json({ 
        message: "ID de ticket inválido", 
        receivedId: req.params.id 
      });
    }
    
    if (!texto || !texto.trim()) {
      return res.status(400).json({ message: "El texto del comentario es requerido" });
    }
    
    // Buscar ticket por Number
    const { Ticket } = require("./server/tickets");
    const ticket = await Ticket.findOne({ Number: ticketNumber });
    
    if (!ticket) {
      return res.status(404).json({ 
        message: `Ticket #${ticketNumber} no encontrado` 
      });
    }
    
    // Crear nuevo comentario
    const nuevoComentario = {
      texto: texto.trim(),
      fecha: new Date(),
      usuario: usuario_nombre || 'Usuario desconocido',
      usuario_id: usuario_id || null
    };
    
    // Agregar comentario al array
    if (!ticket.comentarios) {
      ticket.comentarios = [];
    }
    ticket.comentarios.push(nuevoComentario);
    ticket.UpdatedAt = Date.now();
    
    await ticket.save();
    
    console.log(`✅ Comentario agregado exitosamente al ticket #${ticketNumber}`);
    
    res.status(201).json({
      message: "Comentario agregado exitosamente",
      comentario: nuevoComentario,
      ticket: ticket
    });
    
  } catch (error) {
    console.error('Error al agregar comentario:', error);
    res.status(500).json({ 
      message: "Error al agregar comentario", 
      error: error.message 
    });
  }
});

// 📌 Ruta para obtener comentarios de un ticket (GET /tickets/:id/comentarios)
app.get("/tickets/:id/comentarios", async (req, res) => {
  try {
    const ticketNumber = parseInt(req.params.id);
    
    if (isNaN(ticketNumber)) {
      return res.status(400).json({ 
        message: "ID de ticket inválido" 
      });
    }
    
    const { Ticket } = require("./server/tickets");
    const ticket = await Ticket.findOne({ Number: ticketNumber });
    
    if (!ticket) {
      return res.status(404).json({ 
        message: `Ticket #${ticketNumber} no encontrado` 
      });
    }
    
    res.status(200).json({
      ticketNumber: ticket.Number,
      comentarios: ticket.comentarios || []
    });
    
  } catch (error) {
    console.error('Error al obtener comentarios:', error);
    res.status(500).json({ 
      message: "Error al obtener comentarios", 
      error: error.message 
    });
  }
});

// 📌 Ruta de debug para listar tickets disponibles (GET /tickets/debug/list)
app.get("/tickets/debug/list", async (req, res) => {
  try {
    const tickets = await getAllTickets();
    const ticketList = tickets.map(ticket => ({
      Number: ticket.Number,
      Title: ticket.Title,
      Status: ticket.Status,
      Priority: ticket.Priority,
      CreatedAt: ticket.CreatedAt,
      usuario_nombre: ticket.usuario_nombre
    }));
    
    res.status(200).json({
      message: `Se encontraron ${tickets.length} tickets en la base de datos`,
      tickets: ticketList
    });
  } catch (err) {
    console.error('Error al obtener lista de tickets:', err);
    res.status(500).json({ message: "Error al obtener lista de tickets", error: err.message });
  }
});

// 📌 Ruta de debug para limpiar tickets (DELETE /tickets/debug/clear) - SOLO PARA DESARROLLO
app.delete("/tickets/debug/clear", async (req, res) => {
  try {
    const { Ticket } = require("./server/tickets");
    await Ticket.deleteMany({});
    
    res.status(200).json({
      message: "Todos los tickets han sido eliminados de la base de datos"
    });
  } catch (err) {
    console.error('Error al limpiar tickets:', err);
    res.status(500).json({ message: "Error al limpiar tickets", error: err.message });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Backend corriendo en http://localhost:${PORT}`);
});
