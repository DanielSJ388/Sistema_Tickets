// --- LÓGICA PRINCIPAL AL CARGAR LA PÁGINA ---
document.addEventListener('DOMContentLoaded', () => {
  // 1. Verificar si el usuario está autenticado
  const usuarioInfo = localStorage.getItem('usuario');
  const token = localStorage.getItem('token');
  
  // Debug: mostrar qué hay en localStorage
  console.log('Usuario en localStorage:', usuarioInfo);
  console.log('Token en localStorage:', token);
  
  if (usuarioInfo) {
    const usuario = JSON.parse(usuarioInfo);
    // Si no hay token, crear uno temporal o usar el usuario como autenticación
    if (!token) {
      console.log('No hay token, creando autenticación temporal');
      localStorage.setItem('token', `temp_${Date.now()}`);
    }
    
    // Mostrar información del usuario en el dashboard
    document.getElementById('user-info').textContent = `👤 ${usuario.username || usuario.nombre}`;
    
    // Esperar a que el sidebar se cargue antes de actualizar la info del usuario
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
  } else {
    // Si no hay información, redirigir al login
    console.log('No hay usuario en localStorage, redirigiendo...');
    window.location.href = 'auth.html';
    return;
  }
  
  // 2. Inicializar eventos del formulario
  inicializarEventos();
  
  // 3. Cargar los tickets existentes
  cargarTickets();
});

// --- INICIALIZACIÓN DE EVENTOS ---
function inicializarEventos() {
  const ticketForm = document.getElementById('ticketForm');
  const adjuntosInput = document.getElementById('adjuntos');
  const descripcionTextarea = document.getElementById('descripcion');

  if (ticketForm) {
    ticketForm.addEventListener('submit', manejarEnvioTicket);
  }

  if (adjuntosInput) {
    adjuntosInput.addEventListener('change', mostrarNombreArchivo);
  }

  if (descripcionTextarea) {
    descripcionTextarea.addEventListener('input', ajustarAlturaTextarea);
  }
}

// --- MANEJO DE EVENTOS DEL FORMULARIO ---

// Enviar el formulario para crear un nuevo ticket
async function manejarEnvioTicket(e) {
  e.preventDefault();

  const usuario = JSON.parse(localStorage.getItem('usuario'));
  let token = localStorage.getItem('token');

  if (!usuario) {
    alert('Sesión expirada. Por favor, inicia sesión nuevamente.');
    window.location.href = 'auth.html';
    return;
  }

  // Si no hay token, crear uno temporal
  if (!token) {
    token = `temp_${Date.now()}`;
    localStorage.setItem('token', token);
  }

  // Crear ticket localmente mientras no hay backend
  const nuevoTicket = {
    id: Date.now(),
    titulo: document.getElementById('titulo').value,
    descripcion: document.getElementById('descripcion').value,
    categoria: document.getElementById('categoria').value,
    usuario_id: usuario.id || usuario._id || usuario.username,
    estado: 'abierto',
    prioridad: 'media',
    fecha_creacion: new Date().toISOString(),
    usuario_nombre: usuario.username || usuario.nombre
  };

  // Guardar en localStorage temporalmente
  let tickets = JSON.parse(localStorage.getItem('tickets')) || [];
  tickets.push(nuevoTicket);
  localStorage.setItem('tickets', JSON.stringify(tickets));

  // Limpiar formulario
  document.getElementById('ticketForm').reset();
  document.getElementById('fileName').textContent = '';
  alert('Ticket creado exitosamente (guardado localmente)');
  
  // Recargar tickets
  cargarTickets();

  // TODO: Cuando tengas el backend funcionando, descomenta esto:
  /*
  try {
    const formData = new FormData();
    formData.append('titulo', document.getElementById('titulo').value);
    formData.append('descripcion', document.getElementById('descripcion').value);
    formData.append('categoria', document.getElementById('categoria').value);
    formData.append('usuario_id', usuario.id || usuario._id || usuario.username);

    const archivos = document.getElementById('adjuntos').files;
    if (archivos.length > 0) {
      formData.append('adjunto', archivos[0]);
    }

    const response = await fetch('http://localhost:3001/api/tickets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (response.ok) {
      const result = await response.json();
      document.getElementById('ticketForm').reset();
      document.getElementById('fileName').textContent = '';
      alert('Ticket creado exitosamente');
      cargarTickets();
    } else {
      const errorData = await response.json();
      alert(`Error al crear el ticket: ${errorData.message || 'Error desconocido'}`);
    }
  } catch (error) {
    console.error('Error de conexión al crear ticket:', error);
    alert('Hubo un error de conexión al crear el ticket. Verifica tu conexión a internet.');
  }
  */
}

