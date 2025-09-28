// --- LÓGICA PRINCIPAL AL CARGAR LA PÁGINA ---
document.addEventListener('DOMContentLoaded', () => {
  // Inicializar autenticación y UI
  const usuario = inicializarAuth('dashboard');
  
  if (usuario) {
    // 2. Inicializar eventos específicos del dashboard
    cargarTickets();
    cargarEstadisticas();
    inicializarModal();
    
    // 3. Verificar si hay un ticket para atender
    verificarTicketParaAtender();
  }
});

// --- CARGA Y MANEJO DE TICKETS ---

async function cargarTickets() {
  try {
    console.log('Intentando cargar tickets desde backend...');
    // Intentar cargar desde backend
    const response = await fetch('http://localhost:3000/tickets');
    
    if (response.ok) {
      const tickets = await response.json();
      console.log('✅ Tickets cargados desde backend:', tickets.length, 'tickets encontrados');
      console.log('Primeros tickets:', tickets.slice(0, 3));
      
      mostrarTickets(tickets);
      actualizarEstadisticas(tickets);
      
      // Limpiar tickets locales si hay tickets del servidor
      if (tickets.length > 0) {
        const ticketsLocales = JSON.parse(localStorage.getItem('tickets')) || [];
        const ticketsLocalesReales = ticketsLocales.filter(t => !t.local);
        if (ticketsLocalesReales.length === 0 && ticketsLocales.length > 0) {
          console.log('Limpiando tickets de ejemplo locales...');
          localStorage.removeItem('tickets');
        }
      }
      
      return;
    } else {
      console.error('Error en respuesta del servidor:', response.status, response.statusText);
    }
    
  } catch (error) {
    console.error('❌ Error al conectar con backend:', error);
  }
  
  // Si no hay conexión, usar datos locales
  console.log('📁 Usando datos locales...');
  const ticketsLocales = JSON.parse(localStorage.getItem('tickets')) || [];
  
  // Si no hay tickets locales, crear ejemplos
  if (ticketsLocales.length === 0) {
    console.log('Creando tickets de ejemplo...');
    const ticketsEjemplo = crearTicketsEjemplo();
    localStorage.setItem('tickets', JSON.stringify(ticketsEjemplo));
    mostrarTickets(ticketsEjemplo);
    actualizarEstadisticas(ticketsEjemplo);
  } else {
    console.log('Mostrando', ticketsLocales.length, 'tickets locales');
    mostrarTickets(ticketsLocales);
    actualizarEstadisticas(ticketsLocales);
  }
}

