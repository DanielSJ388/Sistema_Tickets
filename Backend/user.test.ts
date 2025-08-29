import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
const { registrarUsuario, iniciarSesion } = require("./server/user.js");
import bcrypt from "bcryptjs";

// Importar Jest globals explícitamente
import { beforeAll, afterAll, afterEach, describe, test, expect } from '@jest/globals';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  // limpiar colecciones entre tests
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

describe("Testing funciones de usuario", () => {
  test("❌ No debería registrar usuario si faltan datos", async () => {
    const result = await registrarUsuario({ username: "daniel" });
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/Faltan datos/);
  });

  test("✅ Debería registrar un usuario correctamente", async () => {
    const result = await registrarUsuario({
      username: "daniel",
      email: "daniel@test.com",
      password: "123456"
    });

    expect(result.ok).toBe(true);
    expect(result.message).toMatch(/exitosamente/);
  });

  test("❌ No debería registrar dos usuarios con mismo email", async () => {
    await registrarUsuario({
      username: "daniel",
      email: "daniel@test.com",
      password: "123456"
    });

    const result = await registrarUsuario({
      username: "otro",
      email: "daniel@test.com",
      password: "abcdef"
    });

    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/ya registrado/);
  });

  test("✅ Debería iniciar sesión con username", async () => {
    await registrarUsuario({
      username: "pepe",
      email: "pepe@test.com",
      password: "secreto123"
    });

    const result = await iniciarSesion({
      identifier: "pepe",
      password: "secreto123"
    });

    expect(result.ok).toBe(true);
    expect(result.user?.username).toBe("pepe");
  });

  test("❌ No debería iniciar sesión con contraseña incorrecta", async () => {
    await registrarUsuario({
      username: "pepe",
      email: "pepe@test.com",
      password: "secreto123"
    });

    const result = await iniciarSesion({
      identifier: "pepe",
      password: "incorrecta"
    });

    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/Credenciales inválidas/);
  });
});
