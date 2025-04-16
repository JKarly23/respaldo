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

    // Guardar filtros en localStorage
    function guardarEnStorage() {
        const filtros = window.obtenerFiltrosActivos();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtros));
    }

    // Enviar filtros al backend
    function enviarFiltrosAlBackend(forceSubmit = false) {
        const filtros = window.obtenerFiltrosActivos();

        // Si no hay filtros activos, no enviamos nada
        if (filtros.length === 0) return;

        // Solo verificamos sessionStorage en cargas automáticas, no en envíos manuales
        if (!forceSubmit && sessionStorage.getItem(SESSION_KEY) === '1') return;

        const form = document.createElement('form');
        form.method = 'GET';
        form.action = window.location.href; // Enviar a la URL actual

        // Añadir los filtros al formulario
        const filtrosInput = document.createElement('input');
        filtrosInput.type = 'hidden';
        filtrosInput.name = 'filtros_activos';
        filtrosInput.value = JSON.stringify(filtros);
        form.appendChild(filtrosInput);

        document.body.appendChild(form);
        
        // Marcamos como enviado solo en cargas automáticas
        if (!forceSubmit) {
            sessionStorage.setItem(SESSION_KEY, '1');
        }
        
        form.submit(); // Enviar formulario
    }

    // Exponemos la función para poder llamarla desde otros archivos
    window.enviarFiltrosAlBackend = function(forceSubmit = true) {
        enviarFiltrosAlBackend(forceSubmit);
    };

    // Resto del código sin cambios...
    
    // Restaurar filtros desde localStorage
    function restaurarDesdeStorage() {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
            try {
                const filtros = JSON.parse(data);
                filtros.forEach(f => {
                    window.agregarFiltroActivo(f.tipo, f.label || obtenerLabelDesdePayload(f), f.payload);
                });

                // Solo enviamos si aún no se enviaron y hay filtros
                enviarFiltrosAlBackend(false); // Llamada automática, no forzada
            } catch (error) {
                console.error('Error al restaurar filtros desde localStorage', error);
            }
        }
    }

    // Genera un label legible desde el payload
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

    // Función pública para agregar un filtro activo
    window.agregarFiltroActivo = function (tipo, label, payload = null) {
        // Si ya hay uno del mismo tipo y no es combinable, lo reemplaza
        if (tipo === 'basico' || tipo === 'guardado' || tipo === 'personalizado') {
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

        // Evento eliminar
        tag.querySelector('button.close').addEventListener('click', () => {
            filtrosActivosDiv.removeChild(tag);
            if (filtrosActivosDiv.children.length === 0) {
                filtrosActivosWrapper.style.display = 'none';
            }
            guardarEnStorage();
            sessionStorage.removeItem(SESSION_KEY); // Habilitamos reenviar si se eliminó
            enviarFiltrosAlBackend();
        });

        filtrosActivosDiv.appendChild(tag);
        filtrosActivosWrapper.style.display = 'block';
        filtrosActivosDiv.style.display = 'flex';

        guardarEnStorage();
    };

    // Función pública para obtener los filtros activos
    window.obtenerFiltrosActivos = function () {
        return [...filtrosActivosDiv.children].map(tag => ({
            tipo: tag.dataset.tipo,
            label: tag.dataset.label || '',
            payload: tag.dataset.payload ? JSON.parse(tag.dataset.payload) : null
        }));
    };

    // Restaurar filtros al iniciar
    restaurarDesdeStorage();
}

// Eliminamos esta línea que causa el error
// window.enviarFiltrosAlBackend = enviarFiltrosAlBackend;
