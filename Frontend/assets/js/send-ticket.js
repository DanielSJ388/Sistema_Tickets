// == Send Ticket ==

// Función para enviar un nuevo ticket
async function enviarTicket() {
  // Obtener elementos del formulario
  const tituloInput = document.getElementById('titulo');
  const descripcionInput = document.getElementById('descripcion');
  const categoriaInput = document.getElementById('categoria');
  const archivoInput = document.getElementById('archivo');
  const btnSubmit = document.querySelector('#ticketForm button[type="submit"]');
  
  // Validar que los elementos existen
  if (!tituloInput || !descripcionInput || !categoriaInput) {
    mostrarNotificacion('Error: No se pudieron encontrar los campos del formulario', 'error');
    console.error('Elementos del formulario no encontrados:', {
      titulo: !!tituloInput,
      descripcion: !!descripcionInput,
      categoria: !!categoriaInput
    });
    return;
  }
  
  // Obtener valores
  const titulo = tituloInput.value.trim();
  const descripcion = descripcionInput.value.trim();
  const categoria = categoriaInput.value;
  
  // Validaciones
  if (!titulo || !descripcion || !categoria) {
    mostrarNotificacion('Por favor, completa todos los campos requeridos', 'warning');
    return;
  }
  
  if (titulo.length < 5) {
    mostrarNotificacion('El título debe tener al menos 5 caracteres', 'warning');
    return;
  }
  
  if (descripcion.length < 10) {
    mostrarNotificacion('La descripción debe tener al menos 10 caracteres', 'warning');
    return;
  }
  
  // Validar archivo si se seleccionó
  if (archivoInput && archivoInput.files && archivoInput.files.length > 0) {
    const archivo = archivoInput.files[0];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (archivo.size > maxSize) {
      mostrarNotificacion('El archivo es demasiado grande. Máximo 10MB', 'error');
      return;
    }
    
    const allowedTypes = [
      'image/jpeg', 
      'image/jpg', 
      'image/png', 
      'image/gif', 
      'application/pdf', 
      'text/plain', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!allowedTypes.includes(archivo.type)) {
      mostrarNotificacion('Tipo de archivo no permitido. Solo se permiten: JPG, PNG, GIF, PDF, TXT, DOC, DOCX', 'error');
      return;
    }
  }
  
  // Deshabilitar botón
  if (btnSubmit) {
    const btnOriginal = btnSubmit.innerHTML;
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
    
    try {
      const usuario = obtenerUsuarioActual();
      
      if (!usuario) {
        throw new Error('No se pudo obtener la información del usuario');
      }
      
      // Crear FormData para enviar archivo
      const formData = new FormData();
      formData.append('Title', titulo);
      formData.append('Description', descripcion);
      formData.append('categoria', categoria);
      formData.append('usuario_nombre', usuario.nombre || usuario.username);
      
      // Agregar archivo si existe
      if (archivoInput && archivoInput.files && archivoInput.files.length > 0) {
        formData.append('archivo', archivoInput.files[0]);
        console.log('Archivo adjunto:', archivoInput.files[0].name);
      }
      
      console.log('Enviando ticket...');
      
      const response = await fetch('/tickets', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
        throw new Error(errorData.message || 'Error al crear ticket');
      }
      
      const data = await response.json();
      console.log('Ticket creado exitosamente:', data);
      
      mostrarNotificacion('✅ Ticket creado exitosamente', 'success');
      
      // Limpiar formulario
      document.getElementById('ticketForm').reset();
      document.getElementById('file-name').textContent = '';
      
      // Redirigir después de 2 segundos
      setTimeout(() => {
        window.location.href = 'my-tickets.html';
      }, 2000);
      
    } catch (error) {
      console.error('Error al enviar ticket:', error);
      mostrarNotificacion(`Error: ${error.message}`, 'error');
    } finally {
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = btnOriginal;
      }
    }
  }
}

// --- LÓGICA PRINCIPAL AL CARGAR LA PÁGINA ---
document.addEventListener('DOMContentLoaded', () => {
  // Inicializar autenticación y sidebar
  const usuario = inicializarAuth('nuevo');
  
  if (usuario) {
    console.log('Usuario autenticado:', usuario);
    inicializarFormulario();
  } else {
    console.error('No se pudo autenticar el usuario');
  }
});

// --- INICIALIZAR FORMULARIO ---
function inicializarFormulario() {
  const form = document.getElementById('ticketForm');
  const fileInput = document.getElementById('archivo');
  const fileName = document.getElementById('file-name');
  
  // Mostrar nombre del archivo seleccionado
  if (fileInput && fileName) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        fileName.textContent = `📎 ${file.name} (${formatFileSize(file.size)})`;
        fileName.style.color = 'var(--primary-color)';
      } else {
        fileName.textContent = '';
      }
    });
  }
  
  // Manejar envío del formulario
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await enviarTicket();
    });
  }
}

// --- FUNCIONES AUXILIARES ---
function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

function obtenerUsuarioActual() {
  const usuarioStr = localStorage.getItem('usuario');
  return usuarioStr ? JSON.parse(usuarioStr) : null;
}