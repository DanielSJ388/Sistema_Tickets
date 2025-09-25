// --- LÓGICA PRINCIPAL AL CARGAR LA PÁGINA ---
document.addEventListener('DOMContentLoaded', () => {
  // 1. Verificar si el usuario está autenticado
  const usuarioInfo = localStorage.getItem('usuario');
  let token = localStorage.getItem('token');
  
  console.log('Usuario en localStorage:', usuarioInfo);
  console.log('Token en localStorage:', token);
  
  if (!usuarioInfo) {
    console.log('No hay usuario en localStorage, redirigiendo...');
    window.location.href = 'auth.html';
    return;
  }

  const usuario = JSON.parse(usuarioInfo);
  
  // Si no hay token, crear uno temporal
  if (!token) {
    token = `temp_${Date.now()}`;
    localStorage.setItem('token', token);
  }
  
  // Mostrar información del usuario en el dashboard
  const userInfoElement = document.getElementById('user-info');
  if (userInfoElement) {
    userInfoElement.textContent = `👤 ${usuario.username || usuario.nombre}`;
  }
  
  // Actualizar sidebar con info del usuario
  setTimeout(() => {
    const usuarioElement = document.getElementById('usuarioActual');
    if (usuarioElement && !usuarioElement.innerHTML) {
      usuarioElement.innerHTML = `
        <div class="user-avatar">
          <i class="fas fa-user-circle"></i>
        </div>
        <div class="user-details">
          <div class="user-name">${usuario.username || usuario.nombre}</div>
          <div class="user-role">${usuario.rol || 'Usuario'}</div>
        </div>
      `;
    }
  }, 100);
  
  // 2. Inicializar eventos y cargar datos
  inicializarEventos();
  cargarTickets();
  cargarEstadisticas();
});

// --- INICIALIZACIÓN DE EVENTOS ---
function inicializarEventos() {
  const ticketForm = document.getElementById('ticketForm');
  const fileInput = document.getElementById('archivo');
  const fileName = document.getElementById('file-name');

  if (ticketForm) {
    ticketForm.addEventListener('submit', manejarEnvioTicket);
  }

  if (fileInput && fileName) {
    fileInput.addEventListener('change', function() {
      fileName.textContent = this.files.length > 0 ? this.files[0].name : '';
    });
  }
}

// --- MANEJO DEL FORMULARIO DE TICKETS ---
async function manejarEnvioTicket(e) {
  e.preventDefault();

  const usuario = JSON.parse(localStorage.getItem('usuario'));
  let token = localStorage.getItem('token');

  if (!usuario) {
    alert('Sesión expirada. Por favor, inicia sesión nuevamente.');
    window.location.href = 'auth.html';
    return;
  }

  // Obtener datos del formulario
  const titulo = document.getElementById('titulo').value.trim();
  const descripcion = document.getElementById('descripcion').value.trim();
  const categoria = document.getElementById('categoria').value;
  const archivoInput = document.getElementById('archivo');

  // Validar campos obligatorios
  if (!titulo || !descripcion || !categoria) {
    alert('Por favor, completa todos los campos obligatorios.');
    return;
  }

  // Validar tamaño del archivo si existe
  if (archivoInput.files.length > 0) {
    const archivo = archivoInput.files[0];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (archivo.size > maxSize) {
      alert('El archivo es demasiado grande. El tamaño máximo permitido es 10MB.');
      return;
    }
    
    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 
                         'application/pdf', 'text/plain', 
                         'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                         'application/msword'];
    
    if (!allowedTypes.includes(archivo.type)) {
      alert('Tipo de archivo no permitido. Solo se permiten: JPG, PNG, GIF, PDF, TXT, DOCX, DOC');
      return;
    }
  }

  // Crear FormData para enviar archivos
  const formData = new FormData();
  formData.append('Title', titulo);
  formData.append('Description', descripcion);
  formData.append('categoria', categoria);
  formData.append('AssignedTo', usuario.id || usuario._id || usuario.username);
  formData.append('usuario_nombre', usuario.username || usuario.nombre);
  
  // Agregar archivo si existe
  if (archivoInput.files.length > 0) {
    formData.append('archivo', archivoInput.files[0]);
  }

  try {
    // Intentar crear ticket en backend
    const response = await fetch('http://localhost:3000/tickets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
        // No agregar Content-Type cuando usamos FormData
      },
      body: formData
    });

    if (response.ok) {
      const result = await response.json();
      console.log('Ticket creado en backend:', result);
      
      // Limpiar formulario
      document.getElementById('ticketForm').reset();
      document.getElementById('file-name').textContent = '';
      
      alert('Ticket creado exitosamente');
      cargarTickets(); // Recargar lista
      
    } else {
      const errorData = await response.json();
      throw new Error(errorData.message || `Error del servidor: ${response.status}`);
    }
    
  } catch (error) {
    console.error('Error de conexión:', error);
    alert(`Error al crear el ticket: ${error.message}`);
    
    // Como respaldo, guardar localmente (sin archivo)
    const ticketData = {
      Title: titulo,
      Description: descripcion,
      categoria: categoria,
      AssignedTo: usuario.id || usuario._id || usuario.username,
      usuario_nombre: usuario.username || usuario.nombre
    };
    
    guardarTicketLocalmente(ticketData);
    
    // Limpiar formulario
    document.getElementById('ticketForm').reset();
    document.getElementById('file-name').textContent = '';
    
    alert('Ticket guardado localmente (sin archivo adjunto)');
    cargarTickets();
  }
}

