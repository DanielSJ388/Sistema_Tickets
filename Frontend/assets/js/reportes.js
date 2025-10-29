// --- VARIABLES GLOBALES ---
let chartEstados, chartPrioridades, chartTendencia, chartUsuarios;

// --- LÓGICA PRINCIPAL AL CARGAR LA PÁGINA ---
document.addEventListener('DOMContentLoaded', () => {
  const usuario = inicializarAuth('reportes');
  
  if (usuario) {
    console.log('Usuario autenticado:', usuario);
    cargarEstadisticas();
  } else {
    console.error('No se pudo autenticar el usuario');
  }
});

// --- CARGAR Y PROCESAR ESTADÍSTICAS ---
async function cargarEstadisticas() {
  try {
    const response = await fetch('/tickets');
    
    if (!response.ok) {
      throw new Error('Error al cargar tickets');
    }
    
    const tickets = await response.json();
    console.log('Tickets cargados para estadísticas:', tickets.length);
    
    // Procesar datos
    procesarKPIs(tickets);
    procesarGraficaEstados(tickets);
    procesarGraficaPrioridades(tickets);
    procesarGraficaTendencia(tickets);
    procesarGraficaUsuarios(tickets);
    procesarTablaCategorias(tickets);
    
  } catch (error) {
    console.error('Error al cargar estadísticas:', error);
    mostrarError('No se pudieron cargar las estadísticas');
  }
}

// --- PROCESAR KPIs ---
function procesarKPIs(tickets) {
  const total = tickets.length;
  const abiertos = tickets.filter(t => (t.Status || '').toLowerCase() === 'open').length;
  const enProgreso = tickets.filter(t => (t.Status || '').toLowerCase() === 'in progress').length;
  const resueltos = tickets.filter(t => 
    ['resolved', 'closed'].includes((t.Status || '').toLowerCase())
  ).length;
  
  document.getElementById('totalTickets').textContent = total;
  document.getElementById('ticketsAbiertos').textContent = abiertos;
  document.getElementById('ticketsEnProgreso').textContent = enProgreso;
  document.getElementById('ticketsResueltos').textContent = resueltos;
}

// --- GRÁFICA DE ESTADOS ---
function procesarGraficaEstados(tickets) {
  const estados = {};
  
  tickets.forEach(ticket => {
    const estado = ticket.Status || 'Open';
    estados[estado] = (estados[estado] || 0) + 1;
  });
  
  const ctx = document.getElementById('chartEstados').getContext('2d');
  
  if (chartEstados) {
    chartEstados.destroy();
  }
  
  chartEstados = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: Object.keys(estados),
      datasets: [{
        data: Object.values(estados),
        backgroundColor: [
          '#ef4444',
          '#3b82f6',
          '#10b981',
          '#6366f1'
        ],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  });
}

// --- GRÁFICA DE PRIORIDADES ---
function procesarGraficaPrioridades(tickets) {
  const prioridades = {
    'Low': 0,
    'Medium': 0,
    'High': 0
  };
  
  tickets.forEach(ticket => {
    const prioridad = ticket.Priority || 'Medium';
    prioridades[prioridad] = (prioridades[prioridad] || 0) + 1;
  });
  
  const ctx = document.getElementById('chartPrioridades').getContext('2d');
  
  if (chartPrioridades) {
    chartPrioridades.destroy();
  }
  
  chartPrioridades = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(prioridades),
      datasets: [{
        label: 'Cantidad de Tickets',
        data: Object.values(prioridades),
        backgroundColor: [
          '#10b981',
          '#f59e0b',
          '#ef4444'
        ],
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  });
}

