// --- VARIABLES GLOBALES ---
let ticketActualChat = null;
let intervaloActualizacion = null;

// --- LÓGICA PRINCIPAL AL CARGAR LA PÁGINA ---
document.addEventListener('DOMContentLoaded', () => {
  const usuario = inicializarAuth('my-tickets');
  
  if (usuario) {
    console.log('Usuario autenticado:', usuario);
    cargarMisTickets(usuario);
  } else {
    console.error('No se pudo autenticar el usuario');
  }
});

// --- CARGA DE TICKETS CREADOS POR EL USUARIO ---
async function cargarMisTickets(usuario) {
  try {
    const userName = usuario.nombre || usuario.username;
    console.log('Cargando tickets creados por:', userName);
    
    const response = await fetch('/tickets');
    
    if (response.ok) {
      const tickets = await response.json();
      
      // Filtrar tickets creados por el usuario actual
      const misTickets = tickets.filter(ticket => 
        ticket.usuario_nombre === userName
      );
      
      // Separar tickets activos y resueltos
      const ticketsActivos = misTickets.filter(ticket => {
        const estado = (ticket.Status || '').toLowerCase();
        return !['closed', 'cerrado', 'resolved'].includes(estado);
      });
      
      const ticketsResueltos = misTickets.filter(ticket => {
        const estado = (ticket.Status || '').toLowerCase();
        return ['closed', 'cerrado', 'resolved'].includes(estado);
      });
      
      console.log(`Encontrados ${ticketsActivos.length} tickets activos y ${ticketsResueltos.length} resueltos`);
      
      mostrarTicketsActivos(ticketsActivos);
      mostrarTicketsResueltos(ticketsResueltos);
      
      // Actualizar contadores
      document.getElementById('activeCount').textContent = ticketsActivos.length;
      document.getElementById('resolvedCount').textContent = ticketsResueltos.length;
      
    } else {
      mostrarError('Error al cargar tickets');
    }
  } catch (error) {
    console.error('Error al cargar tickets:', error);
    mostrarError('No se pudo conectar con el servidor');
  }
}

function mostrarTicketsActivos(tickets) {
  const tableBody = document.getElementById('activeTicketsTableBody');
  
  if (!tableBody) return;
  
  tableBody.innerHTML = '';
  
  if (tickets.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="no-tickets">
          <div class="empty-state">
            <i class="fas fa-check-double"></i>
            <p>No tienes tickets activos</p>
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
    const asignadoA = ticket.AssignedTo ? 'Asignado' : 'Sin asignar';
    
    const estadoClass = estado.toLowerCase().replace(' ', '-');
    const prioridadClass = prioridad.toLowerCase();
    
    const mensajesNoLeidos = ticket.comentarios?.length || 0;
    
    fila.innerHTML = `
      <td class="ticket-id">#${ticket.Number}</td>
      <td class="ticket-title">
        ${ticket.Title}
        ${mensajesNoLeidos > 0 ? `<span class="badge-notification">${mensajesNoLeidos}</span>` : ''}
      </td>
      <td><span class="status-badge status-${estadoClass}">${estado}</span></td>
      <td><span class="priority-badge priority-${prioridadClass}">${prioridad}</span></td>
      <td>${asignadoA}</td>
      <td class="ticket-date">${fecha}</td>
      <td class="ticket-actions">
        <button class="btn btn-sm btn-primary" onclick='abrirChat(${JSON.stringify(ticket).replace(/'/g, "&#39;")})'>
          <i class="fas fa-comments"></i>
          Chat
        </button>
      </td>
    `;
    
    tableBody.appendChild(fila);
  });
}

