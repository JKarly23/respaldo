export function inicializarFiltroActivoManager() {
    const filtrosActivosWrapper = document.getElementById('filtrosActivosWrapper');
    const filtrosActivosDiv = document.getElementById('filtrosActivos');
    const toggleBtn = document.getElementById('toggleFiltrosActivos');

    const STORAGE_KEY = 'filtros_activos';
    const SESSION_KEY = 'filtros_ya_enviados';
    const URL_ORIGINAL_KEY = 'url_original';

    toggleBtn?.addEventListener('click', () => {
        const estaOculto = filtrosActivosDiv.classList.toggle('filtros-colapsado');
        toggleBtn.innerHTML = estaOculto
            ? '<i class="fas fa-chevron-down"></i>'
            : '<i class="fas fa-chevron-up"></i>';

        if (estaOculto) {
            limpiarUrl();
            sessionStorage.setItem('filtros_colapsados', 'true');
        } else {
            const filtros = window.obtenerFiltrosActivos();
            if (filtros.length > 0) {
                const url = new URL(window.location.href);
                url.searchParams.set('filtros_activos', JSON.stringify(filtros));
                window.history.replaceState({}, '', url.toString());
            }
            sessionStorage.removeItem('filtros_colapsados');
        }
    });

    function guardarEnStorage() {
        const filtros = window.obtenerFiltrosActivos();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtros));
    }

    function limpiarUrl() {
        const filtrosEnStorage = localStorage.getItem(STORAGE_KEY);
        if (!filtrosEnStorage || JSON.parse(filtrosEnStorage).length === 0) {
            const url = new URL(window.location.href);
            if (url.searchParams.has('filtros_activos')) {
                url.searchParams.delete('filtros_activos');
                const newSearch = url.searchParams.toString();
                const newUrl = newSearch ? `${url.pathname}?${newSearch}` : url.pathname;
                window.history.replaceState({}, '', newUrl);
            }
        }
    }

    function enviarFiltrosAlBackend(forceSubmit = false) {
        const filtros = window.obtenerFiltrosActivos();
        
        if (filtros.length === 0) {
            limpiarUrl();
            return;
        }

        if (!forceSubmit && sessionStorage.getItem(SESSION_KEY) === '1') return;

    
        const currentUrl = window.location.pathname;
        const filtrosCodificados = encodeURIComponent(JSON.stringify(filtros[0]?.payload));
        const nuevaUrl = `${currentUrl}?filtros_activos=${filtrosCodificados}`;

        // Actualizar la URL en la barra sin recargar
        window.history.pushState({}, '', nuevaUrl);

        // Hacer la petición GET al backend
        fetch(nuevaUrl, {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
            .then(() => {
                console.log('Filtros enviados exitosamente');
            })
            .catch(error => {
                console.error('Error al enviar filtros:', error);
            });

        if (!forceSubmit) {
            sessionStorage.setItem(SESSION_KEY, '1');
        }
    }

    window.enviarFiltrosAlBackend = function (forceSubmit = true) {
        enviarFiltrosAlBackend(forceSubmit);
    };

    function restaurarDesdeStorage() {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
            try {
                const filtros = JSON.parse(data);
                filtros.forEach(f => {
                    const enviar = f.tipo === 'basico' || f.tipo === 'guardado';
                    window.agregarFiltroActivo(f.tipo, f.label || obtenerLabelDesdePayload(f), f.payload, enviar);
                });
                enviarFiltrosAlBackend(false);
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

    window.agregarFiltroActivo = function (tipo, label, payload = null, enviar = null) {
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

            if (!hayFiltros) {
                localStorage.removeItem(STORAGE_KEY);
                sessionStorage.removeItem(URL_ORIGINAL_KEY);
                sessionStorage.removeItem(SESSION_KEY);
                limpiarUrl();
            }
        });

        filtrosActivosDiv.appendChild(tag);
        filtrosActivosWrapper.style.display = 'block';
        filtrosActivosDiv.style.display = 'flex';

        guardarEnStorage();

        const debeEnviar = enviar !== null
            ? enviar
            : (tipo === 'basico' || tipo === 'guardado');

        if (debeEnviar) {
            enviarFiltrosAlBackend(true);
        }
    };

    window.obtenerFiltrosActivos = function () {
        return [...filtrosActivosDiv.children].map(tag => ({
            tipo: tag.dataset.tipo,
            label: tag.dataset.label || '',
            payload: tag.dataset.payload ? JSON.parse(tag.dataset.payload) : null
        }));
    };

    function verificarEstadoColapso() {
        const estanColapsados = sessionStorage.getItem('filtros_colapsados') === 'true';
        if (estanColapsados) {
            filtrosActivosDiv.classList.add('filtros-colapsado');
            toggleBtn.innerHTML = '<i class="fas fa-chevron-down"></i>';
            limpiarUrl();
        }
    }

    restaurarDesdeStorage();
    verificarEstadoColapso();
    limpiarUrl(); // Limpieza inicial si había filtros colapsados
}
