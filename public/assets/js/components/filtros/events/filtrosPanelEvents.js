// events/filtrosPanelEvents.js

// Función para inicializar los eventos del panel de filtros
export function inicializarEventosFiltrosPanel() {
    const btnFiltros = document.getElementById('btnFiltros');
    const filtrosPanel = document.getElementById('filtrosPanel');
    
    if (!btnFiltros || !filtrosPanel) return;

    // Mostrar/Ocultar panel de filtros
    btnFiltros.addEventListener('click', function (event) {
        event.stopPropagation(); // Evita que se dispare el cierre automático
        filtrosPanel.style.display = (filtrosPanel.style.display === 'none' || filtrosPanel.style.display === '') ? 'block' : 'none';
    });

    // Mostrar/Ocultar secciones internas
    document.querySelectorAll('.toggle-section').forEach(section => {
        section.addEventListener('click', function (event) {
            event.stopPropagation();

            const targetId = this.getAttribute('data-target');
            const content = document.querySelector(targetId);
            const icon = this.querySelector('.toggle-icon');

            if (content) {
                content.classList.toggle('d-none');
                icon.classList.toggle('rotate');
            }
        });
    });

    // Cerrar el panel si se hace clic fuera de él
    document.addEventListener('click', function (event) {
        const isClickInside = filtrosPanel.contains(event.target) || btnFiltros.contains(event.target);
        if (!isClickInside) {
            filtrosPanel.style.display = 'none';
        }
    });

    // Modificación: Cerrar el panel de filtros cuando se abre el aside
    const crearFiltroPersonalizado = document.getElementById('crearFiltroPersonalizado');
    if (crearFiltroPersonalizado) {
        crearFiltroPersonalizado.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            // Ocultar el panel de filtros
            filtrosPanel.style.display = 'none';
        });
    }
}