// --- GRÁFICA DE TENDENCIA (ÚLTIMOS 7 DÍAS) ---
function procesarGraficaTendencia(tickets) {
  const ultimos7Dias = {};
  const hoy = new Date();
  
  // Inicializar últimos 7 días
  for (let i = 6; i >= 0; i--) {
    const fecha = new Date(hoy);
    fecha.setDate(fecha.getDate() - i);
    const fechaStr = fecha.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
    ultimos7Dias[fechaStr] = 0;
  }
  
  // Contar tickets por día
  tickets.forEach(ticket => {
    const fecha = new Date(ticket.CreatedAt);
    const fechaStr = fecha.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
    
    if (ultimos7Dias.hasOwnProperty(fechaStr)) {
      ultimos7Dias[fechaStr]++;
    }
  });
  
  const ctx = document.getElementById('chartTendencia').getContext('2d');
  
  if (chartTendencia) {
    chartTendencia.destroy();
  }
  
  chartTendencia = new Chart(ctx, {
    type: 'line',
    data: {
      labels: Object.keys(ultimos7Dias),
      datasets: [{
        label: 'Tickets Creados',
        data: Object.values(ultimos7Dias),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: '#3b82f6'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  });
}

// --- GRÁFICA DE TICKETS POR USUARIO ---
function procesarGraficaUsuarios(tickets) {
  const usuarios = {};
  
  tickets.forEach(ticket => {
    const usuario = ticket.usuario_nombre || 'Sin usuario';
    usuarios[usuario] = (usuarios[usuario] || 0) + 1;
  });
  
  // Ordenar y tomar top 5
  const top5Usuarios = Object.entries(usuarios)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  const ctx = document.getElementById('chartUsuarios').getContext('2d');
  
  if (chartUsuarios) {
    chartUsuarios.destroy();
  }
  
  chartUsuarios = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: top5Usuarios.map(u => u[0]),
      datasets: [{
        label: 'Tickets Creados',
        data: top5Usuarios.map(u => u[1]),
        backgroundColor: '#8b5cf6',
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      indexAxis: 'y',
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  });
}

// --- TABLA DE CATEGORÍAS ---
function procesarTablaCategorias(tickets) {
  const categorias = {};
  
  tickets.forEach(ticket => {
    const categoria = ticket.categoria || 'Sin categoría';
    
    if (!categorias[categoria]) {
      categorias[categoria] = {
        total: 0,
        abiertos: 0,
        enProgreso: 0,
        resueltos: 0,
        tiempos: []
      };
    }
    
    categorias[categoria].total++;
    
    const estado = (ticket.Status || '').toLowerCase();
    if (estado === 'open') categorias[categoria].abiertos++;
    else if (estado === 'in progress') categorias[categoria].enProgreso++;
    else if (['resolved', 'closed'].includes(estado)) categorias[categoria].resueltos++;
    
    // Calcular tiempo de resolución si está cerrado
    if (['resolved', 'closed'].includes(estado) && ticket.UpdatedAt) {
      const creado = new Date(ticket.CreatedAt);
      const actualizado = new Date(ticket.UpdatedAt);
      const horas = (actualizado - creado) / (1000 * 60 * 60);
      categorias[categoria].tiempos.push(horas);
    }
  });
  
  const tbody = document.getElementById('tablaCategorias');
  tbody.innerHTML = '';
  
  Object.entries(categorias).forEach(([nombre, stats]) => {
    const tiempoPromedio = stats.tiempos.length > 0
      ? (stats.tiempos.reduce((a, b) => a + b, 0) / stats.tiempos.length).toFixed(1)
      : 'N/A';
    
    const fila = document.createElement('tr');
    fila.innerHTML = `
      <td><strong>${nombre}</strong></td>
      <td>${stats.total}</td>
      <td><span class="badge badge-red">${stats.abiertos}</span></td>
      <td><span class="badge badge-blue">${stats.enProgreso}</span></td>
      <td><span class="badge badge-green">${stats.resueltos}</span></td>
      <td>${tiempoPromedio !== 'N/A' ? tiempoPromedio + ' hrs' : 'N/A'}</td>
    `;
    tbody.appendChild(fila);
  });
}

function mostrarError(mensaje) {
  const tbody = document.getElementById('tablaCategorias');
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="error-message">
          <i class="fas fa-exclamation-triangle"></i>
          ${mensaje}
        </td>
      </tr>
    `;
  }
}
