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
      
      console.log(`Encontrados ${misTickets.length} tickets creados por el usuario`);
      mostrarMisTickets(misTickets);
    } else {
      mostrarError('Error al cargar tickets');
    }
  } catch (error) {
    console.error('Error al cargar tickets:', error);
    mostrarError('No se pudo conectar con el servidor');
  }
}

function mostrarMisTickets(tickets) {
  const tableBody = document.getElementById('myTicketsTableBody');
  
  if (!tableBody) return;
  
  tableBody.innerHTML = '';
  
  if (tickets.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="no-tickets">
          <div class="empty-state">
            <i class="fas fa-inbox"></i>
            <p>No has creado tickets aún</p>
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
    
    // Contar mensajes no leídos (esto se puede mejorar con una propiedad en el backend)
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

function mostrarError(mensaje) {
  const tableBody = document.getElementById('myTicketsTableBody');
  if (tableBody) {
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
}

// --- FUNCIONES DEL CHAT ---
async function abrirChat(ticket) {
  ticketActualChat = ticket;
  const modal = document.getElementById('chatModal');
  
  // Configurar información del ticket
  document.getElementById('chatTicketId').textContent = `#${ticket.Number}`;
  document.getElementById('chatTituloTicket').textContent = ticket.Title;
  
  const estado = ticket.Status || 'Open';
  const estadoClass = estado.toLowerCase().replace(' ', '-');
  document.getElementById('chatEstado').innerHTML = `<span class="status-badge status-${estadoClass}">${estado}</span>`;
  
  const asignado = ticket.AssignedTo ? 'Asignado a soporte' : 'Sin asignar';
  document.getElementById('chatAsignado').textContent = asignado;
  
  // Limpiar input
  document.getElementById('chatInput').value = '';
  
  // Cargar mensajes
  await cargarMensajesChat(ticket.Number);
  
  // Configurar botón de envío
  document.getElementById('btnEnviarMensaje').onclick = () => enviarMensajeChat();
  
  // Permitir enviar con Enter (Shift+Enter para nueva línea)
  document.getElementById('chatInput').onkeydown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviarMensajeChat();
    }
  };
  
  // Mostrar modal
  modal.style.display = 'block';
  document.body.style.overflow = 'hidden';
  
  // Enfocar en el input
  setTimeout(() => {
    document.getElementById('chatInput').focus();
  }, 100);
  
  // Iniciar actualización automática cada 5 segundos
  if (intervaloActualizacion) {
    clearInterval(intervaloActualizacion);
  }
  intervaloActualizacion = setInterval(() => {
    cargarMensajesChat(ticket.Number, true);
  }, 5000);
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
  
  // Detener actualización automática
  if (intervaloActualizacion) {
    clearInterval(intervaloActualizacion);
    intervaloActualizacion = null;
  }
  
  ticketActualChat = null;
  
  // Recargar tickets para actualizar contadores
  const usuario = obtenerUsuarioActual();
  if (usuario) {
    cargarMisTickets(usuario);
  }
}

function obtenerUsuarioActual() {
  const usuarioStr = localStorage.getItem('usuario');
  return usuarioStr ? JSON.parse(usuarioStr) : null;
}

// Cerrar modal con click fuera o Escape
window.addEventListener('click', function(event) {
  const modal = document.getElementById('chatModal');
  if (event.target === modal) {
    cerrarModalChat();
  }
});

document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') {
    const modal = document.getElementById('chatModal');
    if (modal.style.display === 'block') {
      cerrarModalChat();
    }
  }
});
