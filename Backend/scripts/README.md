# Script de Generación de Tickets

Este script permite generar múltiples tickets de prueba en la base de datos MongoDB para el Sistema de Tickets.

## 🚀 Uso

### Generar 6000 tickets (por defecto)
```bash
cd Backend/scripts
node generateTickets.js
```

### Generar cantidad personalizada de tickets
```bash
node generateTickets.js 1000
```

### Personalizar tamaño de lote (performance)
```bash
node generateTickets.js 6000 200
```
- **Primer argumento**: Cantidad total de tickets a generar
- **Segundo argumento**: Tamaño del lote (por defecto 100)

## 📊 Características

El script genera tickets con:
- ✅ Números secuenciales automáticos (continúa desde el último ticket existente)
- ✅ Títulos y descripciones variadas
- ✅ Categorías aleatorias (10 tipos diferentes)
- ✅ Prioridades aleatorias (Low, Medium, High)
- ✅ Estados aleatorios (Open, In Progress, Closed)
- ✅ Fechas de creación distribuidas en los últimos 90 días
- ✅ Asignaciones aleatorias (70% sin asignar)

## 🎯 Categorías Incluidas

1. Soporte Técnico
2. Hardware
3. Software
4. Red
5. Impresoras
6. Accesos
7. Correo electrónico
8. Teléfono
9. Aplicaciones
10. Base de datos

## ⚙️ Requisitos

- Node.js instalado
- Archivo `.env` configurado con `MONGODB_URI`
- Dependencias instaladas (`npm install` o `bun install`)

## 💡 Notas

- El script procesa tickets en lotes para optimizar el uso de memoria
- Muestra progreso en tiempo real
- Genera estadísticas al finalizar
- No duplica números de ticket (continúa desde el último existente)
- Es seguro ejecutar múltiples veces

## 📈 Ejemplo de Salida

```
╔════════════════════════════════════════════════╗
║   Generador de Tickets - Sistema de Tickets   ║
╚════════════════════════════════════════════════╝

🔗 Conectando a MongoDB...
✅ Conectado a MongoDB Atlas
📊 Último ticket en DB: #150
🎯 Generando 6000 tickets desde el número 151...
📦 Procesando en lotes de 100 tickets

✅ Lote 1/60 completado | Tickets: 100/6000 (1.7%)
✅ Lote 2/60 completado | Tickets: 200/6000 (3.3%)
...
✅ Lote 60/60 completado | Tickets: 6000/6000 (100.0%)

🎉 ¡Proceso completado exitosamente!
📊 Total de tickets generados: 6000
🔢 Rango de números: #151 a #6150

📈 Estadísticas por estado:
   - Open: 2034 tickets
   - In Progress: 1998 tickets
   - Closed: 1968 tickets

🔌 Conexión a MongoDB cerrada

✨ Script finalizado correctamente
```

## 🧹 Limpiar Tickets de Prueba

Si necesitas eliminar todos los tickets de prueba, puedes usar la ruta de debug:

```bash
curl -X DELETE http://localhost:5000/tickets/debug/clear
```

**⚠️ PRECAUCIÓN**: Esto eliminará TODOS los tickets de la base de datos.
