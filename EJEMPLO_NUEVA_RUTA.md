# 📝 Ejemplo: Agregar ruta de "Categorías"

## Paso 1: Backend (`Backend/server.js`)

Agrega estas líneas después de las rutas de tickets:

```javascript
// 📌 Obtener todas las categorías (GET /categorias)
app.get("/categorias", async (req, res) => {
  try {
    const categorias = [
      { id: 1, nombre: "Soporte Técnico", color: "#007bff" },
      { id: 2, nombre: "Ventas", color: "#28a745" },
      { id: 3, nombre: "Recursos Humanos", color: "#ffc107" },
    ];
    
    res.status(200).json(categorias);
  } catch (err) {
    res.status(500).json({ 
      message: "Error al obtener categorías", 
      error: err.message 
    });
  }
});

// 📌 Crear una nueva categoría (POST /categorias)
app.post("/categorias", async (req, res) => {
  try {
    const { nombre, color } = req.body;
    
    if (!nombre || !color) {
      return res.status(400).json({ 
        message: "Faltan datos: nombre y color son requeridos" 
      });
    }
    
    const nuevaCategoria = {
      id: Date.now(),
      nombre,
      color,
      createdAt: new Date()
    };
    
    // Aquí guardarías en MongoDB
    
    res.status(201).json({ 
      message: "Categoría creada exitosamente",
      categoria: nuevaCategoria
    });
  } catch (err) {
    res.status(500).json({ 
      message: "Error al crear categoría", 
      error: err.message 
    });
  }
});
```

---

## Paso 2: Vite Config (`vite.config.js`)

En la sección `proxy`, agrega:

```javascript
server: {
  port: 3000,
  open: false,
  proxy: {
    '/tickets': {
      target: 'http://localhost:5000',
      changeOrigin: true,
    },
    '/users': {
      target: 'http://localhost:5000',
      changeOrigin: true,
    },
    '/register': {
      target: 'http://localhost:5000',
      changeOrigin: true,
    },
    '/login': {
      target: 'http://localhost:5000',
      changeOrigin: true,
    },
    '/uploads': {
      target: 'http://localhost:5000',
      changeOrigin: true,
    },
    // 🆕 Nueva ruta
    '/categorias': {
      target: 'http://localhost:5000',
      changeOrigin: true,
    },
  }
},
```

---

## Paso 3: Frontend (Ejemplo en `Frontend/assets/js/categorias.js`)

Crea un nuevo archivo o usa uno existente:

```javascript
// Cargar categorías al iniciar la página
document.addEventListener('DOMContentLoaded', () => {
  cargarCategorias();
});

// Función para cargar categorías
async function cargarCategorias() {
  try {
    console.log('Cargando categorías...');
    
    const response = await fetch('/categorias');
    
    if (response.ok) {
      const categorias = await response.json();
      console.log('✅ Categorías cargadas:', categorias);
      
      mostrarCategorias(categorias);
    } else {
      console.error('Error al cargar categorías:', response.status);
    }
  } catch (error) {
    console.error('❌ Error de conexión:', error);
  }
}

// Función para mostrar categorías en el HTML
function mostrarCategorias(categorias) {
  const container = document.getElementById('categorias-container');
  
  if (!container) return;
  
  container.innerHTML = '';
  
  categorias.forEach(categoria => {
    const div = document.createElement('div');
    div.className = 'categoria-card';
    div.style.borderLeft = `4px solid ${categoria.color}`;
    div.innerHTML = `
      <h3>${categoria.nombre}</h3>
      <span class="badge" style="background: ${categoria.color}">ID: ${categoria.id}</span>
    `;
    
    container.appendChild(div);
  });
}

// Función para crear una nueva categoría
async function crearCategoria(nombre, color) {
  try {
    const response = await fetch('/categorias', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ nombre, color })
    });
    
    if (response.ok) {
      const resultado = await response.json();
      console.log('✅ Categoría creada:', resultado);
      
      // Recargar la lista
      cargarCategorias();
      
      return resultado;
    } else {
      const error = await response.json();
      console.error('Error:', error.message);
    }
  } catch (error) {
    console.error('❌ Error al crear categoría:', error);
  }
}

// Ejemplo de uso con un formulario
document.getElementById('formCategoria')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const nombre = document.getElementById('nombreCategoria').value;
  const color = document.getElementById('colorCategoria').value;
  
  await crearCategoria(nombre, color);
  
  // Limpiar formulario
  e.target.reset();
});
```

---

## Paso 4: HTML (si necesitas una página nueva)

Ejemplo `Frontend/categorias.html`:

```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Categorías - Sistema Tickets</title>
    <link rel="stylesheet" href="assets/css/styles.css">
</head>
<body>
    <div class="page-container">
        <main class="main-content">
            <h1>Gestión de Categorías</h1>
            
            <!-- Formulario para crear categoría -->
            <form id="formCategoria" class="card">
                <h2>Nueva Categoría</h2>
                <input type="text" id="nombreCategoria" placeholder="Nombre" required>
                <input type="color" id="colorCategoria" value="#007bff" required>
                <button type="submit">Crear Categoría</button>
            </form>
            
            <!-- Lista de categorías -->
            <div id="categorias-container" class="categorias-grid"></div>
        </main>
    </div>
    
    <script src="assets/js/categorias.js"></script>
</body>
</html>
```

---

## ✅ Resultado:

1. **Backend** tiene la ruta `/categorias` funcionando
2. **Vite** redirige las peticiones correctamente
3. **Frontend** puede consumir la API sin problemas
4. **Todo funciona con hot reload** 🔥

---

## 🔍 Verificar que funciona:

1. Guarda los archivos
2. Abre la consola del navegador (F12)
3. Ve a http://localhost:3000/categorias.html
4. Deberías ver los logs en la consola y las categorías cargadas

O prueba directamente la API:
- Abre http://localhost:5000/categorias en tu navegador
- Deberías ver el JSON con las categorías