// Mostrar el nombre del archivo seleccionado
function mostrarNombreArchivo() {
  const fileNameDisplay = document.getElementById('fileName');
  if (this.files.length > 0) {
    fileNameDisplay.textContent = this.files[0].name;
  } else {
    fileNameDisplay.textContent = '';
  }
}

// Hacer que el textarea de descripción crezca automáticamente
function ajustarAlturaTextarea() {
  this.style.height = 'auto';
  this.style.height = (this.scrollHeight) + 'px';
}

// --- FUNCIONES ASÍNCRONAS Y AUXILIARES ---

// Cargar la lista de tickets desde el servidor
async function cargarTickets() {
  try {
    // Usar datos locales mientras no hay backend
    const tickets = JSON.parse(localStorage.getItem('tickets')) || [];
    
    // Si no hay tickets locales, crear algunos de ejemplo
    if (tickets.length === 0) {
      const ticketsEjemplo = [
        {
          id: 1,
          titulo: "Problema con login",
          descripcion: "No puedo acceder a mi cuenta desde ayer",
          categoria: "soporte_tecnico",
          estado: "abierto",
          prioridad: "alta",
          fecha_creacion: new Date().toISOString(),
          usuario_nombre: "Usuario Demo"
        },
        {
          id: 2,
          titulo: "Consulta sobre facturación",
          descripcion: "Necesito información sobre mi última factura",
          categoria: "facturacion",
          estado: "en_proceso",
          prioridad: "media",
          fecha_creacion: new Date().toISOString(),
          usuario_nombre: "Usuario Demo"
        },
        {
          id: 3,
          titulo: "Solicitud de información",
          descripcion: "Quiero saber más sobre los nuevos productos",
          categoria: "ventas",
          estado: "cerrado",
          prioridad: "baja",
          fecha_creacion: new Date().toISOString(),
          usuario_nombre: "Usuario Demo"
        }
      ];
      localStorage.setItem('tickets', JSON.stringify(ticketsEjemplo));
      tickets.push(...ticketsEjemplo);
    }
    
    const lista = document.getElementById('listaTickets');
    if (tickets.length === 0) {
      lista.innerHTML = '<p>No hay tickets disponibles. ¡Crea el primero!</p>';
    } else {
      lista.innerHTML = tickets.map(ticket => `
        <div class="ticket-item">
          <div class="ticket-info">
            <h4>#${ticket.id} - ${ticket.titulo}</h4>
            <p>${ticket.descripcion.substring(0, 80)}...</p>
            <small>Por: ${ticket.usuario_nombre} - ${new Date(ticket.fecha_creacion).toLocaleDateString()}</small>
          </div>
          <div class="ticket-details">
            <span class="badge badge-${ticket.prioridad}">${ticket.prioridad}</span>
            <span class="ticket-status status-${ticket.estado}">${ticket.estado}</span>
          </div>
        </div>
      `).join('');
    }
    
    actualizarEstadisticas(tickets);

    // TODO: Cuando tengas el backend funcionando, reemplaza todo lo anterior con esto:
    /*
    const token = localStorage.getItem('token');
    
    let response = await fetch('http://localhost:3001/api/tickets', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const tickets = await response.json();
    // ... resto del código de renderizado
    */
    
  } catch (error) {
    console.error('Error al cargar tickets:', error);
    document.getElementById('listaTickets').innerHTML = '<p>Usando datos locales de ejemplo.</p>';
  }
}