function mostrarTickets(tickets) {
  const lista = document.getElementById('listaTickets');
  
  if (!lista) return;
  
  if (tickets.length === 0) {
    lista.innerHTML = '<p>No hay tickets disponibles. ¡Crea el primero!</p>';
    return;
  }
  
  lista.innerHTML = tickets.map(ticket => {
    const fecha = new Date(ticket.CreatedAt || ticket.fecha_creacion).toLocaleDateString('es-ES');
    const estado = (ticket.Status || ticket.estado || 'Open').toLowerCase();
    const prioridad = (ticket.Priority || ticket.prioridad || 'Medium').toLowerCase();
    
    // Indicador de archivo adjunto
    const tieneArchivo = ticket.archivo_path ? '<i class="fas fa-paperclip" title="Archivo adjunto"></i>' : '';
    
    // Información del archivo (mostrar nombre original si existe)
    const infoArchivo = ticket.archivo_nombre_original 
      ? `<small><i class="fas fa-file"></i> ${ticket.archivo_nombre_original}</small>` 
      : ticket.archivo_nombre 
        ? `<small><i class="fas fa-file"></i> ${ticket.archivo_nombre}</small>`
        : '';
    
    return `
      <div class="ticket-item">
        <div class="ticket-info">
          <h4>#${ticket.Number || ticket.id} - ${ticket.Title || ticket.titulo} ${tieneArchivo}</h4>
          <p>${(ticket.Description || ticket.descripcion).substring(0, 80)}...</p>
          <small>Por: ${ticket.usuario_nombre || 'Usuario'} - ${fecha} ${ticket.local ? '(Local)' : ''}</small>
          ${infoArchivo}
        </div>
        <div class="ticket-details">
          <span class="badge badge-${prioridad}">${prioridad}</span>
          <span class="ticket-status status-${estado}">${estado}</span>
          <button class="btn btn-sm" onclick="abrirModalTicket(${JSON.stringify(ticket).replace(/"/g, '&quot;')})">
            <i class="fas fa-eye"></i>
            Ver
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function actualizarEstadisticas(tickets) {
  const total = tickets.length;
  const pendientes = tickets.filter(t => (t.Status || t.estado) === 'Open' || (t.Status || t.estado) === 'abierto').length;
  const resueltos = tickets.filter(t => (t.Status || t.estado) === 'Closed' || (t.Status || t.estado) === 'cerrado').length;
  const altaPrioridad = tickets.filter(t => (t.Priority || t.prioridad) === 'High' || (t.Priority || t.prioridad) === 'alta').length;
  
  document.getElementById('total-tickets').textContent = total;
  document.getElementById('pendientes').textContent = pendientes;
  document.getElementById('resueltos').textContent = resueltos;
  document.getElementById('alta-prioridad').textContent = altaPrioridad;
}

function cargarEstadisticas() {
  // Esta función se ejecuta después de cargarTickets()
  // Las estadísticas se actualizan automáticamente
  actualizarEstadisticas(JSON.parse(localStorage.getItem('tickets')) || []);
}

function cerrarSesion() {
  if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
    localStorage.removeItem('usuario');
    localStorage.removeItem('token');
    window.location.href = 'auth.html';
  }
}

// --- FUNCIONES DEL MODAL ---
function inicializarModal() {
  // Cerrar modal al hacer clic fuera de él
  window.onclick = function(event) {
    const modal = document.getElementById('ticketModal');
    if (event.target == modal) {
      cerrarModal();
    }
  }
  
  // Cerrar modal con tecla Escape
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
      cerrarModal();
    }
  });
}

function abrirModalTicket(ticket) {
  const modal = document.getElementById('ticketModal');
  const fecha = new Date(ticket.CreatedAt || ticket.fecha_creacion).toLocaleString('es-ES');
  const estado = ticket.Status || ticket.estado || 'Open';
  const prioridad = ticket.Priority || ticket.prioridad || 'Medium';
  
  // Información del archivo
  let archivoInfo = '';
  if (ticket.archivo_path || ticket.archivo_nombre_original || ticket.archivo_nombre) {
    const nombreArchivo = ticket.archivo_nombre_original || ticket.archivo_nombre || 'Archivo adjunto';
    
    // Construir URL de descarga usando el backend
    let downloadUrl = '';
    if (ticket.archivo_path) {
      // Extraer solo el nombre del archivo de la ruta completa
      const fileName = ticket.archivo_path.split('/').pop() || ticket.archivo_path.split('\\').pop();
      downloadUrl = `http://localhost:3000/uploads/${fileName}`;
    }
    
    archivoInfo = `
      <div class="archivo-info">
        <i class="fas fa-paperclip"></i>
        <span>${nombreArchivo}</span>
        ${downloadUrl ? `
          <button onclick="descargarArchivo('${downloadUrl}', '${nombreArchivo}')" class="btn btn-sm btn-secondary">
            <i class="fas fa-download"></i> Descargar
          </button>
        ` : ''}
      </div>
    `;
  }
  
  document.getElementById('modalTicketId').textContent = `#${ticket.Number || ticket.id}`;
  document.getElementById('modalTitulo').textContent = ticket.Title || ticket.titulo;
  document.getElementById('modalDescripcion').textContent = ticket.Description || ticket.descripcion;
  document.getElementById('modalUsuario').textContent = ticket.usuario_nombre || 'Usuario';
  document.getElementById('modalFecha').textContent = fecha;
  document.getElementById('modalEstado').innerHTML = `<span class="ticket-status status-${estado.toLowerCase()}">${estado}</span>`;
  document.getElementById('modalPrioridad').innerHTML = `<span class="badge badge-${prioridad.toLowerCase()}">${prioridad}</span>`;
  document.getElementById('modalCategoria').textContent = ticket.categoria || 'Sin categoría';
  document.getElementById('modalArchivo').innerHTML = archivoInfo;
  
  // Configurar botón de atender con el ticket current
  document.getElementById('btnAtender').onclick = () => abrirModalAtender(ticket);
  
  modal.style.display = 'block';
  document.body.style.overflow = 'hidden'; // Prevenir scroll en el fondo
}

// --- FUNCIONES DEL MODAL DE ATENCIÓN ---
async function abrirModalAtender(ticket) {
  const modalAtender = document.getElementById('atenderModal');
  
  // Cargar datos actuales del ticket
  document.getElementById('ticketIdAtender').textContent = `#${ticket.Number || ticket.id}`;
  document.getElementById('tituloTicketAtender').textContent = ticket.Title || ticket.titulo;
  
  // Configurar valores actuales (usando los valores exactos del schema)
  document.getElementById('prioridadSelect').value = ticket.Priority || 'Medium';
  document.getElementById('estadoSelect').value = ticket.Status || 'Open';
  document.getElementById('comentarioTicket').value = '';
  
  // Cargar usuarios disponibles
  await cargarUsuariosDisponibles();
  
  // Seleccionar usuario asignado actual si existe
  const usuarioAsignado = ticket.AssignedTo || ticket.assigned_to;
  if (usuarioAsignado) {
    document.getElementById('usuarioSelect').value = usuarioAsignado;
  }
  
  // Guardar referencia del ticket actual
  window.ticketActual = ticket;
  
  modalAtender.style.display = 'block';
}

