// Importaciones de validaciones y utilidades
import { validateCampoRepetido } from '../validators/validateCampoRepetido.js';
import { validateUltimaCondicion } from '../validators/validateUltimaCondicion.js';
import { actualizarOperadoresYValorInput } from '../transforms/asideDynamicInputs.js';
import { mostrarMensajeError } from '../utils/mostrarMensajeError.js';
import { validateCantidadCondiciones, validateConditions } from '../validators/validateconditions.js';

export function inicializarEventosAside() {
    const crearFiltroBtn = document.getElementById('crearFiltroPersonalizado');
    const aside = document.getElementById('filtroPersonalizadoAside');
    const cerrarAsideBtn = document.getElementById('cerrarAside');
    const cancelarFiltroBtn = document.getElementById('cancelarFiltro');
    const condicionesContainer = document.getElementById('condicionesContainer');
    const guardarFiltroBtn = document.getElementById('guardarFiltro');
    const confirmarGuardarFiltroBtn = document.getElementById('confirmarGuardarFiltro');
    const aplicarFiltroBtn = document.getElementById('aplicarFiltro');
    const messageDiv = document.querySelector('.showMessage');

    if (!crearFiltroBtn || !aside) return;

    crearFiltroBtn.addEventListener('click', (e) => {
        e.preventDefault();
        aside.style.right = '0';
        document.body.style.overflow = 'hidden';

        const primerCampoSelect = aside.querySelector('.campo-select');
        if (primerCampoSelect) {
            actualizarOperadoresYValorInput(primerCampoSelect);
        }

        document.querySelectorAll('.campo-select, .operador-select').forEach(select => {
            if ($(select).hasClass('select2-hidden-accessible')) {
                $(select).select2('destroy');
            }

            select.classList.remove('select2-hidden-accessible');
            select.removeAttribute('data-select2-id');
            select.style = '';
        });

        document.querySelectorAll('.select2-container').forEach(container => container.remove());
    });

    // Lógica del operador lógico
    function actualizarOperadorActivo() {
        document.querySelectorAll('input[name="operadorLogico"]').forEach(op => {
            op.parentElement.classList.remove('active');
        });

        const seleccionado = document.querySelector('input[name="operadorLogico"]:checked');
        if (seleccionado) {
            seleccionado.parentElement.classList.add('active');
        }
    }

    document.querySelectorAll('input[name="operadorLogico"]').forEach(input => {
        input.addEventListener('change', actualizarOperadorActivo);
    });

    actualizarOperadorActivo();

    function cerrarAside() {
        aside.style.right = '-415px';
        document.body.style.overflow = '';
        localStorage.removeItem('aside_abierto');
        localStorage.removeItem('condiciones_guardadas');

        const conditions = condicionesContainer.querySelectorAll('.condicion');
        conditions.forEach((condicion, index) => {
            if (index > 0) condicion.remove();
        });

        const primera = condicionesContainer.querySelector('.condicion');
        if (primera) {
            primera.querySelector('.campo-select').selectedIndex = 0;
            primera.querySelector('.operador-select').selectedIndex = 0;
            primera.querySelector('.valor-input').value = '';
        }

        const operadorDefault = document.querySelector('input[name="operadorLogico"]');
        if (operadorDefault) {
            operadorDefault.checked = true;
            actualizarOperadorActivo();
        }

        const mensaje = condicionesContainer.querySelector('.showMessage');
        if (mensaje) mensaje.innerHTML = '';

        actualizarBotonAgregar();
    }

    cerrarAsideBtn?.addEventListener('click', cerrarAside);
    cancelarFiltroBtn?.addEventListener('click', cerrarAside);

    const condicionBase = document.querySelector('.condicion');
    const campoOptions = condicionBase.querySelector('.campo-select').innerHTML;
    const operadorOptions = condicionBase.querySelector('.operador-select').innerHTML;

    function crearCondicion(esUltima = false, datos = null) {
        console.log('Ejecutando crearCondicion, esUltima:', esUltima);

        if (condicionesContainer.children.length > 0) {
            // Verificar si las validaciones están funcionando correctamente
            const validacionUltima = validateUltimaCondicion(condicionesContainer);
            if (!validacionUltima.isValid) {
                console.error('Validación última condición falló:', validacionUltima.messageError);
                mostrarMensajeError(condicionesContainer, validacionUltima.messageError);
                return;
            }

            const validacionCampo = validateCampoRepetido(condicionesContainer);
            if (!validacionCampo.isValid) {
                console.error('Validación campo repetido falló:', validacionCampo.messageError);
                mostrarMensajeError(condicionesContainer, validacionCampo.messageError);
                return;
            }

            const validacionCantidad = validateCantidadCondiciones(condicionesContainer, document.getElementById('agregarCondicion'));
            if (!validacionCantidad.isValid) {
                console.error('Validación cantidad condiciones falló:', validacionCantidad.messageError);
                mostrarMensajeError(condicionesContainer, validacionCantidad.messageError);
                return;
            }

            const ultima = condicionesContainer.lastElementChild;
            const operador = document.querySelector('input[name="operadorLogico"]:checked') || document.querySelector('input[name="operadorLogico"]');
            operador.checked = true;

            const operadorContainer = ultima.querySelector('.operatorContainer');
            if (operadorContainer) {
                operadorContainer.innerHTML = `
                    <span class="badge badge-secondary px-2 py-1 ml-2 mb-2">${operador.value}</span>
                `;
            }
        }

        const nuevaCondicion = document.createElement('div');
        nuevaCondicion.classList.add('condicion', 'mb-3');

        // Asegurarse de que el HTML esté completo
        nuevaCondicion.innerHTML = `
            <div class="form-row">
                <div class="col-md-4">
                    <label>Campo</label>
                    <select class="form-control campo-select">${campoOptions}</select>
                </div>
                <div class="col-md-3">
                    <label>Operador</label>
                    <select class="form-control operador-select" style="position: relative; z-index: 1070;">${operadorOptions}</select>
                </div>
                <div class="col-md-3">
                    <label>Valor</label>
                    <input type="text" class="form-control valor-input">
                </div>
                <div class="col-md-2 d-flex align-items-end justify-content-between">
                    <div class="d-flex align-items-center">
                        ${esUltima ? `
                            <button type="button" id="agregarCondicion" class="btn btn-link text-success agregar-condicion p-0 mb-2 mr-2" title="Agregar condición">
                                <i class="fas fa-plus-circle"></i>
                            </button>` : ''}
                        <button type="button" class="btn btn-link text-danger eliminar-condicion p-0 mb-2 mr-1" title="Eliminar condición">
                            <i class="fas fa-times"></i>
                        </button>
                        <div class='operatorContainer'></div>
                    </div>
                </div>
            </div>
            <div class="operador-logico"></div>
        `;

        nuevaCondicion.querySelector('.eliminar-condicion').addEventListener('click', () => {
            const condiciones = condicionesContainer.querySelectorAll('.condicion');
            if (condiciones.length <= 1) {
                mostrarMensajeError(condicionesContainer, 'Debe haber al menos una condición');
                return;
            }

            nuevaCondicion.remove();
            actualizarBotonAgregar();
            actualizarOperadorActivo();
        });

        const campoSelect = nuevaCondicion.querySelector('.campo-select');
        if (campoSelect) {
            setTimeout(() => actualizarOperadoresYValorInput(campoSelect, condicionesContainer), 0);
        }

        condicionesContainer.appendChild(nuevaCondicion);
        actualizarBotonAgregar();
        actualizarOperadorActivo();
    }

    function actualizarBotonAgregar() {
        document.querySelectorAll('.agregar-condicion').forEach(btn => btn.remove());

        const ultima = condicionesContainer.lastElementChild;
        if (ultima) {
            const divBotones = ultima.querySelector('.d-flex');
            const nuevoBtn = document.createElement('button');
            nuevoBtn.type = 'button';
            nuevoBtn.id = 'agregarCondicion';
            nuevoBtn.className = 'btn btn-link text-success agregar-condicion p-0 mb-2 mr-2';
            nuevoBtn.title = 'Agregar condición';
            nuevoBtn.innerHTML = '<i class="fas fa-plus-circle"></i>';

            nuevoBtn.addEventListener('click', () => {
                if (validateCantidadCondiciones(condicionesContainer, nuevoBtn).isValid) {
                    crearCondicion(true);
                }
            });

            divBotones.insertBefore(nuevoBtn, divBotones.firstChild);
        }
    }

    actualizarBotonAgregar();

    condicionesContainer.addEventListener('change', (e) => {
        if (e.target.classList.contains('campo-select')) {
            actualizarOperadoresYValorInput(e.target, condicionesContainer);
        }
    });

    const eliminarPrimera = document.querySelector('.condicion .eliminar-condicion');
    if (eliminarPrimera) {
        eliminarPrimera.addEventListener('click', () => {
            if (document.querySelectorAll('.condicion').length > 1) {
                eliminarPrimera.closest('.condicion').remove();
                actualizarBotonAgregar();
            } else {
                mostrarMensajeError(condicionesContainer, 'Debe haber al menos una condición');
            }
        });
    }

    guardarFiltroBtn?.addEventListener('click', () => {
        $('#guardarFiltroModal').modal('show');
    });

    confirmarGuardarFiltroBtn?.addEventListener('click', () => {
        const nombre = document.getElementById('nombreFiltro').value.trim();

        if (!nombre) {
            alert('Por favor, ingrese un nombre para el filtro');
            return;
        }

        console.log('Filtro guardado:', nombre);
        $('#guardarFiltroModal').modal('hide');
        cerrarAside();
    });

    aplicarFiltroBtn?.addEventListener('click', () => {

        const validacionCampo = validateCampoRepetido(condicionesContainer);
        if (!validacionCampo.isValid) {
            console.error('Validación campo repetido falló:', validacionCampo.messageError);
            mostrarMensajeError(condicionesContainer, validacionCampo.messageError);
            return;
        }

        const condiciones = validateConditions(condicionesContainer);
        if (!condiciones.isValid) return mostrarMensajeError(condicionesContainer, condiciones.messageError);

        // Guardar en localStorage
        const condicionesJSON = JSON.stringify(condiciones);
        localStorage.setItem('aside_abierto', '1');
        localStorage.setItem('condiciones_guardadas', condicionesJSON);

        // Pasar false como cuarto parámetro para evitar que se envíen los filtros automáticamente
        window.agregarFiltroActivo('personalizado', condiciones.label, condiciones.conditions, false);

        // Enviar los filtros una sola vez
        setTimeout(() => {
            window.enviarFiltrosAlBackend(true);
        }, 50);

        console.log('Filtro aplicado');
        messageDiv.innerHTML = `
            <div class="alert alert-success alert-dismissible fade show" role="alert">
                <strong>Éxito:</strong> Filtro aplicado correctamente
                <button type="button" class="close" data-dismiss="alert" aria-label="Cerrar">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
        `;
    });
}