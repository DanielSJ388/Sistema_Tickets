# Sistema de Tickets

Sistema de gestión de tickets construido con Bun, Vite, Express y MongoDB.

## 🚀 Requisitos

- [Bun](https://bun.sh) instalado en tu sistema
- MongoDB Atlas o MongoDB local

## 📦 Instalación

1. Clona el repositorio
2. Copia `.env.example` a `.env` y configura tus variables de entorno:
   ```bash
   cp .env.example .env
   ```
3. Instala las dependencias con Bun:
   ```bash
   bun install
   ```

## 🏃 Desarrollo

Para iniciar el proyecto en modo desarrollo con hot reload:

```bash
bun dev
```

Este comando iniciará:
- **Backend** (Express): http://localhost:5000 con auto-reload
- **Frontend** (Vite): http://localhost:3000 con HMR (Hot Module Replacement)

### Comandos individuales

Si prefieres ejecutarlos por separado:

```bash
# Solo backend con auto-reload
bun dev:backend

# Solo frontend con Vite
bun dev:frontend
```

## 🛠️ Otros comandos

```bash
# Iniciar en producción (solo backend)
bun start

# Construir frontend para producción
bun run build

# Vista previa de la build de producción
bun run preview
```

## 📁 Estructura del proyecto

```
Sistema_Tickets/
├── Backend/
│   ├── server.js          # Servidor principal Express
│   ├── server/
│   │   ├── tickets.js     # Controladores de tickets
│   │   └── user.js        # Controladores de usuarios
│   └── uploads/           # Archivos subidos
├── Frontend/
│   ├── assets/
│   │   ├── css/          # Estilos
│   │   └── js/           # Scripts
│   └── *.html            # Páginas HTML
├── vite.config.js        # Configuración de Vite
└── package.json          # Dependencias y scripts
```

## ✨ Características de desarrollo

- **Hot Reload**: El backend se reinicia automáticamente al detectar cambios
- **HMR**: El frontend se actualiza instantáneamente sin recargar la página
- **Proxy**: Las llamadas a `/api` y `/uploads` se redirigen automáticamente al backend
- **Build optimizado**: Vite optimiza el código para producción

## 🔧 Configuración

El archivo `vite.config.js` incluye:
- Servidor de desarrollo en puerto 3000
- Proxy para el backend
- Alias de rutas para imports más limpios
- Configuración de build multi-página

## 📝 Notas

- Asegúrate de tener un archivo `.env` con tu `MONGODB_URI`
- El backend corre en el puerto 5000 por defecto
- El frontend corre en el puerto 3000 por defecto