async function cargarUsuariosDisponibles() {
  const select = document.getElementById('usuarioSelect');
  
  try {
    // Intentar cargar usuarios desde backend
    const response = await fetch('http://localhost:3000/users');
    
    if (response.ok) {
      const usuarios = await response.json();
      console.log('Usuarios cargados:', usuarios);
      
      select.innerHTML = '<option value="">Sin asignar</option>';
      usuarios.forEach(usuario => {
        select.innerHTML += `
          <option value="${usuario._id || usuario.id}">
            ${usuario.username || usuario.nombre} (${usuario.rol || 'Usuario'})
          </option>
        `;
      });
    } else {
      throw new Error('No se pudieron cargar los usuarios');
    }
    
  } catch (error) {
    console.error('Error al cargar usuarios:', error);
    
    // Opciones por defecto si no hay conexión
    select.innerHTML = `
      <option value="">Sin asignar</option>
      <option value="admin">Administrador</option>
      <option value="soporte">Soporte Técnico</option>
    `;
  }
}

async function guardarCambiosTicket() {
  const ticket = window.ticketActual;
  if (!ticket) {
    alert('Error: No hay ticket seleccionado');
    return;
  }
  
  // Obtener información del usuario actual
  const usuarioActual = JSON.parse(localStorage.getItem('usuario'));
  
  const datosActualizados = {
    Priority: document.getElementById('prioridadSelect').value,
    Status: document.getElementById('estadoSelect').value,
    AssignedTo: document.getElementById('usuarioSelect').value || null,
    comentario: document.getElementById('comentarioTicket').value.trim(),
    usuario_comentario: usuarioActual?.username || 'Usuario desconocido',
    usuario_id: usuarioActual?.id || null
  };
  
  console.log('=== DEBUG ACTUALIZACIÓN TICKET ===');
  console.log('Ticket actual:', ticket);
  console.log('Número del ticket:', ticket.Number || ticket.id);
  console.log('Datos de actualización:', datosActualizados);
  
  try {
    const ticketId = ticket.Number || ticket.id;
    const url = `http://localhost:3000/tickets/${ticketId}`;
    
    console.log('URL de actualización:', url);
    
    // Intentar actualizar en backend
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(datosActualizados)
    });
    
    console.log('Status de respuesta:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('Respuesta del servidor:', result);
      
      alert('Ticket actualizado exitosamente');
      cerrarModalAtender();
      cerrarModal();
      cargarTickets();
      
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error del servidor:', errorData);
      
      // Si es 404, mostrar información adicional
      if (response.status === 404) {
        let mensajeError = `Ticket #${ticketId} no encontrado en el servidor.`;
        if (errorData.ticketsDisponibles) {
          mensajeError += '\n\nTickets disponibles:';
          errorData.ticketsDisponibles.forEach(t => {
            mensajeError += `\n- #${t.number}: ${t.title}`;
          });
        }
        throw new Error(mensajeError);
      }
      
      throw new Error(errorData.message || `Error del servidor: ${response.status}`);
    }
    
  } catch (error) {
    console.error('Error al actualizar ticket:', error);
    
    // Mostrar error más específico
    if (error.message.includes('Failed to fetch')) {
      alert('No se puede conectar al servidor. Verifique su conexión.');
    } else if (error.message.includes('no encontrado')) {
      alert(`${error.message}\n\nEsto puede ocurrir si el ticket es de ejemplo local y no existe en la base de datos del servidor.`);
    } else {
      alert(`Error al actualizar el ticket: ${error.message}`);
    }
    
    // Solo actualizar localmente si no es un error 404
    if (!error.message.includes('no encontrado')) {
      actualizarTicketLocal(datosActualizados);
      alert('Ticket actualizado localmente como respaldo');
    }
    
    cerrarModalAtender();
    cerrarModal();
    cargarTickets();
  }
}

