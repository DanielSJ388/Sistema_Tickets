// ============================================================
// Módulo de usuario: modelo y funciones para registrar e iniciar sesión
// ============================================================

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// 📌 Modelo Usuario (colección "users")
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true }, // nombre de usuario único
  email:    { type: String, required: true, unique: true, trim: true, lowercase: true }, // correo único
  password: { type: String, required: true }                // contraseña encriptada
});
const User = mongoose.model("User", UserSchema);

/**
 * Registra un usuario en la base de datos, encriptando la contraseña.
 * @param {Object} datos - { username, email, password }
 * @returns {Promise<{ok: boolean, message: string}>}
 */
async function registrarUsuario(datos) {
  const { username, email, password } = datos || {};

  // Validación básica
  if (!username || !email || !password) {
    return { ok: false, message: "Faltan datos: username, email y password son obligatorios" };
  }
  const usernameClean = String(username).trim();
  const emailClean = String(email).toLowerCase().trim();
  const passwordStr = String(password);

  if (passwordStr.length < 6) {
    return { ok: false, message: "La contraseña debe tener al menos 6 caracteres" };
  }

  // Verifica si ya existe usuario o correo
  const existe = await User.findOne({ $or: [{ username: usernameClean }, { email: emailClean }] });
  if (existe) {
    return { ok: false, message: "Usuario o correo ya registrado" };
  }

  // Encripta la contraseña antes de guardar
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(passwordStr, salt);

  // Crea y guarda el nuevo usuario con la contraseña encriptada
  const nuevoUsuario = new User({ username: usernameClean, email: emailClean, password: passwordHash });
  await nuevoUsuario.save();
  return { ok: true, message: "Usuario registrado exitosamente ✅" };
}

/**
 * Inicia sesión verificando usuario/email + contraseña.
 * @param {Object} datos - { identifier, password } (identifier puede ser username o email)
 * @returns {Promise<{ok: boolean, message: string, user?: {id:string, username:string, email:string}}>}
 */
async function iniciarSesion(datos) {
  const { identifier, password } = datos || {};

  if (!identifier || !password) {
    return { ok: false, message: "Faltan datos: identifier y password son obligatorios" };
  }

  const idClean = String(identifier).trim();
  const query = idClean.includes("@")
    ? { email: idClean.toLowerCase() }
    : { username: idClean };

  const usuario = await User.findOne(query);
  if (!usuario) {
    // Mensaje genérico para no filtrar si existe o no
    return { ok: false, message: "Credenciales inválidas" };
  }

  const coincide = await bcrypt.compare(String(password), usuario.password);
  if (!coincide) {
    return { ok: false, message: "Credenciales inválidas" };
  }

  return {
    ok: true,
    message: "Inicio de sesión exitoso ✅",
    user: { id: usuario._id.toString(), username: usuario.username, email: usuario.email }
  };
}

module.exports = { registrarUsuario, iniciarSesion };