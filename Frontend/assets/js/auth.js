// Verificar si ya hay un usuario logueado al cargar la página
document.addEventListener('DOMContentLoaded', function() {
  const user = localStorage.getItem('user');
  if (user) {
    // Si ya está logueado, redirigir al dashboard
    window.location.href = 'dashboard.html';
  }
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

async function registrar() {
  const username = document.getElementById("reg-username").value.trim();
  const email = document.getElementById("reg-email").value.trim();
  const password = document.getElementById("reg-password").value;
  const boton = event.target;

  if (!username || !email || !password) {
    mostrarMensaje("⚠️ Por favor, completa todos los campos", true);
    return;
  }

  mostrarCargando(boton, true);
  limpiarMensaje();

  try {
    const respuesta = await fetch("http://localhost:3000/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password })
    });

    const data = await respuesta.json();
    
    if (respuesta.ok) {
      mostrarMensaje(`✅ ${data.message}`, false);
      // Limpiar formulario
      document.getElementById("reg-username").value = "";
      document.getElementById("reg-email").value = "";
      document.getElementById("reg-password").value = "";
      
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
    const respuesta = await fetch("http://localhost:3000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password })
    });

    const data = await respuesta.json();
    
    if (respuesta.ok) {
      mostrarMensaje(`🎉 ¡Bienvenido, ${data.user.username}!`, false);
      
      // Guardar datos del usuario en localStorage
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Redirigir al dashboard después de 1.5 segundos
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1500);
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