function actualizarTicketLocal(datosActualizados) {
  const tickets = JSON.parse(localStorage.getItem('tickets')) || [];
  const ticket = window.ticketActual;
  
  const indice = tickets.findIndex(t => 
    (t.Number || t.id).toString() === (ticket.Number || ticket.id).toString()
  );
  
  if (indice !== -1) {
    // Actualizar propiedades
    if (datosActualizados.Priority) {
      tickets[indice].Priority = datosActualizados.Priority;
      tickets[indice].prioridad = datosActualizados.Priority; // Compatibilidad
    }
    
    if (datosActualizados.Status) {
      tickets[indice].Status = datosActualizados.Status;
      tickets[indice].estado = datosActualizados.Status; // Compatibilidad
    }
    
    if (datosActualizados.AssignedTo !== undefined) {
      tickets[indice].AssignedTo = datosActualizados.AssignedTo;
      tickets[indice].assigned_to = datosActualizados.AssignedTo; // Compatibilidad
    }
    
    // Agregar comentario si existe
    if (datosActualizados.comentario) {
      if (!tickets[indice].comentarios) {
        tickets[indice].comentarios = [];
      }
      tickets[indice].comentarios.push({
        texto: datosActualizados.comentario,
        fecha: new Date().toISOString(),
        usuario: datosActualizados.usuario_comentario || 'Usuario',
        usuario_id: datosActualizados.usuario_id
      });
    }
    
    // Actualizar fecha de modificación
    tickets[indice].UpdatedAt = new Date().toISOString();
    
    localStorage.setItem('tickets', JSON.stringify(tickets));
    console.log('Ticket actualizado localmente:', tickets[indice]);
  }
}

function cerrarModalAtender() {
  const modalAtender = document.getElementById('atenderModal');
  modalAtender.style.display = 'none';
  window.ticketActual = null;
}

function cerrarModal() {
  const modal = document.getElementById('ticketModal');
  modal.style.display = 'none';
  document.body.style.overflow = 'auto'; // Restaurar scroll
}

// Función para manejar la descarga de archivos
async function descargarArchivo(url, nombreArchivo) {
  try {
    console.log('Intentando descargar:', url);
    
    // Primero verificar si el backend está disponible
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    // Crear un blob con el contenido del archivo
    const blob = await response.blob();
    
    // Crear un enlace temporal para la descarga
    const link = document.createElement('a');
    const objectUrl = URL.createObjectURL(blob);
    
    link.href = objectUrl;
    link.download = nombreArchivo;
    link.style.display = 'none';
    
    // Agregar al DOM, hacer clic y remover
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Limpiar la URL del objeto
    URL.revokeObjectURL(objectUrl);
    
  } catch (error) {
    console.error('Error al descargar archivo:', error);
    
    // Si falla la descarga desde el backend, mostrar mensaje informativo
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      alert('El servidor no está disponible. No se puede descargar el archivo en este momento.');
    } else if (error.message.includes('404')) {
      alert('El archivo no se encontró en el servidor. Puede haber sido movido o eliminado.');
    } else {
      alert(`Error al descargar el archivo: ${error.message}`);
    }
  }
}

// --- FUNCIONES DE EJEMPLO (PARA DESARROLLO) ---
function crearTicketsEjemplo() {
  const ejemplo = [];
  for (let i = 1; i <= 10; i++) {
    ejemplo.push({
      id: i,
      Number: i, // Usar números simples en lugar de strings
      Title: `Ticket de ejemplo ${i}`,
      Description: 'Este es un ticket de ejemplo para propósitos de demostración. Los tickets de ejemplo no existen en el servidor.',
      Status: i % 2 === 0 ? 'Closed' : 'Open',
      Priority: i % 3 === 0 ? 'High' : 'Medium',
      CreatedAt: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
      usuario_nombre: `Usuario ${i}`,
      categoria: i % 2 === 0 ? 'Soporte' : 'Ventas',
      archivo_nombre: i % 5 === 0 ? 'informe.pdf' : null,
      archivo_path: i % 5 === 0 ? '/uploads/informe.pdf' : null,
      local: true // Marcar como ticket local de ejemplo
    });
  }
  return ejemplo;
}

// --- FUNCIONES AUXILIARES ---
function verificarTicketParaAtender() {
  const ticketParaAtender = localStorage.getItem('ticketParaAtender');
  
  if (ticketParaAtender) {
    try {
      const ticket = JSON.parse(ticketParaAtender);
      console.log('Ticket para atender encontrado:', ticket);
      
      // Limpiar localStorage
      localStorage.removeItem('ticketParaAtender');
      
      // Abrir modal después de un breve delay para asegurar que todo esté cargado
      setTimeout(() => {
        abrirModalTicket(ticket);
        // Abrir directamente el modal de atención
        setTimeout(() => {
          abrirModalAtender(ticket);
        }, 500);
      }, 1000);
      
    } catch (error) {
      console.error('Error al procesar ticket para atender:', error);
      localStorage.removeItem('ticketParaAtender');
    }
  }
}