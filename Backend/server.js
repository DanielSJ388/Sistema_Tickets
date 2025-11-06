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
const { registrarUsuario, iniciarSesion, obtenerUsuarios, cambiarPassword, cambiarRolUsuario, desactivarUsuario, actualizarUsuario } = require("./server/user");
const { 
  getAllTickets, 
  createTicketController, 
  updateTicketController,
  getTicketsByAssignedUserController
} = require("./server/tickets");

const app = express();

app.use(cors());
app.use(bodyParser.json());

// Crear directorio para archivos si no existe CON PERMISOS
const uploadsDir = path.join(__dirname, 'uploads');
console.log('📁 Directorio de uploads:', uploadsDir);

if (!fs.existsSync(uploadsDir)) {
  try {
    fs.mkdirSync(uploadsDir, { recursive: true, mode: 0o755 });
    console.log('✅ Directorio uploads creado:', uploadsDir);
  } catch (error) {
    console.error('❌ Error al crear directorio uploads:', error);
    process.exit(1); // Salir si no se puede crear el directorio
  }
} else {
  console.log('✅ Directorio uploads ya existe:', uploadsDir);
}

// Verificar permisos de escritura
try {
  fs.accessSync(uploadsDir, fs.constants.W_OK);
  console.log('✅ Permisos de escritura en uploads verificados');
} catch (error) {
  console.error('❌ No hay permisos de escritura en uploads:', error);
  console.error('💡 Ejecuta: chmod 755', uploadsDir);
  process.exit(1);
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
    // Usar ruta absoluta
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Obtener datos del formulario para el nombre
    const titulo = req.body.Title || req.body.texto || 'archivo';
    const usuario = req.body.usuario_nombre || 'usuario';
    
    // Sanitizar título y nombre de usuario
    const tituloSanitizado = sanitizeFileName(titulo);
    const usuarioSanitizado = sanitizeFileName(usuario);
    
    // Obtener extensión del archivo original
    const extension = path.extname(file.originalname).toLowerCase();
    
    // Generar timestamp único
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    
    // Formato final: titulo-usuario-timestamp-random.ext
    const nombreFinal = `${tituloSanitizado}-${usuarioSanitizado}-${timestamp}-${random}${extension}`;
    
    console.log(`📎 Guardando archivo: ${file.originalname} -> ${nombreFinal}`);
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

// Servir archivos estáticos desde la carpeta uploads CON RUTA ABSOLUTA
app.use('/uploads', express.static(uploadsDir));
console.log('📂 Sirviendo archivos desde:', uploadsDir);

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

// 📌 Ruta para cambiar contraseña (PUT /users/:userId/change-password)
app.put("/users/:userId/change-password", async (req, res) => {
  try {
    const { userId } = req.params;
    const { passwordActual, passwordNueva } = req.body;
    
    console.log(`Solicitud de cambio de contraseña para usuario: ${userId}`);
    
    const resultado = await cambiarPassword({
      userId,
      passwordActual,
      passwordNueva
    });
    
    if (!resultado.ok) {
      return res.status(400).json({ message: resultado.message });
    }
    
    res.status(200).json({ message: resultado.message });
    
  } catch (err) {
    console.error('Error al cambiar contraseña:', err);
    res.status(500).json({ message: "Error en el servidor", error: err.message });
  }
});

// 📌 Ruta para cambiar rol de usuario (PUT /users/:userId/role) - Solo SuperUser
app.put("/users/:userId/role", async (req, res) => {
  try {
    const { userId } = req.params;
    const { nuevoRol, adminId } = req.body;
    
    console.log(`Solicitud de cambio de rol para usuario: ${userId} a ${nuevoRol}`);
    
    const resultado = await cambiarRolUsuario({ userId, nuevoRol, adminId });
    
    if (!resultado.ok) {
      return res.status(400).json({ message: resultado.message });
    }
    
    res.status(200).json({ message: resultado.message });
    
  } catch (err) {
    console.error('Error al cambiar rol:', err);
    res.status(500).json({ message: "Error en el servidor", error: err.message });
  }
});

// 📌 Ruta para desactivar usuario (PUT /users/:userId/deactivate)
app.put("/users/:userId/deactivate", async (req, res) => {
  try {
    const { userId } = req.params;
    const { adminId } = req.body;
    
    console.log(`Solicitud de desactivación de usuario: ${userId}`);
    
    const resultado = await desactivarUsuario({ userId, adminId });
    
    if (!resultado.ok) {
      return res.status(400).json({ message: resultado.message });
    }
    
    res.status(200).json({ message: resultado.message });
    
  } catch (err) {
    console.error('Error al desactivar usuario:', err);
    res.status(500).json({ message: "Error en el servidor", error: err.message });
  }
});

// 📌 Ruta para actualizar usuario (PUT /users/:userId) - Solo SuperUser
app.put("/users/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { username, email, password, rol, departamento, adminId } = req.body;
    
    console.log(`Solicitud de actualización de usuario: ${userId}`);
    
    const resultado = await actualizarUsuario({ 
      userId, 
      username, 
      email, 
      password, 
      rol, 
      departamento, 
      adminId 
    });
    
    if (!resultado.ok) {
      return res.status(400).json({ message: resultado.message });
    }
    
    res.status(200).json({ message: resultado.message, user: resultado.user });
    
  } catch (err) {
    console.error('Error al actualizar usuario:', err);
    res.status(500).json({ message: "Error en el servidor", error: err.message });
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

// 📌 Ruta para agregar comentario con archivo a un ticket (POST /tickets/:id/comentarios-con-archivo)
app.post("/tickets/:id/comentarios-con-archivo", (req, res, next) => {
  console.log('=== INICIO UPLOAD ===');
  console.log('Ticket ID:', req.params.id);
  console.log('Body antes de upload:', req.body);
  next();
}, upload.single('archivo'), async (req, res) => {
  console.log('=== DESPUÉS DE MULTER ===');
  console.log('Body después de upload:', req.body);
  console.log('Archivo:', req.file);
  
  try {
    const ticketNumber = parseInt(req.params.id);
    const { texto, usuario_id, usuario_nombre } = req.body;
    
    console.log(`Agregando comentario con archivo al ticket #${ticketNumber}`);
    console.log('Datos del comentario:', { texto, usuario_id, usuario_nombre });
    
    if (isNaN(ticketNumber)) {
      if (req.file && req.file.path) {
        try {
          fs.unlinkSync(req.file.path);
          console.log('Archivo temporal eliminado');
        } catch (e) {
          console.error('Error al eliminar archivo temporal:', e);
        }
      }
      return res.status(400).json({ 
        message: "ID de ticket inválido", 
        receivedId: req.params.id 
      });
    }
    
    if (!texto || !texto.trim()) {
      if (req.file && req.file.path) {
        try {
          fs.unlinkSync(req.file.path);
          console.log('Archivo temporal eliminado');
        } catch (e) {
          console.error('Error al eliminar archivo temporal:', e);
        }
      }
      return res.status(400).json({ message: "El texto del comentario es requerido" });
    }
    
    // Buscar ticket por Number
    const { Ticket } = require("./server/tickets");
    const ticket = await Ticket.findOne({ Number: ticketNumber });
    
    if (!ticket) {
      if (req.file && req.file.path) {
        try {
          fs.unlinkSync(req.file.path);
          console.log('Archivo temporal eliminado');
        } catch (e) {
          console.error('Error al eliminar archivo temporal:', e);
        }
      }
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
    
    // Si hay archivo, agregar información con RUTA RELATIVA
    if (req.file) {
      // Guardar solo el nombre del archivo, no la ruta completa
      const archivoNombre = req.file.filename;
      const archivoPath = path.join('uploads', archivoNombre); // Ruta relativa
      
      // Verificar que el archivo se guardó correctamente
      const archivoCompleto = path.join(__dirname, archivoPath);
      if (!fs.existsSync(archivoCompleto)) {
        console.error('❌ Archivo no se guardó correctamente:', archivoCompleto);
        return res.status(500).json({ 
          message: 'Error al guardar el archivo en el servidor'
        });
      }
      
      nuevoComentario.archivo_path = archivoPath;
      nuevoComentario.archivo_nombre_original = req.file.originalname;
      nuevoComentario.archivo_nombre_servidor = archivoNombre;
      nuevoComentario.archivo_size = req.file.size;
      nuevoComentario.archivo_mimetype = req.file.mimetype;
      
      // Detectar si es imagen
      const imageMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      nuevoComentario.es_imagen = imageMimeTypes.includes(req.file.mimetype);
      
      console.log(`✅ Archivo guardado correctamente:`);
      console.log(`   - Nombre original: ${req.file.originalname}`);
      console.log(`   - Nombre servidor: ${archivoNombre}`);
      console.log(`   - Ruta: ${archivoPath}`);
      console.log(`   - Tamaño: ${req.file.size} bytes`);
      console.log(`   - Tipo: ${req.file.mimetype}`);
    }
    
    // Agregar comentario al array
    if (!ticket.comentarios) {
      ticket.comentarios = [];
    }
    ticket.comentarios.push(nuevoComentario);
    ticket.UpdatedAt = Date.now();
    
    await ticket.save();
    
    console.log(`✅ Comentario con archivo agregado exitosamente al ticket #${ticketNumber}`);
    
    res.status(201).json({
      message: "Comentario agregado exitosamente",
      comentario: nuevoComentario,
      ticket: ticket
    });
    
  } catch (error) {
    console.error('❌ Error al agregar comentario con archivo:', error);
    console.error('Stack:', error.stack);
    
    // Si hay error, eliminar el archivo subido
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
        console.log('Archivo temporal eliminado después de error');
      } catch (e) {
        console.error('Error al eliminar archivo temporal:', e);
      }
    }
    
    res.status(500).json({ 
      message: "Error al agregar comentario con archivo", 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
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

// 📌 Ruta para eliminar ticket (DELETE /tickets/:id)
app.delete("/tickets/:id", async (req, res) => {
  try {
    const ticketNumber = parseInt(req.params.id);
    
    console.log(`Solicitud de eliminación de ticket #${ticketNumber}`);
    
    if (isNaN(ticketNumber)) {
      return res.status(400).json({ 
        message: "ID de ticket inválido" 
      });
    }
    
    const { Ticket } = require("./server/tickets");
    
    // Buscar el ticket antes de eliminarlo
    const ticket = await Ticket.findOne({ Number: ticketNumber });
    
    if (!ticket) {
      return res.status(404).json({ 
        message: `Ticket #${ticketNumber} no encontrado` 
      });
    }
    
    // Si tiene archivo adjunto, eliminarlo del sistema de archivos
    if (ticket.archivo_path && fs.existsSync(ticket.archivo_path)) {
      try {
        fs.unlinkSync(ticket.archivo_path);
        console.log(`Archivo eliminado: ${ticket.archivo_path}`);
      } catch (fileError) {
        console.error('Error al eliminar archivo:', fileError);
        // Continuar con la eliminación del ticket aunque falle el archivo
      }
    }
    
    // Eliminar el ticket de la base de datos
    await Ticket.deleteOne({ Number: ticketNumber });
    
    console.log(`✅ Ticket #${ticketNumber} eliminado exitosamente`);
    
    res.status(200).json({
      message: `Ticket #${ticketNumber} eliminado exitosamente`,
      ticketEliminado: {
        Number: ticket.Number,
        Title: ticket.Title
      }
    });
    
  } catch (error) {
    console.error('Error al eliminar ticket:', error);
    res.status(500).json({ 
      message: "Error al eliminar ticket", 
      error: error.message 
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Backend corriendo en http://localhost:${PORT}`);
  console.log(`📁 Archivos servidos desde: /uploads -> ${uploadsDir}`);
});
