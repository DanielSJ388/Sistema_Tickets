// ============================================================
// Módulo de usuario: modelo y función para registrar usuarios
// ============================================================

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs"); // Para encriptar contraseñas

// 📌 Modelo Usuario (colección "users")
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true }, // nombre de usuario único
  email:    { type: String, required: true, unique: true }, // correo único
  password: { type: String, required: true }                // contraseña encriptada
});
const User = mongoose.model("User", UserSchema);

/**
 * Registra un usuario en la base de datos, encriptando la contraseña.
 * @param {Object} datos - { username, email, password }
 * @returns {Promise<{ok: boolean, message: string}>}
 */
async function registrarUsuario(datos) {
  const { username, email, password } = datos;

  // Verifica si ya existe usuario o correo
  const existe = await User.findOne({ $or: [{ username }, { email }] });
  if (existe) {
    return { ok: false, message: "Usuario o correo ya registrado" };
  }

  // Encripta la contraseña antes de guardar
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  // Crea y guarda el nuevo usuario con la contraseña encriptada
  const nuevoUsuario = new User({ username, email, password: passwordHash });
  await nuevoUsuario.save();
  return { ok: true, message: "Usuario registrado exitosamente ✅" };
}

module.exports = { registrarUsuario };