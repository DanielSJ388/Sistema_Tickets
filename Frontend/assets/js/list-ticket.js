// --- LÓGICA PRINCIPAL AL CARGAR LA PÁGINA ---
document.addEventListener('DOMContentLoaded', () => {
  // Inicializar autenticación y UI
  const usuario = inicializarAuth('tickets');
  
  if (usuario) {
    console.log('Usuario autenticado:', usuario);
    // Cargar tickets asignados al usuario logueado
    cargarTicketsAsignados(usuario);
  } else {
    console.error('No se pudo autenticar el usuario');
  }
});

// --- CARGA Y RENDERIZADO DE TICKETS ASIGNADOS AL USUARIO ---
async function cargarTicketsAsignados(usuario) {
  try {
    console.log('Cargando tickets asignados para usuario:', usuario);
    
    // Usar el ID del usuario para buscar tickets asignados
    const userId = usuario.id || usuario._id;
    console.log('ID del usuario a buscar:', userId);
    
    if (!userId) {
      throw new Error('No se encontró ID del usuario');
    }
    
    const url = `/tickets/assigned/${userId}`;
    console.log('URL de la petición:', url);
    
    const response = await fetch(url);
    
    console.log('Status de respuesta:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Respuesta del servidor:', data);
      
      const tickets = data.tickets || data; // Manejar diferentes formatos de respuesta
      mostrarTicketsEnTabla(tickets);
      
    } else {
      const errorText = await response.text();
      console.error('Error del servidor:', response.status, errorText);
      
      if (response.status === 404) {
        console.log('Endpoint no encontrado, verificando conectividad...');
        // Verificar si el servidor está funcionando
        try {
          const testResponse = await fetch('/tickets');
          if (testResponse.ok) {
            mostrarError('El endpoint para tickets asignados no está disponible. Contacta al administrador.');
          } else {
            mostrarError('Error de conectividad con el servidor.');
          }
        } catch {
          mostrarError('No se puede conectar con el servidor.');
        }
      } else {
        mostrarError(`Error del servidor: ${response.status}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error al conectar con backend:', error);
    mostrarError('No se pudo conectar con el servidor');
  }
}

function mostrarTicketsEnTabla(tickets) {
  const tableBody = document.getElementById('ticketsTableBody');
  
  if (!tableBody) {
    console.error('No se encontró el elemento ticketsTableBody');
    return;
  }
  
  // Limpiar contenido actual
  tableBody.innerHTML = '';
  
  if (tickets.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="no-tickets">
          <div class="empty-state">
            <i class="fas fa-inbox"></i>
            <p>No tienes tickets asignados actualmente</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }
  
  // Generar filas de la tabla
  tickets.forEach(ticket => {
    const fila = document.createElement('tr');
    fila.className = 'ticket-row';
    
    const fecha = new Date(ticket.CreatedAt || ticket.fecha_creacion).toLocaleDateString('es-ES');
    const estado = ticket.Status || ticket.estado || 'Open';
    const prioridad = ticket.Priority || ticket.prioridad || 'Medium';
    
    // Determinar clases CSS para estado y prioridad
    const estadoClass = estado.toLowerCase().replace(' ', '-');
    const prioridadClass = prioridad.toLowerCase();
    
    fila.innerHTML = `
      <td class="ticket-id">#${ticket.Number || ticket.id}</td>
      <td class="ticket-title">
        ${ticket.Title || ticket.titulo}
        ${ticket.archivo_path ? '<i class="fas fa-paperclip" title="Archivo adjunto"></i>' : ''}
      </td>
      <td>
        <span class="status-badge status-${estadoClass}">${estado}</span>
      </td>
      <td>
        <span class="priority-badge priority-${prioridadClass}">${prioridad}</span>
      </td>
      <td class="ticket-creator">${ticket.usuario_nombre || 'Usuario'}</td>
      <td class="ticket-date">${fecha}</td>
      <td class="ticket-actions">
        <button class="btn btn-sm btn-primary" onclick="verDetallesTicket(${JSON.stringify(ticket).replace(/"/g, '&quot;')})">
          <i class="fas fa-eye"></i>
          Ver
        </button>
        <button class="btn btn-sm btn-success" onclick="atenderTicket(${JSON.stringify(ticket).replace(/"/g, '&quot;')})">
          <i class="fas fa-wrench"></i>
          Atender
        </button>
      </td>
    `;
    
    tableBody.appendChild(fila);
  });
}

function mostrarError(mensaje) {
  const tableBody = document.getElementById('ticketsTableBody');
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

// --- FUNCIONES DE INTERACCIÓN ---
function verDetallesTicket(ticket) {
  const modal = document.getElementById('detalleTicketModal');
  const fecha = new Date(ticket.CreatedAt || ticket.fecha_creacion).toLocaleString('es-ES');
  const estado = ticket.Status || ticket.estado || 'Open';
  const prioridad = ticket.Priority || ticket.prioridad || 'Medium';
  
  // Llenar información básica
  document.getElementById('detalleTicketId').textContent = `#${ticket.Number || ticket.id}`;
  document.getElementById('detalleTitulo').textContent = ticket.Title || ticket.titulo;
  document.getElementById('detalleDescripcion').textContent = ticket.Description || ticket.descripcion;
  document.getElementById('detalleUsuario').textContent = ticket.usuario_nombre || 'Usuario';
  document.getElementById('detalleFecha').textContent = fecha;
  document.getElementById('detalleCategoria').textContent = ticket.categoria || 'Sin categoría';
  
  // Estado y prioridad con estilos
  document.getElementById('detalleEstado').innerHTML = `<span class="status-badge status-${estado.toLowerCase().replace(' ', '-')}">${estado}</span>`;
  document.getElementById('detallePrioridad').innerHTML = `<span class="priority-badge priority-${prioridad.toLowerCase()}">${prioridad}</span>`;
  
  // Información del archivo
  mostrarArchivoEnDetalle(ticket);
  
  // Mostrar comentarios
  mostrarComentariosEnDetalle(ticket);
  
  // Configurar botón de atender
  document.getElementById('btnAtenderDesdeDetalle').onclick = () => {
    cerrarModalDetalle();
    atenderTicket(ticket);
  };
  
  // Mostrar modal
  modal.style.display = 'block';
  document.body.style.overflow = 'hidden';
}

