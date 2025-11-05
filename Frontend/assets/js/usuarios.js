document.addEventListener('DOMContentLoaded', () => {
  const usuario = inicializarAuth('usuarios');
  
  if (usuario) {
    // Verificar que sea SuperUser
    if (usuario.rol !== 'SuperUser') {
      alert('No tienes permisos para acceder a esta página');
      window.location.href = 'dashboard.html';
      return;
    }
    
    console.log('SuperUser autenticado:', usuario);
    cargarUsuarios();
  }
});

async function cargarUsuarios() {
  try {
    const response = await fetch('/users');
    
    if (response.ok) {
      const usuarios = await response.json();
      mostrarUsuarios(usuarios);
    } else {
      mostrarError('Error al cargar usuarios');
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarError('No se pudo conectar con el servidor');
  }
}

function mostrarUsuarios(usuarios) {
  const tableBody = document.getElementById('usuariosTableBody');
  
  if (!tableBody) return;
  
  tableBody.innerHTML = '';
  
  if (usuarios.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" class="no-tickets">No hay usuarios registrados</td>
      </tr>
    `;
    return;
  }
  
  usuarios.forEach(usuario => {
    const fila = document.createElement('tr');
    fila.className = 'ticket-row';
    
    const fecha = new Date(usuario.createdAt).toLocaleDateString('es-ES');
    const rolClass = usuario.rol.toLowerCase().replace('user', '');
    
    fila.innerHTML = `
      <td><strong>${usuario.username}</strong></td>
      <td>${usuario.email}</td>
      <td><span class="role-badge role-${rolClass}">${usuario.rol}</span></td>
      <td>${fecha}</td>
      <td class="ticket-actions">
        ${usuario.rol !== 'SuperUser' ? `
          <button class="btn btn-sm btn-danger" onclick='desactivarUsuario("${usuario._id}", "${usuario.username}")'>
            <i class="fas fa-user-slash"></i>
            Desactivar
          </button>
        ` : '<span class="text-muted">Protegido</span>'}
      </td>
    `;
    
    tableBody.appendChild(fila);
  });
}

function abrirModalNuevoUsuario() {
  const modal = document.getElementById('nuevoUsuarioModal');
  modal.style.display = 'block';
  document.body.style.overflow = 'hidden';
  
  // Limpiar formulario
  document.getElementById('formNuevoUsuario').reset();
}

function cerrarModalNuevoUsuario() {
  const modal = document.getElementById('nuevoUsuarioModal');
  modal.style.display = 'none';
  document.body.style.overflow = 'auto';
}

async function crearUsuario() {
  const username = document.getElementById('nuevoUsername').value.trim();
  const email = document.getElementById('nuevoEmail').value.trim();
  const password = document.getElementById('nuevoPassword').value;
  const rol = document.getElementById('nuevoRol').value;
  
  if (!username || !email || !password) {
    alert('Por favor, completa todos los campos');
    return;
  }
  
  const usuario = obtenerUsuarioActual();
  
  try {
    const response = await fetch('/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username,
        email,
        password,
        rol,
        createdBy: usuario.id
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      alert('✅ Usuario creado exitosamente');
      cerrarModalNuevoUsuario();
      cargarUsuarios();
    } else {
      alert(`Error: ${data.message}`);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error al crear usuario');
  }
}

async function desactivarUsuario(userId, username) {
  if (!confirm(`¿Estás seguro de que deseas desactivar al usuario "${username}"?`)) {
    return;
  }
  
  const usuario = obtenerUsuarioActual();
  
  try {
    const response = await fetch(`/users/${userId}/deactivate`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        adminId: usuario.id
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      alert('✅ Usuario desactivado exitosamente');
      cargarUsuarios();
    } else {
      alert(`Error: ${data.message}`);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error al desactivar usuario');
  }
}

function mostrarError(mensaje) {
  const tableBody = document.getElementById('usuariosTableBody');
  if (tableBody) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" class="error-message">${mensaje}</td>
      </tr>
    `;
  }
}

function obtenerUsuarioActual() {
  const usuarioStr = localStorage.getItem('usuario');
  return usuarioStr ? JSON.parse(usuarioStr) : null;
}

// Cerrar modal con click fuera o Escape
window.addEventListener('click', function(event) {
  const modal = document.getElementById('nuevoUsuarioModal');
  if (event.target === modal) {
    cerrarModalNuevoUsuario();
  }
});

document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') {
    const modal = document.getElementById('nuevoUsuarioModal');
    if (modal.style.display === 'block') {
      cerrarModalNuevoUsuario();
    }
  }
});
