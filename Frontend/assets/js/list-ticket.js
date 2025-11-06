// --- VARIABLES GLOBALES ---
let ticketActual = null;
let ticketParaResponder = null;

// --- LÓGICA PRINCIPAL AL CARGAR LA PÁGINA ---
document.addEventListener('DOMContentLoaded', () => {
  const usuario = inicializarAuth('tickets');
  
  if (usuario) {
    console.log('Usuario autenticado:', usuario);
    cargarTicketsAsignados(usuario);
  } else {
    console.error('No se pudo autenticar el usuario');
  }
});

// --- CARGAR TICKETS ASIGNADOS AL USUARIO ---
async function cargarTicketsAsignados(usuario) {
  try {
    const userId = usuario.id || usuario._id;
    const userName = usuario.nombre || usuario.username;
    
    console.log('Cargando tickets asignados a:', userName, 'ID:', userId);
    
    const response = await fetch('/tickets');
    
    if (response.ok) {
      const todosLosTickets = await response.json();
      console.log('Total de tickets en el sistema:', todosLosTickets.length);
      
      // Filtrar tickets asignados al usuario actual
      const ticketsAsignados = todosLosTickets.filter(ticket => 
        ticket.AssignedTo === userId
      );
      
      console.log('Tickets asignados al usuario:', ticketsAsignados.length);
      
      // Filtrar solo tickets ACTIVOS (no cerrados ni resueltos)
      const ticketsActivos = ticketsAsignados.filter(ticket => {
        const estado = (ticket.Status || '').toLowerCase();
        const estaActivo = !['closed', 'cerrado', 'resolved'].includes(estado);
        return estaActivo;
      });
      
      console.log('Tickets activos (no cerrados):', ticketsActivos.length);
      
      mostrarTickets(ticketsActivos);
      
    } else {
      mostrarError('Error al cargar tickets');
    }
  } catch (error) {
    console.error('Error al cargar tickets:', error);
    mostrarError('No se pudo conectar con el servidor');
  }
}

