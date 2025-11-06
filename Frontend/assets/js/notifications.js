/**
 * Sistema de notificaciones flotantes
 * @param {string} mensaje - Mensaje a mostrar
 * @param {string} tipo - Tipo de notificación: 'success', 'error', 'warning', 'info'
 * @param {number} duracion - Duración en milisegundos (por defecto 3500)
 */
function mostrarNotificacion(mensaje, tipo = 'info', duracion = 3500) {
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
  
  // Remover notificación después de la duración especificada
  setTimeout(() => {
    notificacion.classList.remove('show');
    
    // Remover del DOM después de la animación
    setTimeout(() => {
      if (notificacion.parentNode) {
        notificacion.remove();
      }
    }, 400);
  }, duracion);
}

/**
 * Mostrar alerta simple con botón OK
 * @param {string} mensaje - Mensaje a mostrar
 * @param {string} tipo - Tipo de alerta: 'success', 'error', 'warning', 'info'
 * @returns {Promise<boolean>} - Resuelve cuando se cierra la alerta
 */
function mostrarAlerta(mensaje, tipo = 'info') {
  return new Promise((resolve) => {
    // Crear modal de alerta
    const modal = document.createElement('div');
    modal.className = 'modal modal-alert';
    modal.style.display = 'block';
    
    const iconos = {
      'success': { icon: 'fa-check-circle', color: '#10b981' },
      'error': { icon: 'fa-exclamation-circle', color: '#ef4444' },
      'warning': { icon: 'fa-exclamation-triangle', color: '#f59e0b' },
      'info': { icon: 'fa-info-circle', color: '#3b82f6' }
    };
    
    const tipoInfo = iconos[tipo] || iconos.info;
    
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 450px;">
        <div class="modal-body" style="text-align: center; padding: 2rem;">
          <i class="fas ${tipoInfo.icon}" style="font-size: 3rem; color: ${tipoInfo.color}; margin-bottom: 1rem;"></i>
          <p style="font-size: 1.1rem; line-height: 1.6; color: var(--text-color);">${mensaje}</p>
        </div>
        <div class="modal-footer" style="justify-content: center;">
          <button class="btn btn-primary" id="alertOkBtn">
            <i class="fas fa-check"></i>
            Entendido
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    // Agregar evento al botón OK
    const okBtn = modal.querySelector('#alertOkBtn');
    okBtn.onclick = () => {
      modal.remove();
      document.body.style.overflow = 'auto';
      resolve(true);
    };
    
    // Cerrar con Escape
    const escapeHandler = (e) => {
      if (e.key === 'Escape') {
        modal.remove();
        document.body.style.overflow = 'auto';
        document.removeEventListener('keydown', escapeHandler);
        resolve(true);
      }
    };
    document.addEventListener('keydown', escapeHandler);
  });
}

/**
 * Mostrar modal de confirmación con botones Sí/No
 * @param {string} mensaje - Mensaje de confirmación
 * @param {Object} opciones - Opciones personalizadas
 * @returns {Promise<boolean>} - true si confirma, false si cancela
 */
function mostrarConfirmacion(mensaje, opciones = {}) {
  return new Promise((resolve) => {
    const {
      titulo = 'Confirmar acción',
      textoConfirmar = 'Confirmar',
      textoCancelar = 'Cancelar',
      tipo = 'warning'
    } = opciones;
    
    // Crear modal de confirmación
    const modal = document.createElement('div');
    modal.className = 'modal modal-confirmacion';
    modal.style.display = 'block';
    
    const colores = {
      'success': '#10b981',
      'error': '#ef4444',
      'warning': '#f59e0b',
      'info': '#3b82f6'
    };
    
    const iconos = {
      'success': 'fa-check-circle',
      'error': 'fa-times-circle',
      'warning': 'fa-exclamation-triangle',
      'info': 'fa-question-circle'
    };
    
    const colorHeader = colores[tipo] || colores.warning;
    const icono = iconos[tipo] || iconos.warning;
    
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 500px;">
        <div class="modal-header" style="background: ${colorHeader};">
          <h2>
            <i class="fas ${icono}"></i>
            ${titulo}
          </h2>
        </div>
        <div class="modal-body" style="padding: 2rem;">
          <p style="font-size: 1.05rem; line-height: 1.6; color: var(--text-color);">${mensaje}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-success" id="confirmBtn">
            <i class="fas fa-check"></i>
            ${textoConfirmar}
          </button>
          <button class="btn btn-secondary" id="cancelBtn">
            <i class="fas fa-times"></i>
            ${textoCancelar}
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    // Agregar eventos a los botones
    const confirmBtn = modal.querySelector('#confirmBtn');
    const cancelBtn = modal.querySelector('#cancelBtn');
    
    confirmBtn.onclick = () => {
      modal.remove();
      document.body.style.overflow = 'auto';
      resolve(true);
    };
    
    cancelBtn.onclick = () => {
      modal.remove();
      document.body.style.overflow = 'auto';
      resolve(false);
    };
    
    // Cerrar con Escape = Cancelar
    const escapeHandler = (e) => {
      if (e.key === 'Escape') {
        modal.remove();
        document.body.style.overflow = 'auto';
        document.removeEventListener('keydown', escapeHandler);
        resolve(false);
      }
    };
    document.addEventListener('keydown', escapeHandler);
    
    // Cerrar al hacer clic fuera del modal
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
        document.body.style.overflow = 'auto';
        resolve(false);
      }
    });
  });
}

/**
 * Mostrar modal de carga (loading)
 * @param {string} mensaje - Mensaje a mostrar durante la carga
 * @returns {Object} - Objeto con método close() para cerrar el modal
 */
function mostrarCarga(mensaje = 'Cargando...') {
  const modal = document.createElement('div');
  modal.className = 'modal modal-loading';
  modal.style.display = 'block';
  modal.id = 'loadingModal';
  
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 350px; text-align: center;">
      <div class="modal-body" style="padding: 2rem;">
        <div style="margin-bottom: 1rem;">
          <i class="fas fa-spinner fa-spin" style="font-size: 3rem; color: var(--primary-color);"></i>
        </div>
        <p style="font-size: 1.1rem; color: var(--text-color); margin: 0;">${mensaje}</p>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
  
  return {
    close: () => {
      modal.remove();
      document.body.style.overflow = 'auto';
    },
    updateMessage: (nuevoMensaje) => {
      const p = modal.querySelector('p');
      if (p) p.textContent = nuevoMensaje;
    }
  };
}

// Exportar funciones globalmente
window.mostrarNotificacion = mostrarNotificacion;
window.mostrarAlerta = mostrarAlerta;
window.mostrarConfirmacion = mostrarConfirmacion;
window.mostrarCarga = mostrarCarga;
