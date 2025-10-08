# 🚀 Guía Rápida de Inicio

## ⚡ Pasos para iniciar el proyecto con Bun y Vite

### 1. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto (si aún no existe):

```bash
cp .env.example .env
```

Luego edita el archivo `.env` y agrega tu URI de MongoDB:

```env
MONGODB_URI=mongodb+srv://tu_usuario:tu_password@cluster.mongodb.net/tu_database
PORT=5000
```

### 2. Instalar Bun (si no lo tienes)

Si aún no tienes Bun instalado, ejecuta:

```bash
curl -fsSL https://bun.sh/install | bash
```

### 3. Instalar Dependencias

```bash
bun install
```

### 4. Iniciar el Proyecto en Modo Desarrollo

```bash
bun dev
```

Esto iniciará:
- ✅ **Backend** en http://localhost:5000 con auto-reload
- ✅ **Frontend** en http://localhost:3000 con Hot Module Replacement (HMR)

### 5. Abre tu Navegador

El navegador se abrirá automáticamente en http://localhost:3000

## 🎯 ¿Qué es Vite y por qué usarlo?

**Vite** es una herramienta de desarrollo moderna que ofrece:

- **⚡ Inicio Instantáneo**: No necesita empaquetar todo antes de iniciar
- **🔥 Hot Module Replacement (HMR)**: Los cambios se reflejan al instante sin recargar la página
- **📦 Build Optimizado**: Crea builds ultra rápidos usando Rollup
- **🎨 Soporte CSS/Assets**: Importa CSS, imágenes y otros assets directamente

### Diferencia vs desarrollo tradicional:

**Antes (sin Vite)**:
- Hacías un cambio → Guardabas → Recargabas manualmente el navegador
- Para proyectos grandes, cada cambio tardaba segundos

**Ahora (con Vite)**:
- Haces un cambio → Guardas → ¡Se actualiza instantáneamente!
- No necesitas recargar el navegador
- Ves los cambios en milisegundos

## 🛠️ Comandos Disponibles

```bash
# Desarrollo con hot reload (Backend + Frontend)
bun dev

# Solo Backend con auto-reload
bun dev:backend

# Solo Frontend con Vite HMR
bun dev:frontend

# Producción (solo Backend)
bun start

# Build del Frontend para producción
bun run build

# Vista previa de la build
bun run preview
```

## 💡 Consejos para Desarrollo

1. **Usa `bun dev`** para ver cambios en tiempo real
2. **El backend se reinicia automáticamente** cuando modificas archivos en `/Backend`
3. **El frontend se actualiza instantáneamente** cuando modificas archivos en `/Frontend`
4. **Las llamadas API se redirigen automáticamente** gracias al proxy de Vite

## 🐛 Troubleshooting

### El backend no inicia
- Verifica que tienes el archivo `.env` con `MONGODB_URI` válido
- Asegúrate de que el puerto 5000 no esté ocupado

### El frontend no carga
- Verifica que el puerto 3000 no esté ocupado
- Ejecuta `bun install` nuevamente

### No veo los cambios
- Guarda el archivo con Ctrl+S o Cmd+S
- Verifica que `bun dev` esté corriendo

## 🎉 ¡Listo!

Ahora puedes desarrollar tu proyecto y ver los cambios al instante. ¡Disfruta la velocidad de Bun y Vite!
