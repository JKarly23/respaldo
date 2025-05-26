import { validateCampoRepetido } from '../validators/validateCampoRepetido.js';
import { validateUltimaCondicion } from '../validators/validateUltimaCondicion.js';
import { actualizarOperadoresYValorInput } from '../transforms/asideDynamicInputs.js';
import { mostrarMensajeError } from '../utils/mostrarMensajeError.js';
import { validateCantidadCondiciones, validateConditions } from '../validators/validateConditions.js';
import { restaurarEstadoAside } from './restaurarCondiciones.js';
import { savedFilters } from '../api/filtroRequest.js';


restaurarEstadoAside();

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
    const messageModalSaved = document.getElementById('showMessageModal');

    if (!crearFiltroBtn || !aside) return;
    // Ocultar el botón de guardar filtro si no hay filtros activos
    if (!localStorage.getItem('filtros_activos')) {
        guardarFiltroBtn.style.display = 'none';
    }

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


    condicionesContainer.addEventListener('click', (e) => {
        const spanOperador = e.target.closest('.operatorContainer > span.badge');
        if (!spanOperador) return;


        const actual = spanOperador.textContent.trim().toUpperCase();

        const nuevo = actual === "AND" ? "OR" : "AND";

        spanOperador.textContent = nuevo;


        const condicionDiv = spanOperador.closest('.condicion');
        if (!condicionDiv) return;


        const inputRadioNuevo = condicionDiv.querySelector(`input[name="operadorLogico"][value="${nuevo}"]`);
        if (inputRadioNuevo) {
            inputRadioNuevo.checked = true;
        } else {

            const inputRadioGlobal = document.querySelector(`input[name="operadorLogico"][value="${nuevo}"]`);
            if (inputRadioGlobal) {
                inputRadioGlobal.checked = true;
            }
        }


        actualizarOperadorActivo();
    });

    function cerrarAside() {
        aside.style.right = '-415px';
        document.body.style.overflow = '';
        localStorage.setItem('aside_abierto', '0');  // Mantener el estado del aside cerrado

        // Guardar las condiciones actuales en localStorage
        const condiciones = [];
        condicionesContainer.querySelectorAll('.condicion').forEach(condicion => {
            const campoSelect = condicion.querySelector('.campo-select');
            const operadorSelect = condicion.querySelector('.operador-select');
            const valorInput = condicion.querySelector('.valor-input');

            if (campoSelect && operadorSelect && valorInput) {
                condiciones.push({
                    campo: campoSelect.value,
                    operador: operadorSelect.value,
                    valor: valorInput.value,
                });
            }
        });

        localStorage.setItem('condiciones_guardadas', JSON.stringify({ conditions: condiciones }));

        // Limpieza de condiciones solo si es necesario
        if (condiciones.length === 0) {
            localStorage.removeItem('condiciones_guardadas');
        }
    }

    cerrarAsideBtn?.addEventListener('click', cerrarAside);
    cancelarFiltroBtn?.addEventListener('click', cerrarAside);

    // Obtener la condición base y sus opciones
    const condicionBase = document.querySelector('.condicion');
    let campoOptions = '';
    let operadorOptions = '';

    if (condicionBase) {
        const campoSelect = condicionBase.querySelector('.campo-select');
        const operadorSelect = condicionBase.querySelector('.operador-select');

        if (campoSelect && operadorSelect) {
            campoOptions = campoSelect.innerHTML;
            operadorOptions = operadorSelect.innerHTML;
        }
    } else {
        console.error('No se encontró el elemento base de condición');
        return; // Salir de la función si no hay condición base
    }

    function crearCondicion(esUltima = false, datos = null) {

        if (condicionesContainer.children.length > 0) {

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
    window.crearCondicion = crearCondicion;

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
            messageModalSaved.innerHTML = `
                <div class="alert alert-danger alert-dismissible fade show" role="alert">   
                    <strong>Error:</strong> El nombre del filtro no puede estar vacío.
                    <button type="button" class="close" data-dismiss="alert" aria-label="Cerrar">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
            `;
            return;
        }
        savedFilters();
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