import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
const { registrarUsuario, iniciarSesion } = require("./server/user.js");
import bcrypt from "bcryptjs";

// Importar Jest globals explícitamente
import { beforeAll, afterAll, afterEach, describe, test, expect } from '@jest/globals';

// Variable global para manejar el servidor de MongoDB en memoria
let mongoServer: MongoMemoryServer;

// 🚀 Configuración inicial antes de ejecutar todos los tests
beforeAll(async () => {
  // Crear una instancia de MongoDB en memoria para los tests
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  
  // Conectar mongoose a la base de datos temporal
  await mongoose.connect(uri);
});

// 🛑 Limpieza final después de ejecutar todos los tests
afterAll(async () => {
  // Desconectar mongoose de la base de datos
  await mongoose.disconnect();
  
  // Detener y limpiar el servidor de MongoDB en memoria
  await mongoServer.stop();
});

// 🧹 Limpieza entre cada test individual
afterEach(async () => {
  // Limpiar todas las colecciones de la base de datos entre tests
  // Esto garantiza que cada test empiece con una base de datos limpia
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// 📋 Suite de tests para las funciones de usuario
describe("Testing funciones de usuario", () => {
  
  // 🔴 Test: Validación de datos obligatorios
  test("❌ No debería registrar usuario si faltan datos", async () => {
    // Intentar registrar un usuario sin email ni password
    const result = await registrarUsuario({ username: "daniel" });
    
    // Verificar que el registro falle
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/Faltan datos/);
  });

  // 🟢 Test: Registro exitoso con datos completos
  test("✅ Debería registrar un usuario correctamente", async () => {
    // Registrar un usuario con todos los datos requeridos
    const result = await registrarUsuario({
      username: "daniel",
      email: "daniel@test.com",
      password: "123456"
    });

    // Verificar que el registro sea exitoso
    expect(result.ok).toBe(true);
    expect(result.message).toMatch(/exitosamente/);
  });

  // 🔴 Test: Validación de email único
  test("❌ No debería registrar dos usuarios con mismo email", async () => {
    // Registrar el primer usuario
    await registrarUsuario({
      username: "daniel",
      email: "daniel@test.com",
      password: "123456"
    });

    // Intentar registrar un segundo usuario con el mismo email
    const result = await registrarUsuario({
      username: "otro",
      email: "daniel@test.com", // Email duplicado
      password: "abcdef"
    });

    // Verificar que el segundo registro falle por email duplicado
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/ya registrado/);
  });

  // 🟢 Test: Inicio de sesión exitoso con username
  test("✅ Debería iniciar sesión con username", async () => {
    // Primero registrar un usuario
    await registrarUsuario({
      username: "pepe",
      email: "pepe@test.com",
      password: "secreto123"
    });

    // Intentar iniciar sesión usando el username
    const result = await iniciarSesion({
      identifier: "pepe", // Usando username como identificador
      password: "secreto123"
    });

    // Verificar que el inicio de sesión sea exitoso
    expect(result.ok).toBe(true);
    expect(result.user?.username).toBe("pepe");
  });

  // 🔴 Test: Validación de contraseña incorrecta
  test("❌ No debería iniciar sesión con contraseña incorrecta", async () => {
    // Primero registrar un usuario
    await registrarUsuario({
      username: "pepe",
      email: "pepe@test.com",
      password: "secreto123"
    });

    // Intentar iniciar sesión con contraseña incorrecta
    const result = await iniciarSesion({
      identifier: "pepe",
      password: "incorrecta" // Contraseña incorrecta
    });

    // Verificar que el inicio de sesión falle
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/Credenciales inválidas/);
  });
});
