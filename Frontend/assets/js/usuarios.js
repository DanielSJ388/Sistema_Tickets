document.addEventListener('DOMContentLoaded', () => {
  const usuario = inicializarAuth('usuarios');
  
  if (usuario) {
    console.log('Usuario autenticado:', usuario);
    
    // Verificar que sea SuperUser
    if (usuario.rol !== 'SuperUser') {
      mostrarAlerta('Acceso denegado. Solo SuperUser puede acceder a esta sección.', 'error');
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 2000);
      return;
    }
    
    cargarUsuarios();
  } else {
    console.error('No se pudo autenticar el usuario');
  }
});

// --- CARGAR LISTA DE USUARIOS ---
async function cargarUsuarios() {
  try {
    console.log('Cargando usuarios...');
    
    const response = await fetch('/users');
    
    if (response.ok) {
      const usuarios = await response.json();
      console.log('Usuarios cargados:', usuarios.length);
      mostrarUsuarios(usuarios);
    } else {
      mostrarError('Error al cargar usuarios');
    }
  } catch (error) {
    console.error('Error al cargar usuarios:', error);
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
        <td colspan="6" class="no-tickets">
          <div class="empty-state">
            <i class="fas fa-users"></i>
            <p>No hay usuarios registrados</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }
  
  usuarios.forEach(usuario => {
    const fila = document.createElement('tr');
    fila.className = 'ticket-row';
    
    const fecha = new Date(usuario.createdAt).toLocaleDateString('es-ES');
    const rol = usuario.rol || 'Usuario';
    
    // Badge de rol con color
    let rolBadge = '';
    if (rol === 'SuperUser') {
      rolBadge = '<span class="role-badge role-super">👑 SuperUser</span>';
    } else if (rol === 'Administrador') {
      rolBadge = '<span class="role-badge role-administrador">🛡️ Administrador</span>';
    } else {
      rolBadge = '<span class="role-badge role-usuario">👤 Usuario</span>';
    }
    
    // Badge de departamento
    let departamentoBadge = '-';
    if (usuario.departamento) {
      const iconos = {
        'Soporte Técnico': '🛠️',
        'Recursos Humanos': '👥',
        'Finanzas': '💰',
        'Ventas': '💼',
        'Marketing': '📢',
        'Operaciones': '⚙️',
        'Desarrollo': '💻'
      };
      const icono = iconos[usuario.departamento] || '📁';
      departamentoBadge = `<span class="department-badge">${icono} ${usuario.departamento}</span>`;
    }
    
    // Botones de acciones (no mostrar para SuperUser)
    let acciones = '';
    if (rol !== 'SuperUser') {
      acciones = `
        <button class="btn btn-sm btn-primary" onclick='editarUsuario(${JSON.stringify(usuario).replace(/'/g, "&#39;")})' title="Editar usuario">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn btn-sm btn-danger" onclick='desactivarUsuario("${usuario._id}", "${usuario.username}")' title="Desactivar usuario">
          <i class="fas fa-user-slash"></i>
        </button>
      `;
    } else {
      acciones = '<span class="text-muted"><i class="fas fa-lock"></i> Protegido</span>';
    }
    
    // Agregar columna de departamento si no existe
    const headers = document.querySelectorAll('.tickets-table th');
    if (headers.length === 5) {
      const headerRow = document.querySelector('.tickets-table thead tr');
      const thDepartamento = document.createElement('th');
      thDepartamento.textContent = 'Departamento';
      headerRow.insertBefore(thDepartamento, headers[3]);
    }
    
    fila.innerHTML = `
      <td class="ticket-id">${usuario.username}</td>
      <td>${usuario.email}</td>
      <td>${rolBadge}</td>
      <td>${departamentoBadge}</td>
      <td class="ticket-date">${fecha}</td>
      <td class="ticket-actions">${acciones}</td>
    `;
    
    tableBody.appendChild(fila);
  });
}

function mostrarError(mensaje) {
  const tableBody = document.getElementById('usuariosTableBody');
  
  if (!tableBody) return;
  
  tableBody.innerHTML = `
    <tr>
      <td colspan="6" class="error-message">
        <div class="error-state">
          <i class="fas fa-exclamation-triangle"></i>
          <p>${mensaje}</p>
        </div>
      </td>
    </tr>
  `;
}

// --- MODAL NUEVO USUARIO ---
function abrirModalNuevoUsuario() {
  const modal = document.getElementById('nuevoUsuarioModal');
  
  // Limpiar formulario
  document.getElementById('nuevoUsername').value = '';
  document.getElementById('nuevoEmail').value = '';
  document.getElementById('nuevoPassword').value = '';
  document.getElementById('nuevoRol').value = 'Usuario';
  document.getElementById('nuevoDepartamento').value = '';
  document.getElementById('departamentoGroup').style.display = 'none';
  
  modal.style.display = 'block';
  document.body.style.overflow = 'hidden';
}

