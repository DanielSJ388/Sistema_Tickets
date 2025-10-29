/**
 * Utilidades de autenticación compartidas
 */

// Aplicar tema inmediatamente (antes de DOMContentLoaded)
(function() {
  const temaGuardado = localStorage.getItem('theme') || 'auto';
  const temaReal = obtenerTemaRealSync(temaGuardado);
  document.documentElement.setAttribute('data-theme', temaReal);
})();

// Función síncrona para obtener tema real
function obtenerTemaRealSync(theme) {
  if (theme === 'auto') {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }
  return theme;
}

/**
 * Verifica si el usuario está autenticado y configura la sesión
 * @returns {Object|null} - Objeto del usuario si está autenticado, null si no
 */
function verificarAutenticacion() {
  const usuarioInfo = localStorage.getItem('usuario');
  let token = localStorage.getItem('token');
  
  console.log('=== DEBUG AUTH-UTILS ===');
  console.log('Usuario en localStorage:', usuarioInfo);
  console.log('Token en localStorage:', token);
  
  if (!usuarioInfo) {
    console.log('No hay usuario en localStorage, redirigiendo...');
    window.location.href = 'auth.html';
    return null;
  }

  const usuario = JSON.parse(usuarioInfo);
  
  // Si no hay token, crear uno temporal
  if (!token) {
    token = `temp_${Date.now()}`;
    localStorage.setItem('token', token);
  }
  
  return usuario;
}

/**
 * Inicializa la información del usuario en la interfaz
 * @param {Object} usuario - Objeto del usuario
 */
function inicializarUsuarioUI(usuario) {
  // Mostrar información del usuario en elementos generales
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
}

/**
 * Función para validar sesión
 */
function validarSesion() {
  const usuarioStr = localStorage.getItem('usuario');
  
  if (!usuarioStr) {
    return null;
  }
  
  try {
    const usuario = JSON.parse(usuarioStr);
    
    // Validar que el objeto tenga las propiedades mínimas necesarias
    if (!usuario.id && !usuario._id) {
      console.error('Usuario sin ID válido');
      return null;
    }
    
    return usuario;
  } catch (error) {
    console.error('Error al parsear usuario de localStorage:', error);
    localStorage.removeItem('usuario');
    return null;
  }
}

/**
 * Función para obtener usuario actual
 */
function obtenerUsuarioActual() {
  return validarSesion();
}

/**
 * Función para cerrar sesión
 */
function cerrarSesion() {
  if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
    localStorage.removeItem('usuario');
    localStorage.removeItem('token');
    window.location.href = 'auth.html';
  }
}

/**
 * Función de debug para verificar el estado del localStorage
 */
function debugStorage() {
  console.log('=== DEBUG STORAGE ===');
  console.log('usuario:', localStorage.getItem('usuario'));
  console.log('token:', localStorage.getItem('token'));
  console.log('Todas las claves:', Object.keys(localStorage));
  for (let key of Object.keys(localStorage)) {
    console.log(`${key}:`, localStorage.getItem(key));
  }
}

/**
 * Inicialización completa de autenticación y UI
 * @param {string} currentPage - Página actual para el sidebar
 * @returns {Object|null} - Usuario autenticado o null
 */
function inicializarAuth(currentPage = 'dashboard') {
  // Aplicar tema guardado inmediatamente
  aplicarTemaGuardado();
  
  // Validar sesión
  const usuario = validarSesion();
  
  if (!usuario) {
    console.warn('No hay sesión activa, redirigiendo a login');
    window.location.href = 'auth.html';
    return null;
  }
  
  inicializarUsuarioUI(usuario);
    
  // Inicializar sidebar con página activa
  if (typeof window.initSidebar === 'function') {
    window.initSidebar(currentPage);
  }
  
  // Exponer función de debug globalmente
  window.debugStorage = debugStorage;
  
  return usuario;
}

/**
 * Función para aplicar tema guardado
 */
function aplicarTemaGuardado() {
  const temaGuardado = localStorage.getItem('theme') || 'auto';
  const temaReal = obtenerTemaReal(temaGuardado);
  document.documentElement.setAttribute('data-theme', temaReal);
}

/**
 * Función para obtener tema real (considerando modo auto)
 */
function obtenerTemaReal(theme) {
  if (theme === 'auto') {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }
  return theme;
}

// Detectar cambios en la preferencia del sistema para modo auto
if (window.matchMedia) {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  mediaQuery.addEventListener('change', (e) => {
    const temaActual = localStorage.getItem('theme');
    if (temaActual === 'auto') {
      const nuevoTema = e.matches ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', nuevoTema);
    }
  });
}
