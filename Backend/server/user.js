// ============================================================
// Módulo de usuario: modelo y funciones para registrar e iniciar sesión
// ============================================================

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// 📌 CÓDIGO SECRETO PARA SUPERUSER (cambiar en producción)
const SUPERUSER_SECRET_CODE = process.env.SUPERUSER_CODE || "SUPER_ADMIN_2024";

// 📌 Modelo Usuario (colección "users")
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  rol: { 
    type: String, 
    default: 'Usuario', 
    enum: ['SuperUser', 'Administrador', 'Usuario'] 
  },
  departamento: {
    type: String,
    default: null,
    enum: [null, 'Soporte Técnico', 'Recursos Humanos', 'Finanzas', 'Ventas', 'Marketing', 'Operaciones', 'Desarrollo']
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
});
const User = mongoose.model("User", UserSchema);

/**
 * Registra un usuario en la base de datos
 * @param {Object} datos - { username, email, password, rol, createdBy, superUserCode }
 */
async function registrarUsuario(datos) {
  const { username, email, password, rol, departamento, createdBy, superUserCode } = datos || {};

  if (!username || !email || !password) {
    return { ok: false, message: "Faltan datos: username, email y password son obligatorios" };
  }
  
  const usernameClean = String(username).trim();
  const emailClean = String(email).toLowerCase().trim();
  const passwordStr = String(password);
  let rolFinal = rol || 'Usuario';

  if (passwordStr.length < 6) {
    return { ok: false, message: "La contraseña debe tener al menos 6 caracteres" };
  }

  // 🔐 VALIDACIÓN ESPECIAL PARA SUPERUSER
  if (rol === 'SuperUser') {
    // Verificar si ya existe un SuperUser
    const superUserExistente = await User.findOne({ rol: 'SuperUser', isActive: true });
    
    if (superUserExistente) {
      return { 
        ok: false, 
        message: "Ya existe un SuperUser en el sistema. Solo puede haber uno." 
      };
    }
    
    // Validar código secreto
    if (!superUserCode || superUserCode !== SUPERUSER_SECRET_CODE) {
      return { 
        ok: false, 
        message: "Código de SuperUser inválido. Acceso denegado." 
      };
    }
    
    console.log('✅ Código de SuperUser validado correctamente');
  }

  // Validar permisos si se especifica un rol diferente a Usuario
  if (rol && rol !== 'Usuario' && rol !== 'SuperUser') {
    if (!createdBy) {
      return { ok: false, message: "Se requiere autenticación para crear usuarios con roles especiales" };
    }
    
    const creadorUser = await User.findById(createdBy);
    if (!creadorUser) {
      return { ok: false, message: "Usuario creador no encontrado" };
    }
    
    // Solo SuperUser puede crear Administradores
    if (rol === 'Administrador' && creadorUser.rol !== 'SuperUser') {
      return { ok: false, message: "Solo SuperUser puede crear Administradores" };
    }
    
    // Solo SuperUser y Administrador pueden crear otros usuarios
    if (!['SuperUser', 'Administrador'].includes(creadorUser.rol)) {
      return { ok: false, message: "No tienes permisos para crear usuarios" };
    }
  }

  const existe = await User.findOne({ $or: [{ username: usernameClean }, { email: emailClean }] });
  if (existe) {
    return { ok: false, message: "Usuario o correo ya registrado" };
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(passwordStr, salt);

  const nuevoUsuario = new User({ 
    username: usernameClean, 
    email: emailClean, 
    password: passwordHash,
    rol: rolFinal,
    departamento: departamento || null,
    createdBy: createdBy || null
  });
  
  await nuevoUsuario.save();
  
  const mensajeRol = rolFinal === 'SuperUser' ? ' como SUPERUSER' : 
                     rolFinal === 'Administrador' ? ` como Administrador en ${departamento}` : '';
  return { ok: true, message: `Usuario registrado exitosamente${mensajeRol} ✅` };
}

/**
 * Inicia sesión y retorna información del usuario con su rol
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
    return { ok: false, message: "Credenciales inválidas" };
  }
  
  if (!usuario.isActive) {
    return { ok: false, message: "Usuario desactivado. Contacta al administrador" };
  }

  const coincide = await bcrypt.compare(String(password), usuario.password);
  if (!coincide) {
    return { ok: false, message: "Credenciales inválidas" };
  }

  return {
    ok: true,
    message: "Inicio de sesión exitoso ✅",
    user: { 
      id: usuario._id.toString(), 
      username: usuario.username, 
      email: usuario.email,
      rol: usuario.rol,
      createdAt: usuario.createdAt
    }
  };
}

async function obtenerUsuarios() {
  return await User.find({ isActive: true }, 'username email rol departamento createdAt');
}

/**
 * Cambiar rol de un usuario (solo SuperUser)
 */
async function cambiarRolUsuario(datos) {
  const { userId, nuevoRol, departamento, adminId } = datos || {};
  
  if (!userId || !nuevoRol || !adminId) {
    return { ok: false, message: "Faltan datos requeridos" };
  }
  
  // Verificar que quien hace el cambio es SuperUser
  const admin = await User.findById(adminId);
  if (!admin || admin.rol !== 'SuperUser') {
    return { ok: false, message: "Solo SuperUser puede cambiar roles" };
  }
  
  const usuario = await User.findById(userId);
  if (!usuario) {
    return { ok: false, message: "Usuario no encontrado" };
  }
  
  // No se puede cambiar el rol del SuperUser original
  if (usuario.rol === 'SuperUser') {
    return { ok: false, message: "No se puede modificar el rol de SuperUser" };
  }
  
  // Si se está convirtiendo a Administrador, validar departamento
  if (nuevoRol === 'Administrador' && !departamento) {
    return { ok: false, message: "Los Administradores deben tener un departamento asignado" };
  }
  
  usuario.rol = nuevoRol;
  usuario.departamento = nuevoRol === 'Administrador' ? departamento : null;
  await usuario.save();
  
  return { ok: true, message: "Rol y departamento actualizados exitosamente" };
}

/**
 * Desactivar usuario (solo SuperUser y Administrador)
 */
async function desactivarUsuario(datos) {
  const { userId, adminId } = datos || {};
  
  if (!userId || !adminId) {
    return { ok: false, message: "Faltan datos requeridos" };
  }
  
  const admin = await User.findById(adminId);
  if (!admin || !['SuperUser', 'Administrador'].includes(admin.rol)) {
    return { ok: false, message: "No tienes permisos para desactivar usuarios" };
  }
  
  const usuario = await User.findById(userId);
  if (!usuario) {
    return { ok: false, message: "Usuario no encontrado" };
  }
  
  if (usuario.rol === 'SuperUser') {
    return { ok: false, message: "No se puede desactivar al SuperUser" };
  }
  
  usuario.isActive = false;
  await usuario.save();
  
  return { ok: true, message: "Usuario desactivado exitosamente" };
}

/**
 * Cambia la contraseña de un usuario verificando la contraseña actual
 * @param {Object} datos - { userId, passwordActual, passwordNueva }
 * @returns {Promise<{ok: boolean, message: string}>}
 */
async function cambiarPassword(datos) {
  const { userId, passwordActual, passwordNueva } = datos || {};

  // Validación básica
  if (!userId || !passwordActual || !passwordNueva) {
    return { ok: false, message: "Faltan datos: userId, passwordActual y passwordNueva son obligatorios" };
  }

  if (passwordNueva.length < 6) {
    return { ok: false, message: "La nueva contraseña debe tener al menos 6 caracteres" };
  }

  // Buscar usuario por ID
  const usuario = await User.findById(userId);
  if (!usuario) {
    return { ok: false, message: "Usuario no encontrado" };
  }

  // Verificar que la contraseña actual sea correcta
  const coincide = await bcrypt.compare(String(passwordActual), usuario.password);
  if (!coincide) {
    return { ok: false, message: "La contraseña actual es incorrecta" };
  }

  // Verificar que la nueva contraseña sea diferente a la actual
  const esLaMisma = await bcrypt.compare(String(passwordNueva), usuario.password);
  if (esLaMisma) {
    return { ok: false, message: "La nueva contraseña debe ser diferente a la actual" };
  }

  // Encriptar la nueva contraseña
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(String(passwordNueva), salt);

  // Actualizar contraseña
  usuario.password = passwordHash;
  await usuario.save();

  return { ok: true, message: "Contraseña actualizada exitosamente ✅" };
}

/**
 * Actualizar usuario (solo SuperUser puede modificar Administradores)
 */
async function actualizarUsuario(datos) {
  const { userId, username, email, password, rol, departamento, adminId } = datos || {};
  
  if (!userId || !adminId) {
    return { ok: false, message: "Faltan datos requeridos" };
  }
  
  // Verificar que quien hace el cambio es SuperUser
  const admin = await User.findById(adminId);
  if (!admin || admin.rol !== 'SuperUser') {
    return { ok: false, message: "Solo SuperUser puede modificar usuarios" };
  }
  
  const usuario = await User.findById(userId);
  if (!usuario) {
    return { ok: false, message: "Usuario no encontrado" };
  }
  
  // No se puede modificar el SuperUser
  if (usuario.rol === 'SuperUser') {
    return { ok: false, message: "No se puede modificar el SuperUser" };
  }
  
  // Validar que Administradores tengan departamento
  if (rol === 'Administrador' && !departamento) {
    return { ok: false, message: "Los Administradores deben tener un departamento asignado" };
  }
  
  // Verificar si el username o email ya existen (excepto el usuario actual)
  if (username && username !== usuario.username) {
    const existeUsername = await User.findOne({ username: username.trim(), _id: { $ne: userId } });
    if (existeUsername) {
      return { ok: false, message: "El nombre de usuario ya está en uso" };
    }
    usuario.username = username.trim();
  }
  
  if (email && email !== usuario.email) {
    const existeEmail = await User.findOne({ email: email.toLowerCase().trim(), _id: { $ne: userId } });
    if (existeEmail) {
      return { ok: false, message: "El correo electrónico ya está en uso" };
    }
    usuario.email = email.toLowerCase().trim();
  }
  
  // Actualizar rol y departamento
  if (rol) {
    usuario.rol = rol;
    usuario.departamento = rol === 'Administrador' ? departamento : null;
  }
  
  // Actualizar contraseña si se proporciona
  if (password && password.trim()) {
    if (password.length < 6) {
      return { ok: false, message: "La contraseña debe tener al menos 6 caracteres" };
    }
    const salt = await bcrypt.genSalt(10);
    usuario.password = await bcrypt.hash(password, salt);
  }
  
  await usuario.save();
  
  const mensajePassword = password ? ' (contraseña actualizada)' : '';
  return { 
    ok: true, 
    message: `Usuario actualizado exitosamente${mensajePassword}`,
    user: {
      id: usuario._id.toString(),
      username: usuario.username,
      email: usuario.email,
      rol: usuario.rol,
      departamento: usuario.departamento
    }
  };
}

module.exports = { 
  registrarUsuario, 
  iniciarSesion, 
  obtenerUsuarios, 
  cambiarPassword,
  cambiarRolUsuario,
  desactivarUsuario,
  actualizarUsuario
};