// Actualizar las tarjetas de estadísticas
function actualizarEstadisticas(tickets) {
  document.getElementById('totalTickets').textContent = tickets.length;
  document.getElementById('ticketsAbiertos').textContent = tickets.filter(t => t.estado === 'abierto').length;
  document.getElementById('ticketsEnProceso').textContent = tickets.filter(t => t.estado === 'en_proceso').length;
  document.getElementById('ticketsCerrados').textContent = tickets.filter(t => t.estado === 'cerrado').length;
}

// Cerrar la sesión del usuario (mantener para compatibilidad)
function cerrarSesion() {
  if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
    localStorage.removeItem('usuario');
    localStorage.removeItem('token');
    window.location.href = 'login.html';
  }
}

// Verificar autenticación al cargar la página
document.addEventListener('DOMContentLoaded', function() {
  const user = localStorage.getItem('user');
  if (!user) {
    // Si no está logueado, redirigir al login
    window.location.href = 'auth.html';
    return;
  }
  
  // Mostrar información del usuario
  const userData = JSON.parse(user);
  document.getElementById('user-info').textContent = `👤 ${userData.username}`;
  
  // Cargar datos del dashboard
  cargarEstadisticas();
});

function cerrarSesion() {
  localStorage.removeItem('user');
  window.location.href = 'auth.html';
}

function cargarEstadisticas() {
  // Aquí puedes hacer llamadas a la API para cargar estadísticas reales
  // Por ahora mostramos datos de ejemplo
  document.getElementById('total-tickets').textContent = '12';
  document.getElementById('pendientes').textContent = '3';
  document.getElementById('resueltos').textContent = '9';
  
  // Agregar el contenido faltante para "Alta Prioridad"
  const altaPrioridadCard = document.querySelector('#alta-prioridad').closest('.stat-card');
  if (altaPrioridadCard) {
    altaPrioridadCard.innerHTML = `
      <div class="stat-icon" style="background: rgba(220, 53, 69, 0.1); color: #dc3545;">
        <i class="fas fa-exclamation-triangle"></i>
      </div>
      <div>
        <div class="stat-number" id="alta-prioridad">2</div>
        <div class="stat-label">Alta Prioridad</div>
      </div>
    `;
  }
}

// Manejo del formulario de crear ticket
document.addEventListener('DOMContentLoaded', function() {
  const ticketForm = document.getElementById('ticketForm');
  const fileInput = document.getElementById('archivo');
  const fileName = document.getElementById('file-name');
  
  // Mostrar nombre del archivo seleccionado
  if (fileInput) {
    fileInput.addEventListener('change', function() {
      if (this.files && this.files[0]) {
        fileName.textContent = this.files[0].name;
      } else {
        fileName.textContent = '';
      }
    });
  }
  
  // Manejar envío del formulario
  if (ticketForm) {
    ticketForm.addEventListener('submit', function(e) {
      e.preventDefault();
      crearTicket();
    });
  }
});

function crearTicket() {
  const titulo = document.getElementById('titulo').value.trim();
  const prioridad = document.getElementById('prioridad').value;
  const categoria = document.getElementById('categoria').value;
  const descripcion = document.getElementById('descripcion').value.trim();
  
  if (!titulo || !prioridad || !categoria || !descripcion) {
    alert('Por favor, completa todos los campos obligatorios.');
    return;
  }
  
  // Aquí puedes agregar la lógica para enviar el ticket al backend
  console.log('Creando ticket:', { titulo, prioridad, categoria, descripcion });
  
  // Simular creación exitosa
  alert('Ticket creado exitosamente');
  document.getElementById('ticketForm').reset();
  document.getElementById('file-name').textContent = '';
}