function mostrarTicketsResueltos(tickets) {
  const tableBody = document.getElementById('resolvedTicketsTableBody');
  
  if (!tableBody) return;
  
  tableBody.innerHTML = '';
  
  if (tickets.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="no-tickets">
          <div class="empty-state">
            <i class="fas fa-inbox"></i>
            <p>No tienes tickets resueltos aún</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }
  
  tickets.forEach(ticket => {
    const fila = document.createElement('tr');
    fila.className = 'ticket-row';
    
    const fechaCreacion = new Date(ticket.CreatedAt).toLocaleDateString('es-ES');
    const fechaResolucion = new Date(ticket.UpdatedAt).toLocaleDateString('es-ES');
    const estado = ticket.Status || 'Closed';
    const prioridad = ticket.Priority || 'Medium';
    
    const estadoClass = estado.toLowerCase().replace(' ', '-');
    const prioridadClass = prioridad.toLowerCase();
    
    fila.innerHTML = `
      <td class="ticket-id">#${ticket.Number}</td>
      <td class="ticket-title">${ticket.Title}</td>
      <td><span class="status-badge status-${estadoClass}">${estado}</span></td>
      <td><span class="priority-badge priority-${prioridadClass}">${prioridad}</span></td>
      <td class="ticket-date">${fechaCreacion}</td>
      <td class="ticket-date">${fechaResolucion}</td>
      <td class="ticket-actions">
        <button class="btn btn-sm btn-secondary" onclick='verConversacion(${JSON.stringify(ticket).replace(/'/g, "&#39;")})'>
          <i class="fas fa-eye"></i>
          Ver
        </button>
      </td>
    `;
    
    tableBody.appendChild(fila);
  });
}

function mostrarError(mensaje) {
  const activeTableBody = document.getElementById('activeTicketsTableBody');
  const resolvedTableBody = document.getElementById('resolvedTicketsTableBody');
  
  const errorHTML = `
    <tr>
      <td colspan="7" class="error-message">
        <div class="error-state">
          <i class="fas fa-exclamation-triangle"></i>
          <p>${mensaje}</p>
        </div>
      </td>
    </tr>
  `;
  
  if (activeTableBody) activeTableBody.innerHTML = errorHTML;
  if (resolvedTableBody) resolvedTableBody.innerHTML = errorHTML;
}

// --- FUNCIONES DEL CHAT (TICKETS ACTIVOS) ---
async function abrirChat(ticket) {
  ticketActualChat = ticket;
  const modal = document.getElementById('chatModal');
  
  document.getElementById('chatTicketId').textContent = `#${ticket.Number}`;
  document.getElementById('chatTituloTicket').textContent = ticket.Title;
  
  const estado = ticket.Status || 'Open';
  const estadoClass = estado.toLowerCase().replace(' ', '-');
  document.getElementById('chatEstado').innerHTML = `<span class="status-badge status-${estadoClass}">${estado}</span>`;
  
  const asignado = ticket.AssignedTo ? 'Asignado a soporte' : 'Sin asignar';
  document.getElementById('chatAsignado').textContent = asignado;
  
  configurarBotonCerrarTicket(estado);
  
  document.getElementById('chatInput').value = '';
  
  await cargarMensajesChat(ticket.Number);
  
  document.getElementById('btnEnviarMensaje').onclick = () => enviarMensajeChat();
  
  document.getElementById('chatInput').onkeydown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviarMensajeChat();
    }
  };
  
  modal.style.display = 'block';
  document.body.style.overflow = 'hidden';
  
  setTimeout(() => {
    document.getElementById('chatInput').focus();
  }, 100);
  
  if (intervaloActualizacion) {
    clearInterval(intervaloActualizacion);
  }
  intervaloActualizacion = setInterval(() => {
    cargarMensajesChat(ticket.Number, true);
  }, 5000);
}

// --- FUNCIÓN PARA VER CONVERSACIÓN DE TICKETS RESUELTOS ---
async function verConversacion(ticket) {
  const modal = document.getElementById('viewResolvedModal');
  
  document.getElementById('viewTicketId').textContent = `#${ticket.Number}`;
  document.getElementById('viewTituloTicket').textContent = ticket.Title;
  
  const estado = ticket.Status || 'Closed';
  const estadoClass = estado.toLowerCase().replace(' ', '-');
  document.getElementById('viewEstado').innerHTML = `<span class="status-badge status-${estadoClass}">${estado}</span>`;
  
  await cargarMensajesResueltos(ticket.Number);
  
  modal.style.display = 'block';
  document.body.style.overflow = 'hidden';
}

async function cargarMensajesResueltos(ticketNumber) {
  try {
    const response = await fetch(`/tickets/${ticketNumber}/comentarios`);
    
    if (response.ok) {
      const data = await response.json();
      const comentarios = data.comentarios || [];
      mostrarMensajesResueltos(comentarios);
    } else {
      console.error('Error al cargar mensajes');
    }
  } catch (error) {
    console.error('Error al cargar mensajes:', error);
  }
}

