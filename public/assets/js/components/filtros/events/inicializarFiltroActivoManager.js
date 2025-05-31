import { restoreOldTable, showDataFilterable } from "./showDataFilterable.js";

export function inicializarFiltroActivoManager() {
    const filtrosActivosWrapper = document.getElementById('filtrosActivosWrapper');
    const filtrosActivosDiv = document.getElementById('filtrosActivos');
    const toggleBtn = document.getElementById('toggleFiltrosActivos');

    const STORAGE_KEY = 'filtros_activos';
    const SESSION_KEY = 'filtros_ya_enviados';
    const URL_ORIGINAL_KEY = 'url_original';

    if (!localStorage.getItem('filtros_activos')) {
        restoreOldTable();
    }

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
    function enviarFiltrosAlBackend() {
        const filtros = window.obtenerFiltrosActivos(); // Implementada por ti

        // Si no hay filtros, opcionalmente limpiar tabla o hacer algo
        if (!filtros || filtros.length === 0) {
            // Por ejemplo, podrías vaciar la tabla o recargar datos sin filtro
            return;
        }

        // Extraer payload para enviar
        const filtrosPayload = filtros[0]?.payload || {};

        // Mostrar spinner HoldOn
        HoldOn.open({
            theme: "sk-bounce",
            message: "Aplicando filtros...",
            textColor: "white"
        });

        // Hacer petición AJAX GET con fetch
        // Pasamos filtros como query param codificado JSON
        const queryParam = encodeURIComponent(JSON.stringify(filtrosPayload));
        const url = `/filter/result?filtros_activos=${queryParam}`;

        fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
        })
            .then(response => {
                if (!response.ok) throw new Error('Error en la respuesta del servidor');
                return response.json();
            })
            .then(data => {
                HoldOn.close();

                // data debe tener { registros, headers }
                if (data.registros && data.headers) {
                    // Aquí llamas a tu función para actualizar la tabla con registros y headers
                    // Por ejemplo:
                    showDataFilterable(data.registros, data.headers);

                } else {
                    console.error('Respuesta JSON inválida:', data);
                }
            })
            .catch(error => {
                HoldOn.close();
                console.error('Error al enviar filtros:', error);
                // Mostrar mensaje de error si quieres
            });
    }

    window.enviarFiltrosAlBackend = function (forceSubmit = true) {
        enviarFiltrosAlBackend(forceSubmit);
    };

    function restaurarDatosSinFiltros() {
        const urlBase = window.location.pathname;
        window.location.href = urlBase; // Redirige sin filtros y recarga la página
    }

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
        tag.className = 'filter-tag d-flex align-items-center px-3 py-2 mb-1 mr-2';
        tag.style.cssText = `
            background-color:rgb(214, 214, 214);
            color: #0056b3;
            border: 1px solid #b8daff;
            border-radius: 6px;
            font-size: 0.9rem;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
            cursor: default;
            transition: all 0.2s ease;
        `;
        tag.dataset.tipo = tipo;
        tag.dataset.payload = payload ? JSON.stringify(payload) : '';
        tag.dataset.label = label;

        tag.innerHTML = `
            <span class="mr-2">${label}</span>
            <button type="button" class="btn-close ml-1" aria-label="Eliminar" style="
                background: none;
                border: none;
                color: #0056b3;
                font-size: 1rem;
                padding: 0 4px;
                opacity: 0.7;
                cursor: pointer;
            ">
                <span aria-hidden="true">&times;</span>
            </button>
        `;

        const closeBtn = tag.querySelector('button.btn-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                filtrosActivosDiv.removeChild(tag);
                const hayFiltros = filtrosActivosDiv.children.length > 0;
                filtrosActivosWrapper.style.display = hayFiltros ? 'block' : 'none';

                guardarEnStorage();
                sessionStorage.removeItem(SESSION_KEY);

                if (!hayFiltros) {
                    localStorage.removeItem(STORAGE_KEY);
                    sessionStorage.removeItem(URL_ORIGINAL_KEY);
                    sessionStorage.removeItem(SESSION_KEY);
                    restaurarDatosSinFiltros();
                    limpiarUrl();
                }
            });
        }

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