function mostrarTickets(tickets) {
  const tableBody = document.getElementById('ticketsTableBody');
  
  if (!tableBody) return;
  
  tableBody.innerHTML = '';
  
  if (tickets.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="no-tickets">
          <div class="empty-state">
            <i class="fas fa-inbox"></i>
            <p>No tienes tickets asignados pendientes</p>
            <small>Los tickets cerrados o resueltos no se muestran aquí</small>
          </div>
        </td>
      </tr>
    `;
    return;
  }
  
  tickets.forEach(ticket => {
    const fila = document.createElement('tr');
    fila.className = 'ticket-row';
    
    const fecha = new Date(ticket.CreatedAt).toLocaleDateString('es-ES');
    const estado = ticket.Status || 'Open';
    const prioridad = ticket.Priority || 'Medium';
    const usuario = ticket.usuario_nombre || 'Desconocido';
    
    const estadoClass = estado.toLowerCase().replace(' ', '-');
    const prioridadClass = prioridad.toLowerCase();
    
    fila.innerHTML = `
      <td class="ticket-id">#${ticket.Number}</td>
      <td class="ticket-title">${ticket.Title}</td>
      <td><span class="status-badge status-${estadoClass}">${estado}</span></td>
      <td><span class="priority-badge priority-${prioridadClass}">${prioridad}</span></td>
      <td>${usuario}</td>
      <td class="ticket-date">${fecha}</td>
      <td class="ticket-actions">
        <button class="btn btn-sm btn-primary" onclick='verDetalleTicket(${JSON.stringify(ticket).replace(/'/g, "&#39;")})'>
          <i class="fas fa-eye"></i>
          Ver
        </button>
        <button class="btn btn-sm btn-success" onclick='abrirModalRespuesta(${JSON.stringify(ticket).replace(/'/g, "&#39;")})'>
          <i class="fas fa-reply"></i>
          Atender
        </button>
      </td>
    `;
    
    tableBody.appendChild(fila);
  });
}

function mostrarError(mensaje) {
  const tableBody = document.getElementById('ticketsTableBody');
  
  if (!tableBody) return;
  
  tableBody.innerHTML = `
    <tr>
      <td colspan="7" class="error-message">
        <div class="error-state">
          <i class="fas fa-exclamation-triangle"></i>
          <p>${mensaje}</p>
        </div>
      </td>
    </tr>
  `;
}

// --- VER DETALLE DEL TICKET ---
function verDetalleTicket(ticket) {
  ticketActual = ticket;
  
  document.getElementById('detalleTicketId').textContent = `#${ticket.Number}`;
  document.getElementById('detalleTitulo').textContent = ticket.Title;
  
  const estado = ticket.Status || 'Open';
  const estadoClass = estado.toLowerCase().replace(' ', '-');
  document.getElementById('detalleEstado').innerHTML = `<span class="status-badge status-${estadoClass}">${estado}</span>`;
  
  const prioridad = ticket.Priority || 'Medium';
  const prioridadClass = prioridad.toLowerCase();
  document.getElementById('detallePrioridad').innerHTML = `<span class="priority-badge priority-${prioridadClass}">${prioridad}</span>`;
  
  document.getElementById('detalleCategoria').textContent = ticket.categoria || '-';
  document.getElementById('detalleUsuario').textContent = ticket.usuario_nombre || '-';
  
  const fecha = new Date(ticket.CreatedAt).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  document.getElementById('detalleFecha').textContent = fecha;
  
  document.getElementById('detalleDescripcion').textContent = ticket.Description || '-';
  
  // Mostrar archivo si existe
  const archivoSection = document.getElementById('detalleArchivo');
  if (ticket.archivo_path && ticket.archivo_nombre_original) {
    archivoSection.innerHTML = `
      <h4>Archivo Adjunto</h4>
      <div class="archivo-info">
        <i class="fas fa-paperclip"></i>
        <div>
          <strong>${ticket.archivo_nombre_original}</strong>
          <br>
          <small>${formatFileSize(ticket.archivo_size || 0)}</small>
        </div>
        <a href="/tickets/${ticket._id}/archivo" class="btn btn-sm btn-secondary" download>
          <i class="fas fa-download"></i>
          Descargar
        </a>
      </div>
    `;
  } else {
    archivoSection.innerHTML = '<p><em>Sin archivo adjunto</em></p>';
  }
  
  // Mostrar comentarios
  mostrarComentariosDetalle(ticket.comentarios || []);
  
  // Configurar botón de atender
  const btnAtender = document.getElementById('btnAtenderDesdeDetalle');
  btnAtender.onclick = () => {
    cerrarModalDetalle();
    abrirModalRespuesta(ticket);
  };
  
  // Abrir modal
  document.getElementById('detalleTicketModal').style.display = 'block';
  document.body.style.overflow = 'hidden';
}