function mostrarMensajesResueltos(comentarios) {
  const chatContainer = document.getElementById('viewMessages');
  const usuario = obtenerUsuarioActual();
  const userName = usuario.nombre || usuario.username;
  
  if (comentarios.length === 0) {
    chatContainer.innerHTML = `
      <div class="chat-empty">
        <i class="fas fa-comments-slash"></i>
        <p>No hubo conversación en este ticket.</p>
      </div>
    `;
    return;
  }
  
  chatContainer.innerHTML = comentarios.map(comentario => {
    const esMio = comentario.usuario === userName;
    const fecha = new Date(comentario.fecha).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    return `
      <div class="chat-message ${esMio ? 'chat-message-own' : 'chat-message-other'}">
        <div class="message-header">
          <strong>${comentario.usuario}</strong>
          <span class="message-time">${fecha}</span>
        </div>
        <div class="message-content">${comentario.texto}</div>
      </div>
    `;
  }).join('');
  
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function cerrarModalViewResolved() {
  const modal = document.getElementById('viewResolvedModal');
  modal.style.display = 'none';
  document.body.style.overflow = 'auto';
}

function configurarBotonCerrarTicket(estado) {
  const btnCerrar = document.getElementById('btnCerrarTicket');
  const actionsBar = document.getElementById('chatActionsBar');
  const chatFooter = document.getElementById('chatFooter');
  
  const estadoNormalizado = estado.toLowerCase().replace(' ', '-');
  
  if (estadoNormalizado === 'closed' || estadoNormalizado === 'cerrado' || estadoNormalizado === 'resolved') {
    actionsBar.innerHTML = `
      <div class="ticket-closed-message">
        <i class="fas fa-check-circle"></i>
        <span>Este ticket ha sido marcado como resuelto</span>
      </div>
    `;
    
    // Ocultar el área de entrada de chat
    const chatInputContainer = chatFooter.querySelector('.chat-input-container');
    if (chatInputContainer) {
      chatInputContainer.style.display = 'none';
    }
  } else {
    actionsBar.innerHTML = `
      <button class="btn btn-success btn-sm" id="btnCerrarTicket" onclick="cerrarTicket()">
        <i class="fas fa-check-circle"></i>
        Marcar como Resuelto
      </button>
    `;
    
    // Mostrar el área de entrada de chat
    const chatInputContainer = chatFooter.querySelector('.chat-input-container');
    if (chatInputContainer) {
      chatInputContainer.style.display = 'flex';
    }
  }
}

async function cerrarTicket() {
  if (!ticketActualChat) {
    alert('Error: No se ha seleccionado un ticket');
    return;
  }
  
  const ticketNumber = ticketActualChat.Number;
  const estado = ticketActualChat.Status || 'Open';
  
  // Verificar si ya está cerrado
  const estadoNormalizado = estado.toLowerCase().replace(' ', '-');
  if (estadoNormalizado === 'closed' || estadoNormalizado === 'cerrado' || estadoNormalizado === 'resolved') {
    alert('Este ticket ya está cerrado');
    return;
  }
  
  // Confirmar acción
  if (!confirm('¿Estás seguro de que deseas marcar este ticket como resuelto? Esta acción cerrará el ticket.')) {
    return;
  }
  
  const btnCerrar = document.getElementById('btnCerrarTicket');
  const btnOriginal = btnCerrar.innerHTML;
  btnCerrar.disabled = true;
  btnCerrar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cerrando...';
  
  try {
    const usuario = obtenerUsuarioActual();
    
    // Actualizar estado del ticket
    const response = await fetch(`/tickets/${ticketNumber}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        Status: 'Closed',
        comentario: `Ticket cerrado por ${usuario.nombre || usuario.username}`,
        usuario_comentario: usuario.nombre || usuario.username,
        usuario_id: usuario.id || usuario._id
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al cerrar ticket');
    }
    
    const data = await response.json();
    console.log('Ticket cerrado exitosamente:', data);
    
    // Actualizar información del ticket en la variable global
    ticketActualChat.Status = 'Closed';
    
    // Actualizar UI
    document.getElementById('chatEstado').innerHTML = '<span class="status-badge status-closed">Closed</span>';
    configurarBotonCerrarTicket('Closed');
    
    // Recargar mensajes para mostrar el comentario de cierre
    await cargarMensajesChat(ticketNumber);
    
    // Mostrar notificación de éxito
    alert('✅ Ticket marcado como resuelto correctamente');
    
  } catch (error) {
    console.error('Error al cerrar ticket:', error);
    alert(`Error al cerrar el ticket: ${error.message}`);
    btnCerrar.disabled = false;
    btnCerrar.innerHTML = btnOriginal;
  }
}

async function cargarMensajesChat(ticketNumber, silencioso = false) {
  try {
    const response = await fetch(`/tickets/${ticketNumber}/comentarios`);
    
    if (response.ok) {
      const data = await response.json();
      const comentarios = data.comentarios || [];
      mostrarMensajesChat(comentarios, silencioso);
    } else {
      if (!silencioso) {
        console.error('Error al cargar mensajes');
      }
    }
  } catch (error) {
    if (!silencioso) {
      console.error('Error al cargar mensajes:', error);
    }
  }
}

function mostrarMensajesChat(comentarios, mantenerScroll = false) {
  const chatContainer = document.getElementById('chatMessages');
  const usuario = obtenerUsuarioActual();
  const userName = usuario.nombre || usuario.username;
  
  // Guardar posición del scroll antes de actualizar
  const scrollAntes = chatContainer.scrollTop;
  const scrollMax = chatContainer.scrollHeight - chatContainer.clientHeight;
  const estaAbajo = scrollAntes >= scrollMax - 50;
  
  if (comentarios.length === 0) {
    chatContainer.innerHTML = `
      <div class="chat-empty">
        <i class="fas fa-comments"></i>
        <p>No hay mensajes aún. Inicia la conversación.</p>
      </div>
    `;
    return;
  }
  
  chatContainer.innerHTML = comentarios.map(comentario => {
    const esMio = comentario.usuario === userName;
    const fecha = new Date(comentario.fecha).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    return `
      <div class="chat-message ${esMio ? 'chat-message-own' : 'chat-message-other'}">
        <div class="message-header">
          <strong>${comentario.usuario}</strong>
          <span class="message-time">${fecha}</span>
        </div>
        <div class="message-content">${comentario.texto}</div>
      </div>
    `;
  }).join('');
  
  // Restaurar o ajustar scroll
  if (mantenerScroll && !estaAbajo) {
    chatContainer.scrollTop = scrollAntes;
  } else {
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }
}

async function enviarMensajeChat() {
  const input = document.getElementById('chatInput');
  const mensaje = input.value.trim();
  const btnEnviar = document.getElementById('btnEnviarMensaje');
  
  if (!mensaje) {
    alert('Por favor, escribe un mensaje');
    return;
  }
  
  if (!ticketActualChat) {
    alert('Error: No se ha seleccionado un ticket');
    return;
  }
  
  // Deshabilitar botón
  btnEnviar.disabled = true;
  btnEnviar.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  
  try {
    const usuario = obtenerUsuarioActual();
    const ticketNumber = ticketActualChat.Number;
    
    const response = await fetch(`/tickets/${ticketNumber}/comentarios`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        texto: mensaje,
        usuario_id: usuario.id || usuario._id,
        usuario_nombre: usuario.nombre || usuario.username
      })
    });
    
    if (response.ok) {
      input.value = '';
      await cargarMensajesChat(ticketNumber);
      input.focus();
    } else {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al enviar mensaje');
    }
  } catch (error) {
    console.error('Error al enviar mensaje:', error);
    alert(`Error: ${error.message}`);
  } finally {
    btnEnviar.disabled = false;
    btnEnviar.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar';
  }
}

function cerrarModalChat() {
  const modal = document.getElementById('chatModal');
  modal.style.display = 'none';
  document.body.style.overflow = 'auto';
  
  if (intervaloActualizacion) {
    clearInterval(intervaloActualizacion);
    intervaloActualizacion = null;
  }
  
  ticketActualChat = null;
  
  const usuario = obtenerUsuarioActual();
  if (usuario) {
    cargarMisTickets(usuario);
  }
}

// Cerrar modales con click fuera o Escape
window.addEventListener('click', function(event) {
  const chatModal = document.getElementById('chatModal');
  const viewModal = document.getElementById('viewResolvedModal');
  
  if (event.target === chatModal) {
    cerrarModalChat();
  } else if (event.target === viewModal) {
    cerrarModalViewResolved();
  }
});

document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') {
    const chatModal = document.getElementById('chatModal');
    const viewModal = document.getElementById('viewResolvedModal');
    
    if (chatModal.style.display === 'block') {
      cerrarModalChat();
    } else if (viewModal.style.display === 'block') {
      cerrarModalViewResolved();
    }
  }
});
