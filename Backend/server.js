// ============================================================
// Backend: API de registro de usuarios para Sistema_Tickets
// ============================================================

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const { registrarUsuario, iniciarSesion } = require("./server/user"); // Importa funciones

const app = express();

app.use(cors());
app.use(bodyParser.json());

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

app.listen(3000, () => {
  console.log("🚀 Servidor corriendo en http://localhost:3000");
});
