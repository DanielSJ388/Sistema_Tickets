class SidebarComponent {
  constructor(activeMenuItem = 'dashboard') {
    this.activeMenuItem = activeMenuItem;
    this.init();
  }

  init() {
    this.render();
    this.attachEvents();
    this.loadUserInfo();
  }

  render() {
    const sidebarHTML = `
      <aside class="sidebar">
        <div class="sidebar-header">
          🎫 SistemaTickets
        </div>
        
        <ul class="sidebar-menu">
          <li class="${this.activeMenuItem === 'dashboard' ? 'active' : ''}">
            <a href="dashboard.html">
              <i class="fas fa-tachometer-alt"></i>
              <span>Dashboard</span>
            </a>
          </li>
          <li class="${this.activeMenuItem === 'tickets' ? 'active' : ''}">
            <a href="list-ticket.html">
              <i class="fas fa-clipboard-list"></i>
              <span>Tickets Asignados</span>
            </a>
          </li>
          <li class="${this.activeMenuItem === 'my-tickets' ? 'active' : ''}">
            <a href="my-tickets.html">
              <i class="fas fa-ticket-alt"></i>
              <span>Mis Tickets Creados</span>
            </a>
          </li>
          <li class="${this.activeMenuItem === 'nuevo' ? 'active' : ''}">
            <a href="send_ticket.html">
              <i class="fas fa-plus-circle"></i>
              <span>Nuevo Ticket</span>
            </a>
          </li>
          <li class="${this.activeMenuItem === 'reportes' ? 'active' : ''}">
            <a href="reportes.html">
              <i class="fas fa-chart-bar"></i>
              <span>Reportes</span>
            </a>
          </li>
          <li class="${this.activeMenuItem === 'configuracion' ? 'active' : ''}">
            <a href="configuracion.html">
              <i class="fas fa-cog"></i>
              <span>Configuración</span>
            </a>
          </li>
        </ul>
        
        <div class="sidebar-footer">
          <div class="user-info" id="user-info">
            Cargando usuario...
          </div>
          <a href="#" class="logout-link">
            <i class="fas fa-sign-out-alt"></i>
            <span>Cerrar Sesión</span>
          </a>
        </div>
      </aside>
    `;

    // Insertar el sidebar al inicio del page-container
    const pageContainer = document.querySelector('.page-container');
    if (pageContainer) {
      pageContainer.insertAdjacentHTML('afterbegin', sidebarHTML);
    }
  }

  attachEvents() {
    const logoutLink = document.querySelector('.logout-link');
    if (logoutLink) {
      logoutLink.onclick = (e) => {
        e.preventDefault();
        this.cerrarSesion();
      };
    }
  }

  loadUserInfo() {
    // Usar 'usuario' para mantener consistencia con auth.js y dashboard.js
    const user = JSON.parse(localStorage.getItem('usuario'));
    const userInfoElement = document.getElementById('user-info');
    
    if (user && userInfoElement) {
      userInfoElement.textContent = `👤 ${user.username}`;
    }
  }

  cerrarSesion() {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      localStorage.removeItem('usuario');
      window.location.href = 'auth.html';
    }
  }

  setActiveMenuItem(menuItem) {
    this.activeMenuItem = menuItem;
    // Actualizar el estado activo en el DOM
    const menuItems = document.querySelectorAll('.sidebar-menu li');
    menuItems.forEach(item => item.classList.remove('active'));
    
    // Buscar el item activo por clase
    const activeItem = document.querySelector(`.sidebar-menu li:nth-child(${this.getMenuItemIndex(menuItem)})`);
    if (activeItem) {
      activeItem.classList.add('active');
    }
  }

  getMenuItemIndex(menuItem) {
    const menuMap = {
      'dashboard': 1,
      'tickets': 2,
      'my-tickets': 3,
      'nuevo': 4,
      'reportes': 5,
      'configuracion': 6
    };
    return menuMap[menuItem] || 1;
  }
}

// Función global para inicializar el sidebar
window.initSidebar = function(activeMenuItem = 'dashboard') {
  return new SidebarComponent(activeMenuItem);
};

// Función global para cerrar sesión (mantener compatibilidad)
window.cerrarSesion = function() {
  if (window.sidebarInstance) {
    window.sidebarInstance.cerrarSesion();
  }
};
