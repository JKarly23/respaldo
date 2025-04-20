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

        // Agregar manejo de estado de carga
        const loadingElement = document.createElement('div');
        loadingElement.className = 'loading-overlay';
        loadingElement.innerHTML = '<div class="spinner-border text-primary"></div>';
        document.body.appendChild(loadingElement);

        if (!forceSubmit && sessionStorage.getItem(SESSION_KEY) === '1') return;

        const currentUrl = window.location.pathname;
        const filtrosCodificados = encodeURIComponent(JSON.stringify(filtros[0]?.payload));
        const nuevaUrl = `${currentUrl}?filtros_activos=${filtrosCodificados}`;

        window.history.pushState({}, '', nuevaUrl);

        fetch(nuevaUrl, {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
            .then(response => response.text())
            .then(html => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const nuevaTabla = doc.querySelector('#contenedorTabla');
                const tablaActual = document.querySelector('#contenedorTabla');

                if (nuevaTabla && tablaActual) {
                    tablaActual.innerHTML = nuevaTabla.innerHTML;
                    restaurarDataTable();
                }

                // Eliminar indicador de carga
                document.body.removeChild(loadingElement);

                // Actualizar el estado de carga del navegador
                document.querySelector('html').classList.remove('loading');

                console.log('Filtros aplicados correctamente.');
            })
            .catch(error => {
                console.error('Error al enviar filtros:', error);
                document.body.removeChild(loadingElement);
                document.querySelector('html').classList.remove('loading');
            });
    }

    window.enviarFiltrosAlBackend = function (forceSubmit = true) {
        enviarFiltrosAlBackend(forceSubmit);
    };

    function restaurarDatosSinFiltros() {
        const urlBase = window.location.pathname;

        // Limpiar URL
        window.history.pushState({}, '', urlBase);

        fetch(urlBase, {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
            .then(response => response.text())
            .then(html => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');

                const nuevaTabla = doc.querySelector('#contenedorTabla');
                const tablaActual = document.querySelector('#contenedorTabla');

                if (nuevaTabla && tablaActual) {
                    tablaActual.innerHTML = nuevaTabla.innerHTML;
                    // Reinicializar DataTable
                    restaurarDataTable();
                }
            })
            .catch(error => {
                console.error('Error al restaurar los datos:', error);
            });
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
            background-color: #e8f4fd;
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
                restaurarDatosSinFiltros();
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


function restaurarDataTable() {
    const tabla = $('.dataTable').DataTable({
        lengthMenu: [[5, 25, 50, -1], [5, 25, 50, "All"]],
        responsive: false,
        lengthChange: true,
        autoWidth: false,
        scrollX: true,
        language: {
            sProcessing: "Procesando...",
            sLengthMenu: "Mostrar _MENU_ registros",
            sZeroRecords: "No se encontraron resultados",
            sEmptyTable: "No existen resultados",
            sInfo: "Registros del _START_ al _END_ de  _TOTAL_ ",
            sInfoEmpty: "Rregistros del 0 al 0 de  0 ",
            sInfoFiltered: "(filtrado de un total de _MAX_ registros)",
            sInfoPostFix: "",
            sSearch: "Buscar:",
            sUrl: "",
            sInfoThousands: ",",
            sLoadingRecords: "Cargando...",
            oPaginate: {
                sFirst: "Primero",
                sLast: "Último",
                sNext: "Siguiente",
                sPrevious: "Anterior"
            },
            oAria: {
                sSortAscending: ": Activar para ordenar la columna de manera ascendente",
                sSortDescending: ": Activar para ordenar la columna de manera descendente"
            },
            buttons: {
                copy: "Copiar",
                colvis: "Visibilidad"
            }
        }
    });

    // Restaurar los botones de la tabla
    new $.fn.dataTable.Buttons(tabla, {
        buttons: [
            'copy', 'colvis'
        ]
    });

    tabla.buttons().container()
        .appendTo('#contenedorTabla_wrapper .col-md-6:eq(0)');
}