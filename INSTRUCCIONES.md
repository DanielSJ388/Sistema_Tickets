# Sistema de Tickets - Instrucciones de Uso

## ⚠️ IMPORTANTE: Cómo ejecutar correctamente

### 🚫 **NO HACER** - No abrir archivos directamente
- ❌ **NO** abrir `auth.html` directamente desde el explorador de archivos
- ❌ **NO** usar rutas como `file:///home/kali/Documentos/Sistema_Tickets/Frontend/auth.html`
- ❌ Esto causa errores de CORS y localStorage

### ✅ **HACER** - Usar servidor HTTP local

#### 1. **Iniciar el Backend:**
```bash
cd /home/kali/Documentos/Sistema_Tickets/Backend
npm start
# El servidor debería ejecutarse en http://localhost:3000
```

#### 2. **Iniciar el Frontend:**
```bash
cd /home/kali/Documentos/Sistema_Tickets/Frontend
python3 -m http.server 8081
# El servidor debería ejecutarse en http://localhost:8081
```

#### 3. **Acceder a la aplicación:**
- 🌐 **Página de login:** http://localhost:8081/auth.html
- 🌐 **Dashboard:** http://localhost:8081/dashboard.html
- 🛠️ **Debug localStorage:** http://localhost:8081/debug_storage.html
- 🧪 **Test login:** http://localhost:8081/test_login.html

## 🚀 Script automático
```bash
# Para iniciar todo automáticamente:
./iniciar_sistema.sh
```

## 🧪 Usuario de prueba
- **Username:** testuser
- **Password:** 123456

## 🐛 Solución de problemas

### Si hay bucle infinito de login:
1. Ir a http://localhost:8081/debug_storage.html
2. Hacer clic en "Limpiar localStorage"
3. Intentar login nuevamente

### Si no funciona el login:
1. Verificar que el backend esté ejecutándose en puerto 3000
2. Verificar que el frontend esté ejecutándose en puerto 8081
3. Usar las herramientas de desarrollador (F12) para ver errores en consola

### Para debugging:
- En la consola del dashboard, ejecutar: `debugStorage()`
- Revisar los logs detallados en la consola del navegador

## 📁 Estructura del proyecto
```
Sistema_Tickets/
├── Backend/          # Servidor Node.js (puerto 3000)
│   ├── server.js
│   └── server/
└── Frontend/         # Aplicación web (puerto 8080)
    ├── auth.html     # ← Página de login
    ├── dashboard.html
    └── assets/
```

## 🔧 Comandos útiles

### Backend:
```bash
cd Backend
npm install        # Instalar dependencias
npm start          # Iniciar servidor
```

### Frontend:
```bash
cd Frontend
python3 -m http.server 8081    # Servidor HTTP simple
```

### Verificar que todo funciona:
```bash
# En otra terminal, probar el backend:
curl http://localhost:3000/login -X POST -H "Content-Type: application/json" -d '{"identifier":"testuser","password":"123456"}'
```