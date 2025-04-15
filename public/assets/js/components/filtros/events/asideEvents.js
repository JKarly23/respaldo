import { reemplazarFiltrosActivos } from '../utils/filtrosActivos.js';

export function inicializarEventosAside() {
    const crearFiltroBtn = document.getElementById('crearFiltroPersonalizado');
    const aside = document.getElementById('filtroPersonalizadoAside');
    const cerrarAsideBtn = document.getElementById('cerrarAside');
    const cancelarFiltroBtn = document.getElementById('cancelarFiltro');
    const agregarCondicionBtn = document.getElementById('agregarCondicion');
    const condicionesContainer = document.getElementById('condicionesContainer');
    const guardarFiltroBtn = document.getElementById('guardarFiltro');
    const confirmarGuardarFiltroBtn = document.getElementById('confirmarGuardarFiltro');
    const aplicarFiltroBtn = document.getElementById('aplicarFiltro');

    if (!crearFiltroBtn || !aside) return;

    // Abrir Aside
    crearFiltroBtn.addEventListener('click', function (e) {
        e.preventDefault();
        aside.style.right = '0';
        document.body.style.overflow = 'hidden';

        // Eliminar Select2 si se aplicó al primer select
        document.querySelectorAll('.campo-select, .operador-select').forEach(select => {
            if ($(select).hasClass('select2-hidden-accessible')) {
                $(select).select2('destroy');
            }

            select.classList.remove('select2-hidden-accessible');
            select.removeAttribute('data-select2-id');
            select.style = '';
        });

        // Eliminar contenedores extra de Select2
        document.querySelectorAll('.select2-container').forEach(container => container.remove());
    });

    // Cerrar Aside
    function cerrarAside() {
        aside.style.right = '-400px';
        document.body.style.overflow = '';
    }

    if (cerrarAsideBtn) cerrarAsideBtn.addEventListener('click', cerrarAside);
    if (cancelarFiltroBtn) cancelarFiltroBtn.addEventListener('click', cerrarAside);

    // Obtener opciones base desde la primera condición
    const condicionBase = document.querySelector('.condicion');
    const campoOptions = condicionBase.querySelector('.campo-select').innerHTML;
    const operadorOptions = condicionBase.querySelector('.operador-select').innerHTML;

    // Agregar nueva condición
    if (agregarCondicionBtn && condicionesContainer) {
        agregarCondicionBtn.addEventListener('click', function () {
            const nuevaCondicion = document.createElement('div');
            nuevaCondicion.classList.add('condicion', 'mb-3');

            nuevaCondicion.innerHTML = `
                <div class="form-row">
                    <div class="col-md-5">
                        <label>Campo</label>
                        <select class="form-control campo-select">
                            ${campoOptions}
                        </select>
                    </div>
                    <div class="col-md-3">
                        <label>Operador</label>
                        <select class="form-control operador-select">
                            ${operadorOptions}
                        </select>
                    </div>
                    <div class="col-md-3">
                        <label>Valor</label>
                        <input type="text" class="form-control valor-input">
                    </div>
                    <div class="col-md-1 d-flex align-items-end">
                        <button type="button" class="btn btn-link text-danger eliminar-condicion p-0 mb-2">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            `;

            nuevaCondicion.querySelector('.eliminar-condicion').addEventListener('click', function () {
                nuevaCondicion.remove();
            });

            condicionesContainer.appendChild(nuevaCondicion);
        });
    }

    // Eliminar la primera condición
    const eliminarCondicionBtn = document.querySelector('.condicion .eliminar-condicion');
    if (eliminarCondicionBtn) {
        eliminarCondicionBtn.addEventListener('click', function () {
            if (document.querySelectorAll('.condicion').length > 1) {
                eliminarCondicionBtn.closest('.condicion').remove();
            } else {
                alert('Debe haber al menos una condición');
            }
        });
    }

    // Abrir modal para guardar
    if (guardarFiltroBtn) {
        guardarFiltroBtn.addEventListener('click', function () {
            $('#guardarFiltroModal').modal('show');
        });
    }

    // Guardar filtro (simulado)
    if (confirmarGuardarFiltroBtn) {
        confirmarGuardarFiltroBtn.addEventListener('click', function () {
            const nombreFiltro = document.getElementById('nombreFiltro').value.trim();

            if (!nombreFiltro) {
                alert('Por favor, ingrese un nombre para el filtro');
                return;
            }

            console.log('Filtro guardado:', nombreFiltro);
            $('#guardarFiltroModal').modal('hide');
            cerrarAside();
        });
    }

    // Aplicar filtro
    if (aplicarFiltroBtn) {
        aplicarFiltroBtn.addEventListener('click', function () {
            const condiciones = [];

            document.querySelectorAll('.condicion').forEach(condicion => {
                const campoSelect = condicion.querySelector('.campo-select');
                const operadorSelect = condicion.querySelector('.operador-select');
                const valorInput = condicion.querySelector('.valor-input');

                if (!campoSelect || !operadorSelect || !valorInput) return;

                const campo = campoSelect.options[campoSelect.selectedIndex].text;
                const operador = operadorSelect.options[operadorSelect.selectedIndex].text;
                const valor = valorInput.value;

                if (campo && operador && valor) {
                    condiciones.push({ campo, operador, valor });
                }
            });

            if (condiciones.length > 0) {
                if (window.filtrosManager && typeof window.filtrosManager.reemplazarFiltrosActivos === 'function') {
                    window.filtrosManager.reemplazarFiltrosActivos(condiciones);
                }

                alert('Filtro aplicado correctamente');
                cerrarAside();
            } else {
                alert('Debe agregar al menos una condición válida');
            }
        });
    }
}
