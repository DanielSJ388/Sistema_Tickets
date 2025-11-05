// Verificar si ya hay un usuario logueado al cargar la página
document.addEventListener('DOMContentLoaded', async function() {
  console.log('=== INICIO DEBUG AUTH.JS ===');
  
  // LIMPIEZA COMPLETA: Forzar migración/limpieza de datos inconsistentes
  const userAntiguo = localStorage.getItem('user');
  const usuarioActual = localStorage.getItem('usuario');
  
  if (userAntiguo && !usuarioActual) {
    console.log('Migrando de "user" a "usuario"');
    localStorage.setItem('usuario', userAntiguo);
    localStorage.removeItem('user');
  } else if (userAntiguo && usuarioActual) {
    console.log('Limpiando clave duplicada "user"');
    localStorage.removeItem('user');
  }
  
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('usuario');
  
  console.log('Token encontrado:', token);
  console.log('Usuario encontrado:', user);
  console.log('Todas las claves en localStorage:', Object.keys(localStorage));
  
  // Si hay usuario, redirigir directamente al dashboard (el backend no usa JWT)
  if (user) {
    console.log('Usuario encontrado en localStorage, redirigiendo al dashboard');
    window.location.href = 'dashboard.html';
    return;
  }
  
  console.log('No hay usuario, mostrando formulario de login');
});

// Funciones para alternar entre formularios
function mostrarLogin() {
  const registroForm = document.getElementById("registro-form");
  const loginForm = document.getElementById("login-form");
  
  registroForm.classList.add("hidden");
  loginForm.classList.remove("hidden");
  loginForm.classList.add("fade-in");
  limpiarMensaje();
}

function mostrarRegistro() {
  const loginForm = document.getElementById("login-form");
  const registroForm = document.getElementById("registro-form");
  
  loginForm.classList.add("hidden");
  registroForm.classList.remove("hidden");
  registroForm.classList.add("fade-in");
  limpiarMensaje();
}

function limpiarMensaje() {
  const mensaje = document.getElementById("mensaje");
  mensaje.innerHTML = "";
  mensaje.className = "";
}

function mostrarMensaje(texto, esError = false) {
  const mensaje = document.getElementById("mensaje");
  mensaje.innerHTML = texto;
  mensaje.className = `message ${esError ? 'error' : 'success'}`;
}

function mostrarCargando(boton, mostrar = true) {
  if (mostrar) {
    boton.classList.add('loading');
    boton.disabled = true;
  } else {
    boton.classList.remove('loading');
    boton.disabled = false;
  }
}

// Variable para controlar si se muestra el campo de SuperUser
let mostrandoCampoSuperUser = false;

function toggleSuperUserField() {
  mostrandoCampoSuperUser = !mostrandoCampoSuperUser;
  
  const superUserField = document.getElementById('superuser-field');
  const toggleBtn = document.getElementById('toggle-superuser-btn');
  
  if (mostrandoCampoSuperUser) {
    superUserField.style.display = 'block';
    toggleBtn.innerHTML = '<i class="fas fa-user-shield"></i> Ocultar campo SuperUser';
    toggleBtn.style.background = '#dc3545';
  } else {
    superUserField.style.display = 'none';
    toggleBtn.innerHTML = '<i class="fas fa-user-shield"></i> Registrar como SuperUser';
    toggleBtn.style.background = '#6c757d';
    document.getElementById("reg-superuser-code").value = '';
  }
}

async function registrar() {
  const username = document.getElementById("reg-username").value.trim();
  const email = document.getElementById("reg-email").value.trim();
  const password = document.getElementById("reg-password").value;
  const superUserCode = document.getElementById("reg-superuser-code").value.trim();
  const boton = event.target;

  if (!username || !email || !password) {
    mostrarMensaje("⚠️ Por favor, completa todos los campos", true);
    return;
  }

  mostrarCargando(boton, true);
  limpiarMensaje();

  try {
    const datosRegistro = { 
      username, 
      email, 
      password 
    };
    
    // Si hay código de SuperUser, agregarlo a la petición
    if (superUserCode) {
      datosRegistro.rol = 'SuperUser';
      datosRegistro.superUserCode = superUserCode;
      console.log('Intentando registrar como SuperUser');
    }
    
    const respuesta = await fetch("/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datosRegistro)
    });

    const data = await respuesta.json();
    
    if (respuesta.ok) {
      mostrarMensaje(`✅ ${data.message}`, false);
      // Limpiar formulario
      document.getElementById("reg-username").value = "";
      document.getElementById("reg-email").value = "";
      document.getElementById("reg-password").value = "";
      document.getElementById("reg-superuser-code").value = "";
      
      // Ocultar campo de SuperUser si estaba visible
      if (mostrandoCampoSuperUser) {
        toggleSuperUserField();
      }
      
      // Cambiar automáticamente al formulario de login después de registro exitoso
      setTimeout(() => {
        mostrarLogin();
      }, 2000);
    } else {
      mostrarMensaje(`❌ ${data.message}`, true);
    }
  } catch (error) {
    console.error('Error de conexión:', error);
    mostrarMensaje("🔌 Error de conexión con el servidor. ¿Está ejecutándose el backend?", true);
  } finally {
    mostrarCargando(boton, false);
  }
}

async function iniciarSesion() {
  const identifier = document.getElementById("login-identifier").value.trim();
  const password = document.getElementById("login-password").value;
  const boton = event.target;

  if (!identifier || !password) {
    mostrarMensaje("⚠️ Por favor, completa todos los campos", true);
    return;
  }

  mostrarCargando(boton, true);
  limpiarMensaje();

  try {
    console.log('=== INICIANDO LOGIN ===');
    console.log('Enviando datos:', { identifier, password: '***' });
    
    const respuesta = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password })
    });

    const data = await respuesta.json();
    console.log('Respuesta del servidor:', data);
    console.log('Status de la respuesta:', respuesta.status);
    
    if (respuesta.ok) {
      mostrarMensaje(`🎉 ¡Bienvenido, ${data.user.username}!`, false);
      
      console.log('Login exitoso - Usuario:', data.user);
      
      const usuarioParaGuardar = JSON.stringify(data.user);
      console.log('Datos que se van a guardar:', usuarioParaGuardar);
      
      localStorage.setItem('usuario', usuarioParaGuardar);
      console.log('Usuario guardado en localStorage');
      
      const usuarioGuardado = localStorage.getItem('usuario');
      console.log('Verificación - Usuario guardado:', usuarioGuardado);
      console.log('Todas las claves después del guardado:', Object.keys(localStorage));
      
      // Determinar página de destino según el rol
      const rol = data.user.rol || 'Usuario';
      let paginaDestino = 'my-tickets.html'; // Por defecto para usuarios normales
      
      if (['SuperUser', 'Administrador'].includes(rol)) {
        paginaDestino = 'dashboard.html';
      }
      
      console.log(`Usuario con rol ${rol}, redirigiendo a ${paginaDestino}`);
      
      // Redirigir según el rol después de 1.5 segundos
      setTimeout(() => {
        console.log('Redirigiendo a:', paginaDestino);
        window.location.href = paginaDestino;
      }, 1500);
    } else {
      mostrarMensaje(`❌ ${data.message}`, true);
    }
  } catch (error) {
    console.error('❌ Error de conexión:', error);
    mostrarMensaje("🔌 Error de conexión con el servidor. ¿Está ejecutándose el backend?", true);
  } finally {
    mostrarCargando(boton, false);
  }
}