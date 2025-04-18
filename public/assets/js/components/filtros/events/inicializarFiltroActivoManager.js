export function inicializarFiltroActivoManager() {
    const filtrosActivosWrapper = document.getElementById('filtrosActivosWrapper');
    const filtrosActivosDiv = document.getElementById('filtrosActivos');
    const toggleBtn = document.getElementById('toggleFiltrosActivos');

    const STORAGE_KEY = 'filtros_activos';
    const SESSION_KEY = 'filtros_ya_enviados';

    // Mostrar/Ocultar contenedor al hacer clic en el botón del encabezado
    toggleBtn?.addEventListener('click', () => {
        const estaOculto = filtrosActivosDiv.classList.toggle('filtros-colapsado');
        toggleBtn.innerHTML = estaOculto
            ? '<i class="fas fa-chevron-down"></i>'
            : '<i class="fas fa-chevron-up"></i>';
    });

    function guardarEnStorage() {
        const filtros = window.obtenerFiltrosActivos();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtros));
    }

    function limpiarUrl() {
        const url = new URL(window.location.href);
        if (url.searchParams.has('filtros_activos')) {
            url.searchParams.delete('filtros_activos');
            const newSearch = url.searchParams.toString();
            const newUrl = newSearch ? `${url.pathname}?${newSearch}` : url.pathname;
            window.history.replaceState({}, '', newUrl);
        }
    }

    function enviarFiltrosAlBackend(forceSubmit = false) {
        const filtros = window.obtenerFiltrosActivos();
        console.log(filtros);
        
        if (filtros.length === 0) {
            limpiarUrl();
            return;
        }

        if (!forceSubmit && sessionStorage.getItem(SESSION_KEY) === '1') return;

        const form = document.createElement('form');
        form.method = 'GET';
        form.action = window.location.pathname;

        const filtrosInput = document.createElement('input');
        filtrosInput.type = 'hidden';
        filtrosInput.name = 'filtros_activos';
        filtrosInput.value = JSON.stringify(filtros);
        form.appendChild(filtrosInput);

        document.body.appendChild(form);

        if (!forceSubmit) {
            sessionStorage.setItem(SESSION_KEY, '1');
        }

        form.submit();
    }

    // Exponer función globalmente
    window.enviarFiltrosAlBackend = function (forceSubmit = true) {
        enviarFiltrosAlBackend(forceSubmit);
    };

    function restaurarDesdeStorage() {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
            try {
                const filtros = JSON.parse(data);
                filtros.forEach(f => {
                    window.agregarFiltroActivo(f.tipo, f.label || obtenerLabelDesdePayload(f), f.payload);
                });
                enviarFiltrosAlBackend(false); // Envío automático si es necesario
            } catch (error) {
                console.error('Error al restaurar filtros desde localStorage', error);
            }
        }
    }

    function obtenerLabelDesdePayload(filtro) {
        if (filtro.payload?.nombre) return filtro.payload.nombre;

        if (filtro.tipo === 'basico') {
            return filtro.payload?.label || 'Filtro básico';
        }

        if (filtro.tipo === 'guardado') {
            return filtro.payload?.nombre || 'Filtro guardado';
        }

        if (filtro.tipo === 'personalizado') {
            try {
                const condiciones = filtro.payload?.condiciones || [];
                const resumen = condiciones
                    .map(cond => `${cond.campo} ${cond.operador} ${cond.valor}`)
                    .join(` ${filtro.payload?.operadorLogico || 'AND'} `);
                return resumen || 'Filtro personalizado';
            } catch {
                return 'Filtro personalizado';
            }
        }

        return 'Filtro';
    }

    window.agregarFiltroActivo = function (tipo, label, payload = null) {
        if (['basico', 'guardado', 'personalizado'].includes(tipo)) {
            [...filtrosActivosDiv.children].forEach(child => {
                if (child.dataset.tipo === tipo) {
                    filtrosActivosDiv.removeChild(child);
                }
            });
        }

        const tag = document.createElement('div');
        tag.className = 'badge badge-pill badge-primary d-flex align-items-center px-3 py-2 mb-1 mr-2';
        tag.style.cursor = 'default';
        tag.dataset.tipo = tipo;
        tag.dataset.payload = payload ? JSON.stringify(payload) : '';
        tag.dataset.label = label;

        tag.innerHTML = `
            <span class="mr-2">${label}</span>
            <button type="button" class="close ml-1 text-white" aria-label="Eliminar" style="opacity: 0.8;">
                <span aria-hidden="true">&times;</span>
            </button>
        `;

        tag.querySelector('button.close').addEventListener('click', () => {
            filtrosActivosDiv.removeChild(tag);

            const hayFiltros = filtrosActivosDiv.children.length > 0;
            filtrosActivosWrapper.style.display = hayFiltros ? 'block' : 'none';

            guardarEnStorage();
            sessionStorage.removeItem(SESSION_KEY);

            if (hayFiltros) {
                enviarFiltrosAlBackend(true);
            } else {
                limpiarUrl();
            }
        });

        filtrosActivosDiv.appendChild(tag);
        filtrosActivosWrapper.style.display = 'block';
        filtrosActivosDiv.style.display = 'flex';

        guardarEnStorage();
        // Force the submission to ensure it happens immediately
        enviarFiltrosAlBackend(true);
    };

    window.obtenerFiltrosActivos = function () {
        return [...filtrosActivosDiv.children].map(tag => ({
            tipo: tag.dataset.tipo,
            label: tag.dataset.label || '',
            payload: tag.dataset.payload ? JSON.parse(tag.dataset.payload) : null
        }));
    };

    // Restaurar filtros y limpiar URL si corresponde
    restaurarDesdeStorage();

    // Limpieza inicial de la URL en caso de que haya filtros viejos
    limpiarUrl();
}
