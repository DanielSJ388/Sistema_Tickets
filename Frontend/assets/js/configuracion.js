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
  const temaSeleccionado = document.querySelector('.theme-option.active')?.dataset.theme || 'light';
  
  const preferencias = {
    notifEmail: document.getElementById('notifEmail').checked,
    notifBrowser: document.getElementById('notifBrowser').checked,
    notifSound: document.getElementById('notifSound').checked,
    fontSize: document.getElementById('fontSize').value,
    theme: temaSeleccionado
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
  
  // Cargar tema guardado o detectar preferencia del sistema
  const temaGuardado = localStorage.getItem('theme') || 'auto';
  aplicarTemaInicial(temaGuardado);
  
  // Marcar opción activa según tema guardado
  themeOptions.forEach(opt => {
    if (opt.dataset.theme === temaGuardado) {
      opt.classList.add('active');
    } else {
      opt.classList.remove('active');
    }
  });
  
  themeOptions.forEach(option => {
    option.addEventListener('click', () => {
      themeOptions.forEach(opt => opt.classList.remove('active'));
      option.classList.add('active');
      
      const theme = option.dataset.theme;
      aplicarTema(theme);
    });
  });
  
  // Detectar cambios en preferencia del sistema
  if (window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', (e) => {
      const temaActual = localStorage.getItem('theme');
      if (temaActual === 'auto') {
        aplicarTema('auto');
      }
    });
  }
}

function aplicarTemaInicial(theme) {
  const temaReal = obtenerTemaReal(theme);
  // No aplicar transición al cargar inicialmente
  document.documentElement.setAttribute('data-theme', temaReal);
  localStorage.setItem('theme', theme);
}

function aplicarTema(theme) {
  const temaReal = obtenerTemaReal(theme);
  
  // Solo aplicar transición cuando el usuario cambia manualmente el tema
  document.documentElement.style.transition = 'background-color 0.3s ease, color 0.3s ease';
  document.documentElement.setAttribute('data-theme', temaReal);
  
  // Guardar preferencia
  localStorage.setItem('theme', theme);
  
  // Mensaje de confirmación
  const mensajes = {
    'light': 'Tema claro activado',
    'dark': 'Tema oscuro activado',
    'auto': `Tema automático activado (${temaReal === 'dark' ? 'oscuro' : 'claro'} según sistema)`
  };
  
  mostrarNotificacion(mensajes[theme], 'success');
  
  // Quitar transición después de aplicar
  setTimeout(() => {
    document.documentElement.style.transition = '';
  }, 300);
}

