// ============================================================
// Backend: API de registro de usuarios para Sistema_Tickets
// Tecnologías: Node.js, Express, Mongoose (MongoDB)
// ============================================================

const express = require("express");   // Framework web para crear rutas y servidor HTTP
const mongoose = require("mongoose"); // ODM para conectarse y trabajar con MongoDB
const bodyParser = require("body-parser"); // Middleware para parsear JSON del cuerpo
const cors = require("cors");         // Middleware para permitir CORS (peticiones desde otro origen)

const app = express();

// Habilita CORS para permitir que el frontend (ej. http://localhost:5173 o un archivo local)
// pueda llamar a este backend en http://localhost:3000
app.use(cors());

// Permite recibir JSON en el body de las peticiones (req.body)
app.use(bodyParser.json());

// 🔗 Conexión con MongoDB Atlas
// IMPORTANTE: En producción usa variables de entorno y no hardcodees credenciales.
// Ejemplo: mongoose.connect(process.env.MONGODB_URI)
mongoose
  .connect(
    // Cadena de conexión a MongoDB Atlas:
    // - Protocolo: mongodb+srv
    // - Usuario/Contraseña: definidos en tu Atlas
    // - Host del cluster: sistematickets.ytr4nea.mongodb.net
    // - Base de datos por defecto: sistemaTickets
    // - Parámetros: retryWrites=true&w=majority&appName=SistemaTickets
    "mongodb+srv://ticketssistema722:wzApMxGtuX4ZlHc5@sistematickets.ytr4nea.mongodb.net/sistemaTickets?retryWrites=true&w=majority&appName=SistemaTickets"
  )
  .then(() => console.log("✅ Conectado a MongoDB Atlas"))
  .catch((err) => console.error("❌ Error de conexión:", err));

// 📌 Modelo Usuario (colección "users")
// - unique:true: crea un índice único para evitar duplicados
// - required:true: valida que el campo venga en el documento
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true }, // nombre de usuario único
  email:    { type: String, required: true, unique: true }, // correo único
  password: { type: String, required: true }                // contraseña en texto plano (ver nota abajo)
});
const User = mongoose.model("User", UserSchema);

// NOTA DE SEGURIDAD: No guardar contraseñas en texto plano.
// Usa hashing con bcrypt/bcryptjs y, opcionalmente, salting.

// 📌 Ruta para registrar usuario (POST /register)
// Flujo:
// 1) Leer datos del body (JSON)
// 2) Verificar si ya existe username o email (consulta con $or)
// 3) Crear y guardar el documento en MongoDB
// 4) Responder con el estado correspondiente
app.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body; // 1) Extrae datos del cliente

    // 2) Verificar que no exista usuario o correo ya registrado
    const existe = await User.findOne({ $or: [{ username }, { email }] });
    if (existe) {
      return res.status(400).json({ message: "Usuario o correo ya registrado" });
    }

    // 3) Crear y guardar el nuevo usuario
    // En producción: aplicar hash a "password" antes de guardar.
    const nuevoUsuario = new User({ username, email, password });
    await nuevoUsuario.save();

    // 4) Respuesta exitosa (201: creado)
    res.status(201).json({ message: "Usuario registrado exitosamente ✅" });
  } catch (err) {
    // Error inesperado del servidor
    res.status(500).json({ message: "Error en el servidor", error: err });
  }
});

// 🚀 Inicializa el servidor HTTP en puerto 3000
// El frontend hará peticiones a http://localhost:3000/register
app.listen(3000, () => {
  console.log("🚀 Servidor corriendo en http://localhost:3000");
});
