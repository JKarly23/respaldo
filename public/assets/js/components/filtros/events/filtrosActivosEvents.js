export function inicializarEventosFiltrosActivos() {
    const filtrosActivos = document.getElementById('filtrosActivos');
    const toggleFiltrosActivos = document.getElementById('toggleFiltrosActivos');
    const iconToggleFiltros = document.getElementById('iconToggleFiltros');
    
    if (!filtrosActivos || !toggleFiltrosActivos || !iconToggleFiltros) return;

    // Ocultar el contenedor de filtros activos inicialmente si está vacío
    if (filtrosActivos.children.length === 0) {
        filtrosActivos.classList.add('d-none');
    }

    // Evento para mostrar/ocultar los filtros activos
    toggleFiltrosActivos.addEventListener('click', function () {
        // Solo permitir toggle si hay filtros activos
        if (filtrosActivos.children.length > 0) {
            if (filtrosActivos.classList.contains('d-none')) {
                // Mostrar filtros
                filtrosActivos.classList.remove('d-none');
                toggleFiltrosActivos.classList.remove('collapsed');
                iconToggleFiltros.classList.replace('fa-chevron-right', 'fa-chevron-down');
            } else {
                // Ocultar filtros
                filtrosActivos.classList.add('d-none');
                toggleFiltrosActivos.classList.add('collapsed');
                iconToggleFiltros.classList.replace('fa-chevron-down', 'fa-chevron-right');
            }
        }
    });

    // Agregar eventos a los filtros básicos
    const filtrosBasicos = document.querySelectorAll('#filtrosBasicosContent .dropdown-item');
    if (filtrosBasicos.length > 0) {
        filtrosBasicos.forEach(item => {
            item.addEventListener('click', function (e) {
                e.preventDefault();

                const texto = this.textContent.trim();
                const filtro = {
                    campo: 'Filtro básico',
                    operador: '',
                    valor: texto
                };

                if (window.filtrosManager) {
                    window.filtrosManager.reemplazarFiltrosActivos([filtro]);
                    
                    // Asegurar que el contenedor y el toggle estén correctamente configurados
                    filtrosActivos.classList.remove('d-none');
                    toggleFiltrosActivos.classList.remove('collapsed');
                    iconToggleFiltros.classList.replace('fa-chevron-right', 'fa-chevron-down');
                }
                
                const filtrosPanel = document.getElementById('filtrosPanel');
                if (filtrosPanel) {
                    filtrosPanel.style.display = 'none';
                }
            });
        });
    }

    // Agregar eventos a los filtros guardados
    const filtrosGuardados = document.querySelectorAll('#filtrosGuardadosContent td.dropdown-item');
    if (filtrosGuardados.length > 0) {
        filtrosGuardados.forEach(item => {
            item.addEventListener('click', function (e) {
                e.preventDefault();

                const texto = this.textContent.trim();
                const filtro = {
                    campo: 'Filtro guardado',
                    operador: '',
                    valor: texto
                };

                if (window.filtrosManager) {
                    window.filtrosManager.reemplazarFiltrosActivos([filtro]);
                    
                    // Asegurar que el contenedor y el toggle estén correctamente configurados
                    filtrosActivos.classList.remove('d-none');
                    toggleFiltrosActivos.classList.remove('collapsed');
                    iconToggleFiltros.classList.replace('fa-chevron-right', 'fa-chevron-down');
                }
                
                const filtrosPanel = document.getElementById('filtrosPanel');
                if (filtrosPanel) {
                    filtrosPanel.style.display = 'none';
                }
            });
        });
    }

    // Observar cambios en el contenedor de filtros activos
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                // Si no hay filtros, ocultar el contenedor
                if (filtrosActivos.children.length === 0) {
                    filtrosActivos.classList.add('d-none');
                }
            }
        });
    });

    // Configurar el observador
    observer.observe(filtrosActivos, { childList: true });
}