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
const { registrarUsuario, iniciarSesion } = require("./server/user");
const { createTicket, getAllTickets } = require("./server/tickets"); // Importa funciones

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

// 📌 Ruta para crear un nuevo ticket con archivo (POST /tickets)
app.post("/tickets", upload.single('archivo'), async (req, res) => {
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
      ticketData.archivo_nombre_original = req.file.originalname; // Nombre original
      ticketData.archivo_nombre_servidor = req.file.filename; // Nombre en el servidor
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
});

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

app.listen(3000, () => {
  console.log("🚀 Servidor corriendo en http://localhost:3000");
});
