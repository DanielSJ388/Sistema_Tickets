# 🚀 Guía: Cómo agregar una nueva ruta en tu proyecto

## 📋 Resumen rápido
Para agregar una nueva ruta necesitas modificar **2 archivos**:
1. **Backend** (`Backend/server.js`) - Crear el endpoint
2. **Vite Config** (`vite.config.js`) - Agregar el proxy (si es necesario)

---

## 🔧 Paso a Paso

### 1️⃣ **Backend: Agregar la ruta en `server.js`**

Abre el archivo `/Backend/server.js` y agrega tu nueva ruta. Ejemplo:

```javascript
// 📌 Nueva ruta de ejemplo (GET /mi-nueva-ruta)
app.get("/mi-nueva-ruta", async (req, res) => {
  try {
    // Tu lógica aquí
    const datos = { mensaje: "¡Hola desde la nueva ruta!" };
    
    res.status(200).json(datos);
  } catch (err) {
    console.error('Error en mi-nueva-ruta:', err);
    res.status(500).json({ 
      message: "Error en el servidor", 
      error: err.message 
    });
  }
});
```

**Tipos de rutas comunes:**

```javascript
// GET - Obtener datos
app.get("/productos", async (req, res) => {
  // Lógica para obtener productos
});

// POST - Crear algo nuevo
app.post("/productos", async (req, res) => {
  const nuevoProducto = req.body;
  // Lógica para crear producto
});

// PUT - Actualizar
app.put("/productos/:id", async (req, res) => {
  const { id } = req.params;
  const datosActualizados = req.body;
  // Lógica para actualizar
});

// DELETE - Eliminar
app.delete("/productos/:id", async (req, res) => {
  const { id } = req.params;
  // Lógica para eliminar
});
```

---

### 2️⃣ **Frontend Config: Agregar al proxy de Vite** (si es necesario)

Si tu nueva ruta es una **API** que el frontend consumirá, agrégala al proxy en `vite.config.js`:

```javascript
server: {
  port: 3000,
  open: false,
  proxy: {
    // ✅ Rutas existentes
    '/tickets': {
      target: 'http://localhost:5000',
      changeOrigin: true,
    },
    '/users': {
      target: 'http://localhost:5000',
      changeOrigin: true,
    },
    
    // 🆕 Tu nueva ruta
    '/mi-nueva-ruta': {
      target: 'http://localhost:5000',
      changeOrigin: true,
    },
    '/productos': {
      target: 'http://localhost:5000',
      changeOrigin: true,
    },
  }
},
```

---

### 3️⃣ **Frontend: Consumir la ruta en tu JavaScript**

En cualquier archivo `.js` de tu frontend:

```javascript
// ✅ Usar ruta relativa (el proxy lo redirige al backend)
async function obtenerDatos() {
  try {
    const response = await fetch('/mi-nueva-ruta');
    
    if (response.ok) {
      const datos = await response.json();
      console.log('Datos recibidos:', datos);
      return datos;
    } else {
      console.error('Error:', response.status);
    }
  } catch (error) {
    console.error('Error de conexión:', error);
  }
}

// Llamar la función
obtenerDatos();
```

---

## 🎯 Ejemplo completo: Agregar ruta de "Productos"

### 1. En `Backend/server.js`:

```javascript
// 📌 Obtener todos los productos (GET /productos)
app.get("/productos", async (req, res) => {
  try {
    // Aquí irías a MongoDB, por ahora datos de ejemplo
    const productos = [
      { id: 1, nombre: "Laptop", precio: 1000 },
      { id: 2, nombre: "Mouse", precio: 25 },
    ];
    
    res.status(200).json(productos);
  } catch (err) {
    res.status(500).json({ message: "Error al obtener productos", error: err.message });
  }
});

// 📌 Crear un producto (POST /productos)
app.post("/productos", async (req, res) => {
  try {
    const { nombre, precio } = req.body;
    
    // Validación básica
    if (!nombre || !precio) {
      return res.status(400).json({ message: "Faltan datos requeridos" });
    }
    
    // Aquí crearías el producto en MongoDB
    const nuevoProducto = { id: Date.now(), nombre, precio };
    
    res.status(201).json({ 
      message: "Producto creado exitosamente", 
      producto: nuevoProducto 
    });
  } catch (err) {
    res.status(500).json({ message: "Error al crear producto", error: err.message });
  }
});
```

### 2. En `vite.config.js`:

```javascript
proxy: {
  // ... otras rutas ...
  '/productos': {
    target: 'http://localhost:5000',
    changeOrigin: true,
  },
}
```

### 3. En tu archivo JavaScript del Frontend:

```javascript
// Obtener productos
async function cargarProductos() {
  try {
    const response = await fetch('/productos');
    const productos = await response.json();
    console.log('Productos:', productos);
    // Mostrar en tu HTML
  } catch (error) {
    console.error('Error:', error);
  }
}

// Crear producto
async function crearProducto(nombre, precio) {
  try {
    const response = await fetch('/productos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ nombre, precio })
    });
    
    const resultado = await response.json();
    console.log('Producto creado:', resultado);
  } catch (error) {
    console.error('Error:', error);
  }
}
```

---

## ⚡ Reglas importantes:

### ✅ **SI necesitas agregar al proxy de Vite:**
- La ruta es una **API** que el frontend consume
- Necesitas que las peticiones se redirijan del puerto 3000 al 5000
- Ejemplo: `/productos`, `/categorias`, `/ventas`, etc.

### ❌ **NO necesitas agregar al proxy si:**
- Es solo una ruta HTML estática
- Es un archivo que Vite ya maneja (CSS, JS, imágenes)
- No es consumida desde el frontend

---

## 🔄 Aplicar cambios:

Después de agregar rutas:

1. **Si modificaste `server.js`**: 
   - Bun lo reiniciará automáticamente con `--watch` ✅

2. **Si modificaste `vite.config.js`**:
   - Vite lo detectará y reiniciará automáticamente ✅

3. **Si modificaste archivos JS del frontend**:
   - El Hot Module Replacement (HMR) actualizará automáticamente ✅

**No necesitas reiniciar nada manualmente** 🎉

---

## 🐛 Troubleshooting:

### "404 Not Found"
- ✅ Verifica que la ruta esté en `server.js`
- ✅ Verifica que la ruta esté en el proxy de `vite.config.js`
- ✅ Asegúrate de usar rutas relativas (`/ruta`) no absolutas (`http://...`)

### "CORS Error"
- ✅ Ya tienes `app.use(cors())` en tu `server.js`, debería funcionar
- ✅ Si persiste, usa el proxy de Vite (es para eso)

### "Cannot POST /ruta"
- ✅ Verifica que el método HTTP coincida (POST, GET, PUT, DELETE)
- ✅ Verifica que la ruta esté bien escrita

---

## 📚 Estructura recomendada:

Para proyectos más grandes, considera separar las rutas en módulos:

```
Backend/
├── server.js          # Archivo principal
├── routes/
│   ├── tickets.js     # Rutas de tickets
│   ├── users.js       # Rutas de usuarios
│   └── productos.js   # Rutas de productos (nuevo)
└── controllers/
    ├── ticketsController.js
    ├── usersController.js
    └── productosController.js
```

---

## ✨ Resumen:

1. **Backend**: Agrega la ruta en `server.js`
2. **Vite Config**: Agrega al proxy si es una API
3. **Frontend**: Consume con `fetch('/tu-ruta')`
4. **¡Listo!** Los cambios se aplican automáticamente 🚀
