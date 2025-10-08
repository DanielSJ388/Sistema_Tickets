// Configuración de la API
// En desarrollo, Vite redirigirá automáticamente estas rutas al backend (puerto 5000)
// En producción, asegúrate de configurar las URLs correctas

const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// URL base de la API
// En desarrollo con Vite, usa rutas relativas para aprovechar el proxy
// En producción, usa la URL completa de tu backend
export const API_BASE_URL = isDevelopment ? '' : 'http://localhost:5000';

// Endpoints de la API
export const API_ENDPOINTS = {
  // Autenticación
  register: `${API_BASE_URL}/register`,
  login: `${API_BASE_URL}/login`,
  
  // Usuarios
  users: `${API_BASE_URL}/users`,
  
  // Tickets
  tickets: `${API_BASE_URL}/tickets`,
  ticketsByUser: (userId) => `${API_BASE_URL}/tickets/assigned/${userId}`,
  ticketById: (ticketId) => `${API_BASE_URL}/tickets/${ticketId}`,
  
  // Uploads
  uploads: `${API_BASE_URL}/uploads`,
  uploadFile: (fileName) => `${API_BASE_URL}/uploads/${fileName}`,
};

// Helper para hacer peticiones fetch con manejo de errores
export async function fetchAPI(endpoint, options = {}) {
  try {
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error en la petición:', error);
    throw error;
  }
}

console.log('🔧 API Config cargada:', { 
  isDevelopment, 
  API_BASE_URL,
  note: 'En desarrollo, Vite redirige las peticiones al backend automáticamente'
});