function cerrarModalNuevoUsuario() {
  const modal = document.getElementById('nuevoUsuarioModal');
  modal.style.display = 'none';
  document.body.style.overflow = 'auto';
}

function toggleDepartamento() {
  const rol = document.getElementById('nuevoRol').value;
  const departamentoGroup = document.getElementById('departamentoGroup');
  const departamentoSelect = document.getElementById('nuevoDepartamento');
  
  if (rol === 'Administrador') {
    departamentoGroup.style.display = 'block';
    departamentoSelect.required = true;
  } else {
    departamentoGroup.style.display = 'none';
    departamentoSelect.required = false;
    departamentoSelect.value = '';
  }
}

async function crearUsuario() {
  const username = document.getElementById('nuevoUsername').value.trim();
  const email = document.getElementById('nuevoEmail').value.trim();
  const password = document.getElementById('nuevoPassword').value;
  const rol = document.getElementById('nuevoRol').value;
  const departamento = document.getElementById('nuevoDepartamento').value;
  
  // Validaciones
  if (!username || !email || !password) {
    mostrarNotificacion('Por favor, completa todos los campos requeridos', 'warning');
    return;
  }
  
  if (rol === 'Administrador' && !departamento) {
    mostrarNotificacion('Los Administradores deben tener un departamento asignado', 'warning');
    return;
  }
  
  if (password.length < 6) {
    mostrarNotificacion('La contraseña debe tener al menos 6 caracteres', 'warning');
    return;
  }
  
  const usuario = obtenerUsuarioActual();
  
  const btnCrear = event.target;
  btnCrear.disabled = true;
  btnCrear.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creando...';
  
  try {
    const datosUsuario = {
      username,
      email,
      password,
      rol,
      createdBy: usuario.id
    };
    
    // Solo agregar departamento si es Administrador
    if (rol === 'Administrador') {
      datosUsuario.departamento = departamento;
    }
    
    console.log('Creando usuario con datos:', datosUsuario);
    
    const response = await fetch('/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(datosUsuario)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      const mensajeDept = rol === 'Administrador' ? ` en ${departamento}` : '';
      mostrarNotificacion(`Usuario creado exitosamente: ${username}${mensajeDept}`, 'success');
      cerrarModalNuevoUsuario();
      cargarUsuarios();
    } else {
      mostrarNotificacion(`Error: ${data.message}`, 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarNotificacion('Error al crear usuario. Por favor, intenta nuevamente.', 'error');
  } finally {
    btnCrear.disabled = false;
    btnCrear.innerHTML = '<i class="fas fa-check"></i> Crear Usuario';
  }
}

async function desactivarUsuario(userId, username) {
  const confirmar = await mostrarConfirmacion(
    `¿Estás seguro de que deseas desactivar al usuario "${username}"?<br><br>El usuario no podrá iniciar sesión hasta que sea reactivado.`,
    {
      titulo: 'Desactivar Usuario',
      textoConfirmar: 'Sí, desactivar',
      textoCancelar: 'Cancelar',
      tipo: 'warning'
    }
  );
  
  if (!confirmar) return;
  
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
      mostrarNotificacion('Usuario desactivado exitosamente', 'success');
      cargarUsuarios();
    } else {
      mostrarNotificacion(`Error: ${data.message}`, 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarNotificacion('Error al desactivar usuario', 'error');
  }
}

// --- MODAL EDITAR USUARIO ---
function editarUsuario(usuario) {
  const modal = document.getElementById('editarUsuarioModal');
  
  // Cargar datos del usuario
  document.getElementById('editarUserId').value = usuario._id;
  document.getElementById('editarUsername').value = usuario.username;
  document.getElementById('editarEmail').value = usuario.email;
  document.getElementById('editarRol').value = usuario.rol || 'Usuario';
  
  // Mostrar/ocultar departamento según el rol
  if (usuario.rol === 'Administrador') {
    document.getElementById('departamentoGroupEditar').style.display = 'block';
    document.getElementById('editarDepartamento').value = usuario.departamento || '';
    document.getElementById('editarDepartamento').required = true;
  } else {
    document.getElementById('departamentoGroupEditar').style.display = 'none';
    document.getElementById('editarDepartamento').required = false;
  }
  
  // Resetear campo de contraseña
  document.getElementById('cambiarPasswordCheck').checked = false;
  document.getElementById('passwordGroupEditar').style.display = 'none';
  document.getElementById('editarPassword').value = '';
  document.getElementById('editarPassword').required = false;
  
  modal.style.display = 'block';
  document.body.style.overflow = 'hidden';
}

function cerrarModalEditarUsuario() {
  const modal = document.getElementById('editarUsuarioModal');
  modal.style.display = 'none';
  document.body.style.overflow = 'auto';
}

function toggleDepartamentoEditar() {
  const rol = document.getElementById('editarRol').value;
  const departamentoGroup = document.getElementById('departamentoGroupEditar');
  const departamentoSelect = document.getElementById('editarDepartamento');
  
  if (rol === 'Administrador') {
    departamentoGroup.style.display = 'block';
    departamentoSelect.required = true;
  } else {
    departamentoGroup.style.display = 'none';
    departamentoSelect.required = false;
    departamentoSelect.value = '';
  }
}

function toggleCambiarPassword() {
  const cambiarPassword = document.getElementById('cambiarPasswordCheck').checked;
  const passwordGroup = document.getElementById('passwordGroupEditar');
  const passwordInput = document.getElementById('editarPassword');
  
  if (cambiarPassword) {
    passwordGroup.style.display = 'block';
    passwordInput.required = true;
  } else {
    passwordGroup.style.display = 'none';
    passwordInput.required = false;
    passwordInput.value = '';
  }
}

async function guardarCambiosUsuario() {
  const userId = document.getElementById('editarUserId').value;
  const username = document.getElementById('editarUsername').value.trim();
  const email = document.getElementById('editarEmail').value.trim();
  const rol = document.getElementById('editarRol').value;
  const departamento = document.getElementById('editarDepartamento').value;
  const cambiarPassword = document.getElementById('cambiarPasswordCheck').checked;
  const password = document.getElementById('editarPassword').value;
  
  // Validaciones
  if (!username || !email) {
    mostrarNotificacion('Por favor, completa todos los campos requeridos', 'warning');
    return;
  }
  
  if (rol === 'Administrador' && !departamento) {
    mostrarNotificacion('Los Administradores deben tener un departamento asignado', 'warning');
    return;
  }
  
  if (cambiarPassword && password.length < 6) {
    mostrarNotificacion('La contraseña debe tener al menos 6 caracteres', 'warning');
    return;
  }
  
  const usuario = obtenerUsuarioActual();
  
  const btnGuardar = event.target;
  btnGuardar.disabled = true;
  btnGuardar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
  
  try {
    const datosActualizacion = {
      username,
      email,
      rol,
      departamento: rol === 'Administrador' ? departamento : null,
      adminId: usuario.id
    };
    
    // Solo agregar contraseña si se va a cambiar
    if (cambiarPassword && password) {
      datosActualizacion.password = password;
    }
    
    console.log('Actualizando usuario con datos:', datosActualizacion);
    
    const response = await fetch(`/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(datosActualizacion)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      const mensajeDept = rol === 'Administrador' ? ` - Departamento: ${departamento}` : '';
      const mensajePassword = cambiarPassword ? ' (contraseña actualizada)' : '';
      mostrarNotificacion(`Usuario actualizado: ${username}${mensajeDept}${mensajePassword}`, 'success');
      cerrarModalEditarUsuario();
      cargarUsuarios();
    } else {
      mostrarNotificacion(`Error: ${data.message}`, 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarNotificacion('Error al actualizar usuario. Por favor, intenta nuevamente.', 'error');
  } finally {
    btnGuardar.disabled = false;
    btnGuardar.innerHTML = '<i class="fas fa-save"></i> Guardar Cambios';
  }
}

function obtenerUsuarioActual() {
  const usuarioStr = localStorage.getItem('usuario');
  return usuarioStr ? JSON.parse(usuarioStr) : null;
}

// Cerrar modales con click fuera o Escape
window.addEventListener('click', function(event) {
  const modalNuevo = document.getElementById('nuevoUsuarioModal');
  const modalEditar = document.getElementById('editarUsuarioModal');
  
  if (event.target === modalNuevo) {
    cerrarModalNuevoUsuario();
  } else if (event.target === modalEditar) {
    cerrarModalEditarUsuario();
  }
});

document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') {
    const modalNuevo = document.getElementById('nuevoUsuarioModal');
    const modalEditar = document.getElementById('editarUsuarioModal');
    
    if (modalNuevo.style.display === 'block') {
      cerrarModalNuevoUsuario();
    } else if (modalEditar.style.display === 'block') {
      cerrarModalEditarUsuario();
    }
  }
});
