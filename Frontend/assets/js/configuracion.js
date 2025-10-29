// --- LÓGICA PRINCIPAL AL CARGAR LA PÁGINA ---
document.addEventListener('DOMContentLoaded', () => {
  const usuario = inicializarAuth('configuracion');
  
  if (usuario) {
    console.log('Usuario autenticado:', usuario);
    cargarInformacionUsuario(usuario);
    cargarEstadisticasPersonales(usuario);
    cargarPreferencias();
    inicializarSelectoresTema();
  } else {
    console.error('No se pudo autenticar el usuario');
  }
});

// --- CARGAR INFORMACIÓN DEL USUARIO ---
function cargarInformacionUsuario(usuario) {
  document.getElementById('configUsername').textContent = usuario.username || usuario.nombre || '-';
  document.getElementById('configEmail').textContent = usuario.email || '-';
  
  // Determinar rol
  const role = usuario.rol || usuario.role || 'Usuario';
  const roleElement = document.getElementById('configRole');
  roleElement.textContent = role;
  roleElement.className = `role-badge ${role.toLowerCase()}`;
  
  // Fecha de registro (si existe)
  if (usuario.fechaRegistro || usuario.createdAt) {
    const fecha = new Date(usuario.fechaRegistro || usuario.createdAt);
    document.getElementById('configMemberSince').textContent = fecha.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}

// --- CARGAR ESTADÍSTICAS PERSONALES ---
async function cargarEstadisticasPersonales(usuario) {
  try {
    const userName = usuario.nombre || usuario.username;
    const userId = usuario.id || usuario._id;
    
    // Obtener todos los tickets
    const response = await fetch('/tickets');
    if (!response.ok) throw new Error('Error al cargar tickets');
    
    const tickets = await response.json();
    
    // Calcular estadísticas
    const ticketsCreados = tickets.filter(t => t.usuario_nombre === userName).length;
    const ticketsAsignados = tickets.filter(t => t.AssignedTo === userId).length;
    const ticketsResueltos = tickets.filter(t => 
      t.AssignedTo === userId && ['Resolved', 'Closed'].includes(t.Status)
    ).length;
    
    // Contar comentarios
    let totalComentarios = 0;
    tickets.forEach(ticket => {
      if (ticket.comentarios) {
        totalComentarios += ticket.comentarios.filter(c => c.usuario === userName).length;
      }
    });
    
    // Actualizar UI
    animarContador('statTicketsCreados', ticketsCreados);
    animarContador('statTicketsAsignados', ticketsAsignados);
    animarContador('statTicketsResueltos', ticketsResueltos);
    animarContador('statComentarios', totalComentarios);
    
  } catch (error) {
    console.error('Error al cargar estadísticas:', error);
  }
}

function animarContador(elementId, valorFinal) {
  const elemento = document.getElementById(elementId);
  let valorActual = 0;
  const incremento = valorFinal / 30;
  const intervalo = setInterval(() => {
    valorActual += incremento;
    if (valorActual >= valorFinal) {
      elemento.textContent = valorFinal;
      clearInterval(intervalo);
    } else {
      elemento.textContent = Math.floor(valorActual);
    }
  }, 30);
}

// --- PREFERENCIAS DE NOTIFICACIONES ---
function cargarPreferencias() {
  const preferencias = JSON.parse(localStorage.getItem('preferencias')) || {
    notifEmail: true,
    notifBrowser: false,
    notifSound: true,
    fontSize: 'medium',
    theme: 'light'
  };
  
  document.getElementById('notifEmail').checked = preferencias.notifEmail;
  document.getElementById('notifBrowser').checked = preferencias.notifBrowser;
  document.getElementById('notifSound').checked = preferencias.notifSound;
  document.getElementById('fontSize').value = preferencias.fontSize;
}

function guardarPreferencias() {
  const preferencias = {
    notifEmail: document.getElementById('notifEmail').checked,
    notifBrowser: document.getElementById('notifBrowser').checked,
    notifSound: document.getElementById('notifSound').checked,
    fontSize: document.getElementById('fontSize').value,
    theme: document.querySelector('.theme-option.active').dataset.theme
  };
  
  localStorage.setItem('preferencias', JSON.stringify(preferencias));
  
  // Aplicar preferencias
  aplicarPreferencias(preferencias);
  
  mostrarNotificacion('Preferencias guardadas correctamente', 'success');
}

function aplicarPreferencias(preferencias) {
  // Aplicar tamaño de fuente
  document.documentElement.style.fontSize = {
    'small': '14px',
    'medium': '16px',
    'large': '18px'
  }[preferencias.fontSize];
  
  // Solicitar permisos de notificaciones si están activadas
  if (preferencias.notifBrowser && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

// --- SELECTOR DE TEMA ---
function inicializarSelectoresTema() {
  const themeOptions = document.querySelectorAll('.theme-option');
  
  themeOptions.forEach(option => {
    option.addEventListener('click', () => {
      themeOptions.forEach(opt => opt.classList.remove('active'));
      option.classList.add('active');
      
      const theme = option.dataset.theme;
      aplicarTema(theme);
    });
  });
}

function aplicarTema(theme) {
  // Por ahora solo guardamos la preferencia
  // En una implementación futura se aplicaría CSS dinámico
  console.log('Tema seleccionado:', theme);
  mostrarNotificacion(`Tema ${theme} seleccionado`, 'info');
}

// --- CAMBIAR CONTRASEÑA ---
function abrirModalCambiarPassword() {
  const modal = document.getElementById('cambiarPasswordModal');
  modal.style.display = 'block';
  document.body.style.overflow = 'hidden';
  
  // Limpiar campos
  document.getElementById('passwordActual').value = '';
  document.getElementById('passwordNueva').value = '';
  document.getElementById('passwordConfirmar').value = '';
}

function cerrarModalPassword() {
  const modal = document.getElementById('cambiarPasswordModal');
  modal.style.display = 'none';
  document.body.style.overflow = 'auto';
}

async function cambiarPassword() {
  const passwordActual = document.getElementById('passwordActual').value;
  const passwordNueva = document.getElementById('passwordNueva').value;
  const passwordConfirmar = document.getElementById('passwordConfirmar').value;
  
  // Validaciones
  if (!passwordActual || !passwordNueva || !passwordConfirmar) {
    mostrarNotificacion('Por favor, completa todos los campos', 'error');
    return;
  }
  
  if (passwordNueva !== passwordConfirmar) {
    mostrarNotificacion('Las contraseñas no coinciden', 'error');
    return;
  }
  
  if (passwordNueva.length < 8) {
    mostrarNotificacion('La contraseña debe tener al menos 8 caracteres', 'error');
    return;
  }
  
  // Aquí iría la lógica para cambiar la contraseña en el backend
  // Por ahora solo simulamos el proceso
  mostrarNotificacion('Funcionalidad en desarrollo', 'info');
  cerrarModalPassword();
}

// --- FUNCIONES ADICIONALES ---
function verDocumentacion() {
  mostrarNotificacion('Abriendo documentación...', 'info');
  // Aquí se abriría un PDF o página web con la documentación
  window.open('#', '_blank');
}

function cerrarSesionTodos() {
  if (confirm('¿Estás seguro de que deseas cerrar todas las sesiones? Deberás iniciar sesión nuevamente.')) {
    localStorage.removeItem('usuario');
    mostrarNotificacion('Sesiones cerradas correctamente', 'success');
    setTimeout(() => {
      window.location.href = 'auth.html';
    }, 1500);
  }
}

function limpiarDatos() {
  if (confirm('¿Estás seguro de que deseas limpiar todos los datos locales? Esta acción no se puede deshacer.')) {
    const usuario = localStorage.getItem('usuario');
    localStorage.clear();
    localStorage.setItem('usuario', usuario); // Mantener sesión
    mostrarNotificacion('Datos locales eliminados correctamente', 'success');
    setTimeout(() => {
      location.reload();
    }, 1500);
  }
}

// --- SISTEMA DE NOTIFICACIONES ---
function mostrarNotificacion(mensaje, tipo = 'info') {
  const notificacion = document.createElement('div');
  notificacion.className = `notification notification-${tipo}`;
  
  const icon = {
    'success': 'fa-check-circle',
    'error': 'fa-exclamation-circle',
    'info': 'fa-info-circle',
    'warning': 'fa-exclamation-triangle'
  }[tipo];
  
  notificacion.innerHTML = `
    <i class="fas ${icon}"></i>
    <span>${mensaje}</span>
  `;
  
  document.body.appendChild(notificacion);
  
  setTimeout(() => {
    notificacion.classList.add('show');
  }, 100);
  
  setTimeout(() => {
    notificacion.classList.remove('show');
    setTimeout(() => {
      notificacion.remove();
    }, 300);
  }, 3000);
}

// Cerrar modal con click fuera o Escape
window.addEventListener('click', function(event) {
  const modal = document.getElementById('cambiarPasswordModal');
  if (event.target === modal) {
    cerrarModalPassword();
  }
});

document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') {
    const modal = document.getElementById('cambiarPasswordModal');
    if (modal.style.display === 'block') {
      cerrarModalPassword();
    }
  }
});