function mostrarComentariosDetalle(comentarios) {
  const container = document.getElementById('detalleComentarios');
  
  if (!comentarios || comentarios.length === 0) {
    container.innerHTML = '<p class="no-comments">No hay comentarios aún</p>';
    return;
  }
  
  container.innerHTML = comentarios.map(comentario => {
    const fecha = new Date(comentario.fecha).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    return `
      <div class="comentario-item">
        <div class="comentario-header">
          <strong>${comentario.usuario}</strong>
          <span class="comentario-fecha">${fecha}</span>
        </div>
        <div class="comentario-texto">${comentario.texto}</div>
      </div>
    `;
  }).join('');
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function cerrarModalDetalle() {
  document.getElementById('detalleTicketModal').style.display = 'none';
  document.body.style.overflow = 'auto';
  ticketActual = null;
}

// --- ATENDER TICKET (RESPONDER) ---
function abrirModalRespuesta(ticket) {
  ticketParaResponder = ticket;
  
  document.getElementById('respuestaTicketId').textContent = `#${ticket.Number}`;
  document.getElementById('respuestaTituloTicket').textContent = ticket.Title;
  
  // Limpiar campos
  document.getElementById('respuestaTexto').value = '';
  
  // Establecer estado actual o "En Progreso" por defecto
  const estadoActual = ticket.Status || 'Open';
  const selectEstado = document.getElementById('nuevoEstado');
  
  // Si el ticket está "Open", seleccionar "En Progreso" por defecto
  if (estadoActual.toLowerCase() === 'open') {
    selectEstado.value = 'In Progress';
  } else {
    selectEstado.value = estadoActual;
  }
  
  // Configurar botón de envío
  document.getElementById('btnEnviarRespuesta').onclick = () => enviarRespuesta();
  
  // Abrir modal
  document.getElementById('respuestaTicketModal').style.display = 'block';
  document.body.style.overflow = 'hidden';
  
  // Focus en textarea
  setTimeout(() => {
    document.getElementById('respuestaTexto').focus();
  }, 100);
}

async function enviarRespuesta() {
  const respuestaTexto = document.getElementById('respuestaTexto').value.trim();
  const nuevoEstado = document.getElementById('nuevoEstado').value;
  const btnEnviar = document.getElementById('btnEnviarRespuesta');
  
  if (!respuestaTexto) {
    alert('Por favor, escribe una respuesta antes de enviar');
    return;
  }
  
  if (!ticketParaResponder) {
    alert('Error: No se ha seleccionado un ticket');
    return;
  }
  
  // Deshabilitar botón
  btnEnviar.disabled = true;
  btnEnviar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
  
  try {
    const usuario = obtenerUsuarioActual();
    const ticketNumber = ticketParaResponder.Number;
    
    // Actualizar ticket con respuesta y nuevo estado
    const response = await fetch(`/tickets/${ticketNumber}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        Status: nuevoEstado,
        comentario: respuestaTexto,
        usuario_comentario: usuario.nombre || usuario.username,
        usuario_id: usuario.id || usuario._id
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al enviar respuesta');
    }
    
    const data = await response.json();
    console.log('Respuesta enviada exitosamente:', data);
    
    // Mostrar mensaje de éxito
    alert('✅ Respuesta enviada exitosamente');
    
    // Cerrar modal
    cerrarModalRespuesta();
    
    // Recargar tickets
    const usuarioActual = obtenerUsuarioActual();
    if (usuarioActual) {
      cargarTicketsAsignados(usuarioActual);
    }
    
  } catch (error) {
    console.error('Error al enviar respuesta:', error);
    alert(`Error: ${error.message}`);
  } finally {
    btnEnviar.disabled = false;
    btnEnviar.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Respuesta';
  }
}

function obtenerUsuarioActual() {
  const usuarioStr = localStorage.getItem('usuario');
  return usuarioStr ? JSON.parse(usuarioStr) : null;
}

function cerrarModalRespuesta() {
  document.getElementById('respuestaTicketModal').style.display = 'none';
  document.body.style.overflow = 'auto';
  ticketParaResponder = null;
}

// Cerrar modales con click fuera o Escape
window.addEventListener('click', function(event) {
  const detalleModal = document.getElementById('detalleTicketModal');
  const respuestaModal = document.getElementById('respuestaTicketModal');
  
  if (event.target === detalleModal) {
    cerrarModalDetalle();
  } else if (event.target === respuestaModal) {
    cerrarModalRespuesta();
  }
});

document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') {
    const detalleModal = document.getElementById('detalleTicketModal');
    const respuestaModal = document.getElementById('respuestaTicketModal');
    
    if (detalleModal.style.display === 'block') {
      cerrarModalDetalle();
    } else if (respuestaModal.style.display === 'block') {
      cerrarModalRespuesta();
    }
  }
});