function obtenerTemaReal(theme) {
  if (theme === 'auto') {
    // Detectar preferencia del sistema
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }
  return theme;
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
  const btnCambiar = document.querySelector('#cambiarPasswordModal .btn-success');
  
  // Validaciones
  if (!passwordActual || !passwordNueva || !passwordConfirmar) {
    mostrarNotificacion('Por favor, completa todos los campos', 'error');
    return;
  }
  
  if (passwordNueva !== passwordConfirmar) {
    mostrarNotificacion('Las contraseñas no coinciden', 'error');
    return;
  }
  
  if (passwordNueva.length < 6) {
    mostrarNotificacion('La nueva contraseña debe tener al menos 6 caracteres', 'error');
    return;
  }
  
  // Validación de complejidad (opcional pero recomendado)
  const tieneNumero = /\d/.test(passwordNueva);
  const tieneMayuscula = /[A-Z]/.test(passwordNueva);
  const tieneMinuscula = /[a-z]/.test(passwordNueva);
  
  if (passwordNueva.length < 8 || !tieneNumero || !tieneMayuscula || !tieneMinuscula) {
    mostrarNotificacion('La contraseña debe cumplir con todos los requisitos de seguridad', 'warning');
    return;
  }
  
  // Deshabilitar botón mientras se procesa
  btnCambiar.disabled = true;
  btnCambiar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cambiando...';
  
  try {
    // Obtener usuario actual
    const usuario = obtenerUsuarioActual();
    if (!usuario || !usuario.id) {
      throw new Error('No se pudo obtener la información del usuario');
    }
    
    console.log('Intentando cambiar contraseña para usuario:', usuario.id);
    
    // Enviar solicitud al backend
    const response = await fetch(`/users/${usuario.id}/change-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        passwordActual: passwordActual,
        passwordNueva: passwordNueva
      })
    });
    
    const data = await response.json();
    console.log('Respuesta del servidor:', data);
    
    if (!response.ok) {
      throw new Error(data.message || 'Error al cambiar contraseña');
    }
    
    // Éxito
    mostrarNotificacion('Contraseña actualizada exitosamente', 'success');
    cerrarModalPassword();
    
    // Opcional: cerrar sesión después de cambiar contraseña
    setTimeout(() => {
      if (confirm('Por seguridad, se recomienda cerrar sesión. ¿Deseas cerrar sesión ahora?')) {
        localStorage.removeItem('usuario');
        window.location.href = 'auth.html';
      }
    }, 1500);
    
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    mostrarNotificacion(error.message, 'error');
  } finally {
    // Rehabilitar botón
    btnCambiar.disabled = false;
    btnCambiar.innerHTML = '<i class="fas fa-check"></i> Cambiar Contraseña';
  }
}

function obtenerUsuarioActual() {
  const usuarioStr = localStorage.getItem('usuario');
  return usuarioStr ? JSON.parse(usuarioStr) : null;
}

// --- FUNCIONES AUXILIARES PARA EL MODAL DE CONTRASEÑA ---
function togglePasswordVisibility(inputId) {
  const input = document.getElementById(inputId);
  const button = input.parentElement.querySelector('.toggle-password i');
  
  if (input.type === 'password') {
    input.type = 'text';
    button.className = 'fas fa-eye-slash';
  } else {
    input.type = 'password';
    button.className = 'fas fa-eye';
  }
}

function validarPassword() {
  const password = document.getElementById('passwordNueva').value;
  const strengthBar = document.getElementById('passwordStrength');
  
  // Validar requisitos
  const tieneNumero = /\d/.test(password);
  const tieneMayuscula = /[A-Z]/.test(password);
  const tieneMinuscula = /[a-z]/.test(password);
  const longitudCorrecta = password.length >= 8;
  
  // Actualizar checklist visual
  actualizarRequisito('req-length', longitudCorrecta);
  actualizarRequisito('req-uppercase', tieneMayuscula);
  actualizarRequisito('req-lowercase', tieneMinuscula);
  actualizarRequisito('req-number', tieneNumero);
  
  // Calcular fuerza de la contraseña
  let fuerza = 0;
  if (longitudCorrecta) fuerza++;
  if (tieneMayuscula) fuerza++;
  if (tieneMinuscula) fuerza++;
  if (tieneNumero) fuerza++;
  if (password.length >= 12) fuerza++;
  
  // Mostrar indicador de fuerza
  if (password.length === 0) {
    strengthBar.innerHTML = '';
    strengthBar.className = 'password-strength';
  } else if (fuerza <= 2) {
    strengthBar.innerHTML = '<span class="strength-weak">Débil</span>';
    strengthBar.className = 'password-strength weak';
  } else if (fuerza <= 3) {
    strengthBar.innerHTML = '<span class="strength-medium">Media</span>';
    strengthBar.className = 'password-strength medium';
  } else {
    strengthBar.innerHTML = '<span class="strength-strong">Fuerte</span>';
    strengthBar.className = 'password-strength strong';
  }
}

function actualizarRequisito(elementId, cumplido) {
  const elemento = document.getElementById(elementId);
  const icon = elemento.querySelector('i');
  
  if (cumplido) {
    elemento.classList.add('requisito-cumplido');
    icon.className = 'fas fa-check-circle';
  } else {
    elemento.classList.remove('requisito-cumplido');
    icon.className = 'fas fa-circle';
  }
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


function limpiarDatos() {  if (confirm('¿Estás seguro de que deseas limpiar todos los datos locales? Esta acción no se puede deshacer.')) {
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
  // Remover notificaciones anteriores si existen
  const notificacionesAnteriores = document.querySelectorAll('.notification');
  notificacionesAnteriores.forEach(notif => {
    notif.remove();
  });
  
  const notificacion = document.createElement('div');
  notificacion.className = `notification notification-${tipo}`;
  
  const iconos = {
    'success': 'fa-check-circle',
    'error': 'fa-exclamation-circle',
    'info': 'fa-info-circle',
    'warning': 'fa-exclamation-triangle'
  };
  
  const icon = iconos[tipo] || 'fa-info-circle';
  
  notificacion.innerHTML = `
    <i class="fas ${icon}"></i>
    <span>${mensaje}</span>
  `;
  
  document.body.appendChild(notificacion);
  
  // Forzar reflow para que la animación funcione
  notificacion.offsetHeight;
  
  // Agregar clase show después de un pequeño delay
  requestAnimationFrame(() => {
    notificacion.classList.add('show');
  });
  
  // Remover notificación después de 3.5 segundos
  setTimeout(() => {
    notificacion.classList.remove('show');
    
    // Remover del DOM después de la animación
    setTimeout(() => {
      if (notificacion.parentNode) {
        notificacion.remove();
      }
    }, 400);
  }, 3500);
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