function mostrarArchivoEnDetalle(ticket) {
  const archivoContainer = document.getElementById('detalleArchivo');
  
  if (ticket.archivo_path || ticket.archivo_nombre_original || ticket.archivo_nombre) {
    const nombreArchivo = ticket.archivo_nombre_original || ticket.archivo_nombre || 'Archivo adjunto';
    
    // Construir URL de descarga
    let downloadUrl = '';
    if (ticket.archivo_path) {
      const fileName = ticket.archivo_path.split('/').pop() || ticket.archivo_path.split('\\').pop();
      downloadUrl = `/uploads/${fileName}`;
    }
    
    archivoContainer.innerHTML = `
      <h4>Archivo Adjunto</h4>
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
  } else {
    archivoContainer.innerHTML = '';
  }
}

function mostrarComentariosEnDetalle(ticket) {
  const comentariosContainer = document.getElementById('detalleComentarios');
  
  if (ticket.comentarios && ticket.comentarios.length > 0) {
    comentariosContainer.innerHTML = ticket.comentarios.map(comentario => `
      <div class="comentario-item">
        <div class="comentario-header">
          <strong>${comentario.usuario}</strong>
          <span class="comentario-fecha">${new Date(comentario.fecha).toLocaleString('es-ES')}</span>
        </div>
        <div class="comentario-texto">${comentario.texto}</div>
      </div>
    `).join('');
  } else {
    comentariosContainer.innerHTML = '<p class="no-comments">No hay comentarios aún</p>';
  }
}

function cerrarModalDetalle() {
  const modal = document.getElementById('detalleTicketModal');
  modal.style.display = 'none';
  document.body.style.overflow = 'auto';
}

// Función para descargar archivos (reutilizada del dashboard)
async function descargarArchivo(url, nombreArchivo) {
  try {
    console.log('Intentando descargar:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    const link = document.createElement('a');
    const objectUrl = URL.createObjectURL(blob);
    
    link.href = objectUrl;
    link.download = nombreArchivo;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(objectUrl);
    
  } catch (error) {
    console.error('Error al descargar archivo:', error);
    alert(`Error al descargar el archivo: ${error.message}`);
  }
}

// Cerrar modal al hacer clic fuera de él
window.addEventListener('click', function(event) {
  const modal = document.getElementById('detalleTicketModal');
  if (event.target === modal) {
    cerrarModalDetalle();
  }
});

// Cerrar modal con tecla Escape
document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') {
    const modal = document.getElementById('detalleTicketModal');
    if (modal.style.display === 'block') {
      cerrarModalDetalle();
    }
  }
});