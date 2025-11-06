// --- VARIABLES GLOBALES ---
let ticketActualChat = null;
let intervaloActualizacion = null;
let archivoSeleccionado = null;

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
    const userId = usuario.id || usuario._id;
    const rol = usuario.rol || 'Usuario';
    
    console.log('Cargando tickets para:', userName, 'con rol:', rol);
    console.log('User ID:', userId);
    
    const response = await fetch('/tickets');
    
    if (response.ok) {
      const tickets = await response.json();
      console.log('Total de tickets en el sistema:', tickets.length);
      
      let misTickets = [];
      
      // Filtrar según el rol
      if (rol === 'Usuario') {
        // Usuarios normales: solo ven tickets que crearon
        misTickets = tickets.filter(ticket => 
          ticket.usuario_nombre === userName
        );
        console.log('Usuario normal - Tickets creados:', misTickets.length);
      } else {
        // Administradores y SuperUsers: ven tickets creados + asignados
        const ticketsCreados = tickets.filter(ticket => 
          ticket.usuario_nombre === userName
        );
        
        const ticketsAsignados = tickets.filter(ticket => 
          ticket.AssignedTo === userId
        );
        
        console.log('Tickets creados por mí:', ticketsCreados.length);
        console.log('Tickets asignados a mí:', ticketsAsignados.length);
        
        // Combinar ambos arrays y eliminar duplicados
        const ticketIds = new Set();
        misTickets = [...ticketsCreados, ...ticketsAsignados].filter(ticket => {
          if (ticketIds.has(ticket._id)) {
            return false;
          }
          ticketIds.add(ticket._id);
          return true;
        });
        
        console.log('Total de tickets (creados + asignados):', misTickets.length);
      }
      
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
      
      mostrarTicketsActivos(ticketsActivos, userName, userId);
      mostrarTicketsResueltos(ticketsResueltos, userName, userId);
      
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

function mostrarTicketsActivos(tickets, userName, userId) {
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
    
    // Determinar si el ticket fue creado por mí o asignado a mí
    const esCreador = ticket.usuario_nombre === userName;
    const esAsignado = ticket.AssignedTo === userId;
    
    let asignadoTexto = 'Sin asignar';
    if (ticket.AssignedTo) {
      if (esAsignado) {
        asignadoTexto = '<span class="badge-assigned-me">Asignado a mí</span>';
      } else {
        asignadoTexto = 'Asignado';
      }
    }
    
    // Agregar badge si es un ticket asignado
    let ticketBadge = '';
    if (!esCreador && esAsignado) {
      ticketBadge = '<span class="badge-ticket-type">Asignado</span>';
    }
    
    const estadoClass = estado.toLowerCase().replace(' ', '-');
    const prioridadClass = prioridad.toLowerCase();
    
    const mensajesNoLeidos = ticket.comentarios?.length || 0;
    
    fila.innerHTML = `
      <td class="ticket-id">#${ticket.Number}</td>
      <td class="ticket-title">
        ${ticket.Title}
        ${ticketBadge}
        ${mensajesNoLeidos > 0 ? `<span class="badge-notification">${mensajesNoLeidos}</span>` : ''}
      </td>
      <td><span class="status-badge status-${estadoClass}">${estado}</span></td>
      <td><span class="priority-badge priority-${prioridadClass}">${prioridad}</span></td>
      <td>${asignadoTexto}</td>
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

function mostrarTicketsResueltos(tickets, userName, userId) {
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
    
    // Determinar si el ticket fue creado por mí o asignado a mí
    const esCreador = ticket.usuario_nombre === userName;
    const esAsignado = ticket.AssignedTo === userId;
    
    let ticketBadge = '';
    if (!esCreador && esAsignado) {
      ticketBadge = '<span class="badge-ticket-type">Asignado</span>';
    }
    
    const estadoClass = estado.toLowerCase().replace(' ', '-');
    const prioridadClass = prioridad.toLowerCase();
    
    fila.innerHTML = `
      <td class="ticket-id">#${ticket.Number}</td>
      <td class="ticket-title">
        ${ticket.Title}
        ${ticketBadge}
      </td>
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
    mostrarNotificacion('Error: No se ha seleccionado un ticket', 'error');
    return;
  }
  
  const ticketNumber = ticketActualChat.Number;
  const estado = ticketActualChat.Status || 'Open';
  
  // Verificar si ya está cerrado
  const estadoNormalizado = estado.toLowerCase().replace(' ', '-');
  if (estadoNormalizado === 'closed' || estadoNormalizado === 'cerrado' || estadoNormalizado === 'resolved') {
    mostrarNotificacion('Este ticket ya está cerrado', 'info');
    return;
  }
  
  // Confirmar acción
  const confirmar = await mostrarConfirmacion(
    '¿Estás seguro de que deseas marcar este ticket como resuelto? Esta acción cerrará el ticket.',
    {
      titulo: 'Cerrar Ticket',
      textoConfirmar: 'Sí, cerrar',
      textoCancelar: 'Cancelar',
      tipo: 'warning'
    }
  );
  
  if (!confirmar) return;
  
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
    mostrarNotificacion('✅ Ticket marcado como resuelto correctamente', 'success');
    
  } catch (error) {
    console.error('Error al cerrar ticket:', error);
    mostrarNotificacion(`Error al cerrar el ticket: ${error.message}`, 'error');
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
    
    // Construir contenido del archivo si existe
    let archivoHTML = '';
    if (comentario.archivo_nombre_original) {
      const fileName = comentario.archivo_path ? comentario.archivo_path.split('/').pop() : '';
      const downloadUrl = fileName ? `/uploads/${fileName}` : '';
      
      if (comentario.es_imagen && downloadUrl) {
        // Mostrar vista previa de imagen
        archivoHTML = `
          <div class="message-image">
            <img src="${downloadUrl}" alt="${comentario.archivo_nombre_original}" onclick="abrirImagenCompleta('${downloadUrl}', '${comentario.archivo_nombre_original}')">
          </div>
        `;
      } else if (downloadUrl) {
        // Mostrar enlace de descarga para otros archivos
        const iconClass = getFileIcon(comentario.archivo_mimetype);
        const fileSize = formatFileSize(comentario.archivo_size);
        archivoHTML = `
          <div class="message-file">
            <i class="fas ${iconClass}"></i>
            <div class="file-info">
              <span class="file-name">${comentario.archivo_nombre_original}</span>
              <span class="file-size">${fileSize}</span>
            </div>
            <a href="${downloadUrl}" download="${comentario.archivo_nombre_original}" class="btn-download">
              <i class="fas fa-download"></i>
            </a>
          </div>
        `;
      }
    }
    
    return `
      <div class="chat-message ${esMio ? 'chat-message-own' : 'chat-message-other'}">
        <div class="message-header">
          <strong>${comentario.usuario}</strong>
          <span class="message-time">${fecha}</span>
        </div>
        <div class="message-content">
          ${comentario.texto}
          ${archivoHTML}
        </div>
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

function getFileIcon(mimetype) {
  if (!mimetype) return 'fa-file';
  
  if (mimetype.includes('pdf')) return 'fa-file-pdf';
  if (mimetype.includes('word') || mimetype.includes('document')) return 'fa-file-word';
  if (mimetype.includes('image')) return 'fa-file-image';
  if (mimetype.includes('text')) return 'fa-file-alt';
  
  return 'fa-file';
}

function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

function abrirImagenCompleta(url, nombre) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.display = 'block';
  
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 90%; max-height: 90vh;">
      <div class="modal-header">
        <h2>
          <i class="fas fa-image"></i>
          ${nombre}
        </h2>
        <span class="close" onclick="this.closest('.modal').remove(); document.body.style.overflow='auto';">&times;</span>
      </div>
      <div class="modal-body" style="text-align: center; padding: 1rem;">
        <img src="${url}" alt="${nombre}" style="max-width: 100%; max-height: 70vh; object-fit: contain;">
      </div>
      <div class="modal-footer">
        <a href="${url}" download="${nombre}" class="btn btn-primary">
          <i class="fas fa-download"></i>
          Descargar
        </a>
        <button class="btn btn-secondary" onclick="this.closest('.modal').remove(); document.body.style.overflow='auto';">
          <i class="fas fa-times"></i>
          Cerrar
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
}

function handleFileSelect(event) {
  const file = event.target.files[0];
  
  if (!file) return;
  
  // Validar tamaño (10MB máximo)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    mostrarNotificacion('El archivo es demasiado grande. Máximo 10MB', 'error');
    event.target.value = '';
    return;
  }
  
  // Validar tipo de archivo
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  
  if (!allowedTypes.includes(file.type)) {
    mostrarNotificacion('Tipo de archivo no permitido. Solo se permiten: JPG, PNG, GIF, PDF, TXT, DOC, DOCX', 'error');
    event.target.value = '';
    return;
  }
  
  archivoSeleccionado = file;
  
  // Mostrar preview
  const preview = document.getElementById('filePreview');
  const previewName = document.getElementById('filePreviewName');
  
  previewName.textContent = `${file.name} (${formatFileSize(file.size)})`;
  preview.style.display = 'flex';
  
  mostrarNotificacion('Archivo seleccionado. Escribe un mensaje y presiona Enviar', 'info');
}

function removeFile() {
  archivoSeleccionado = null;
  document.getElementById('chatFileInput').value = '';
  document.getElementById('filePreview').style.display = 'none';
}

async function enviarMensajeChat() {
  const input = document.getElementById('chatInput');
  const mensaje = input.value.trim();
  const btnEnviar = document.getElementById('btnEnviarMensaje');
  
  if (!mensaje && !archivoSeleccionado) {
    mostrarNotificacion('Por favor, escribe un mensaje o selecciona un archivo', 'warning');
    return;
  }
  
  if (!ticketActualChat) {
    mostrarNotificacion('Error: No se ha seleccionado un ticket', 'error');
    return;
  }
  
  // Deshabilitar botón y botón de adjuntar
  btnEnviar.disabled = true;
  btnEnviar.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  const btnAdjuntar = document.getElementById('btnAdjuntarArchivo');
  btnAdjuntar.disabled = true;
  
  try {
    const usuario = obtenerUsuarioActual();
    const ticketNumber = ticketActualChat.Number;
    
    console.log('Enviando mensaje para ticket:', ticketNumber);
    console.log('Tiene archivo:', !!archivoSeleccionado);
    
    // Si hay archivo, usar FormData
    if (archivoSeleccionado) {
      const formData = new FormData();
      formData.append('texto', mensaje || 'Archivo adjunto');
      formData.append('usuario_id', usuario.id || usuario._id || '');
      formData.append('usuario_nombre', usuario.nombre || usuario.username || 'Usuario');
      formData.append('archivo', archivoSeleccionado);
      
      console.log('Enviando FormData con archivo:', archivoSeleccionado.name);
      
      const response = await fetch(`/tickets/${ticketNumber}/comentarios-con-archivo`, {
        method: 'POST',
        body: formData
        // NO incluir Content-Type header, el navegador lo establecerá automáticamente con boundary
      });
      
      console.log('Respuesta recibida:', response.status, response.statusText);
      
      // Intentar obtener el contenido como texto primero
      const contentType = response.headers.get('content-type');
      console.log('Content-Type de respuesta:', contentType);
      
      let data;
      const responseText = await response.text();
      console.log('Respuesta del servidor (texto):', responseText.substring(0, 200));
      
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Error al parsear JSON:', parseError);
        console.error('Respuesta completa:', responseText);
        throw new Error('El servidor no devolvió un JSON válido. Respuesta: ' + responseText.substring(0, 100));
      }
      
      if (response.ok) {
        input.value = '';
        removeFile();
        await cargarMensajesChat(ticketNumber);
        input.focus();
        mostrarNotificacion('Mensaje y archivo enviados correctamente', 'success');
      } else {
        throw new Error(data.message || 'Error al enviar mensaje con archivo');
      }
    } else {
      // Sin archivo, usar endpoint normal
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
    }
  } catch (error) {
    console.error('Error al enviar mensaje:', error);
    mostrarNotificacion(`Error: ${error.message}`, 'error');
  } finally {
    btnEnviar.disabled = false;
    btnEnviar.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar';
    btnAdjuntar.disabled = false;
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
  
  // Limpiar archivo seleccionado
  removeFile();
  
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