// --- FUNCIONES AUXILIARES ---
function guardarTicketLocalmente(ticketData) {
  let tickets = JSON.parse(localStorage.getItem('tickets')) || [];
  
  const nuevoTicket = {
    ...ticketData,
    Number: Date.now(), // ID único temporal
    Status: 'Open',
    CreatedAt: new Date().toISOString(),
    local: true // Marca para identificar tickets locales
  };
  
  tickets.push(nuevoTicket);
  localStorage.setItem('tickets', JSON.stringify(tickets));
}

async function cargarTickets() {
  try {
    // Intentar cargar desde backend
    const response = await fetch('http://localhost:3000/tickets');
    
    if (response.ok) {
      const tickets = await response.json();
      console.log('Tickets cargados desde backend:', tickets);
      mostrarTickets(tickets);
      actualizarEstadisticas(tickets);
      return;
    }
    
  } catch (error) {
    console.error('Error al conectar con backend:', error);
  }
  
  // Si no hay conexión, usar datos locales
  console.log('Usando datos locales...');
  const ticketsLocales = JSON.parse(localStorage.getItem('tickets')) || [];
  
  // Si no hay tickets locales, crear ejemplos
  if (ticketsLocales.length === 0) {
    const ticketsEjemplo = crearTicketsEjemplo();
    localStorage.setItem('tickets', JSON.stringify(ticketsEjemplo));
    mostrarTickets(ticketsEjemplo);
    actualizarEstadisticas(ticketsEjemplo);
  } else {
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

function crearTicketsEjemplo() {
  return [
    {
      Number: 1,
      Title: "Problema con login",
      Description: "No puedo acceder a mi cuenta desde ayer",
      Status: "Open",
      Priority: "Medium", // Prioridad asignada por defecto
      CreatedAt: new Date().toISOString(),
      usuario_nombre: "Usuario Demo",
      categoria: "tecnico"
    },
    {
      Number: 2,
      Title: "Consulta sobre facturación",
      Description: "Necesito información sobre mi última factura",
      Status: "In Progress",
      Priority: "Medium", // Prioridad asignada por defecto
      CreatedAt: new Date(Date.now() - 86400000).toISOString(),
      usuario_nombre: "Usuario Demo",
      categoria: "consulta"
    },
    {
      Number: 3,
      Title: "Solicitud de información",
      Description: "Quiero saber más sobre los nuevos productos",
      Status: "Closed",
      Priority: "Medium", // Prioridad asignada por defecto
      CreatedAt: new Date(Date.now() - 172800000).toISOString(),
      usuario_nombre: "Usuario Demo",
      categoria: "solicitud"
    }
  ];
}

function cargarEstadisticas() {
  // Esta función se ejecuta después de cargarTickets()
  // Las estadísticas se actualizan automáticamente
}

function cerrarSesion() {
  if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
    localStorage.removeItem('usuario');
    localStorage.removeItem('token');
    window.location.href = 'auth.html';
  }
}