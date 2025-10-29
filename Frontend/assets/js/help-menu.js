// Toggle del menú desplegable de ayuda
function toggleHelpMenu() {
    const dropdown = document.getElementById('helpDropdown');
    dropdown.classList.toggle('show');
}

// Cerrar el menú si se hace clic fuera de él
document.addEventListener('click', function(event) {
    const helpContainer = document.querySelector('.help-menu-container');
    const dropdown = document.getElementById('helpDropdown');
    
    if (helpContainer && !helpContainer.contains(event.target)) {
        dropdown?.classList.remove('show');
    }
});

// Función para toggle de preguntas FAQ
function toggleFaq(button) {
    const answer = button.nextElementSibling;
    const isActive = button.classList.contains('active');
    
    // Cerrar todas las preguntas
    document.querySelectorAll('.faq-question').forEach(q => {
        q.classList.remove('active');
        q.nextElementSibling.classList.remove('show');
    });
    
    // Abrir la pregunta clickeada si no estaba activa
    if (!isActive) {
        button.classList.add('active');
        answer.classList.add('show');
    }
}

// Abrir modal de preguntas frecuentes
function abrirPreguntasFrecuentes() {
    document.getElementById('faqModal').style.display = 'block';
    document.getElementById('helpDropdown').classList.remove('show');
}

// Cerrar modal de FAQ
function cerrarFaqModal() {
    document.getElementById('faqModal').style.display = 'none';
}

// Abrir guía de usuario
function abrirGuiaUsuario() {
    alert('La Guía de Usuario estará disponible próximamente.\n\nAquí encontrarás documentación detallada sobre cómo usar todas las funcionalidades del sistema.');
    document.getElementById('helpDropdown').classList.remove('show');
}

// Abrir soporte
function abrirSoporte() {
    const mensaje = `¿Necesitas ayuda?\n\nContacta con nuestro equipo de soporte:\n\n📧 Email: soporte@sistematickets.com\n📞 Teléfono: +52 (555) 123-4567\n💬 Chat: Disponible de 9:00 AM - 6:00 PM`;
    alert(mensaje);
    document.getElementById('helpDropdown').classList.remove('show');
}

// Abrir tutoriales
function abrirTutoriales() {
    alert('Video Tutoriales\n\nPróximamente tendremos disponibles video tutoriales para ayudarte a usar el sistema de forma más efectiva.');
    document.getElementById('helpDropdown').classList.remove('show');
}

// Abrir acerca de
function abrirAcercaDe() {
    const version = '1.0.0';
    const mensaje = `Sistema de Tickets v${version}\n\n© 2024 Sistema Tickets\nTodos los derechos reservados.\n\nDesarrollado para gestionar eficientemente las solicitudes de soporte técnico.`;
    alert(mensaje);
    document.getElementById('helpDropdown').classList.remove('show');
}

// Cerrar modal al hacer clic fuera
window.onclick = function(event) {
    const faqModal = document.getElementById('faqModal');
    if (event.target == faqModal) {
        cerrarFaqModal();
    }
}
