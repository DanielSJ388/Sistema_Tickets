#!/bin/bash

# Script para iniciar el Sistema de Tickets completo

echo "🚀 Iniciando Sistema de Tickets..."

# Verificar si Node.js está disponible
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado"
    exit 1
fi

# Verificar si Python3 está disponible
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 no está instalado"
    exit 1
fi

echo "✅ Dependencias verificadas"

# Cambiar al directorio del proyecto
cd "$(dirname "$0")"

# Función para limpiar procesos al salir
cleanup() {
    echo ""
    echo "🛑 Deteniendo servidores..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

# Capturar Ctrl+C
trap cleanup SIGINT

# Iniciar backend
echo "🔧 Iniciando backend en puerto 3000..."
cd Backend
npm start &
BACKEND_PID=$!
cd ..

# Esperar un poco para que el backend se inicie
sleep 3

# Iniciar frontend
echo "🌐 Iniciando frontend en puerto 8081..."
cd Frontend
python3 -m http.server 8081 &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Servidores iniciados:"
echo "   📡 Backend:  http://localhost:3000"
echo "   🌐 Frontend: http://localhost:8081"
echo ""
echo "🔗 Enlaces directos:"
echo "   Login:    http://localhost:8081/auth.html"
echo "   Dashboard: http://localhost:8081/dashboard.html"
echo "   Debug:    http://localhost:8081/debug_storage.html"
echo ""
echo "👤 Usuario de prueba:"
echo "   Username: testuser"
echo "   Password: 123456"
echo ""
echo "⏹️  Presiona Ctrl+C para detener ambos servidores"

# Esperar indefinidamente
wait