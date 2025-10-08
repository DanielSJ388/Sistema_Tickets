// --- LÓGICA PRINCIPAL AL CARGAR LA PÁGINA ---
document.addEventListener('DOMContentLoaded', () => {
  // Inicializar autenticación y UI
  const usuario = inicializarAuth('nuevo');
  
  if (usuario) {
    // Inicializar eventos específicos del formulario
    inicializarEventos();
  }
});

function inicializarEventos() {
    document.getElementById('ticketForm').addEventListener('submit', manejarEnvioTicket);
    document.getElementById('archivo').addEventListener('change', function() {
        const fileName = this.files.length > 0 ? this.files[0].name : '';
        document.getElementById('file-name').textContent = fileName;
    });
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
    // Intentar crear ticket en backend (usa ruta relativa para el proxy de Vite)
    const response = await fetch('/tickets', {
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
    console.log('Ticket guardado localmente:', nuevoTicket);
}