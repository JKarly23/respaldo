import { validateCantidadCondiciones, validateConditions } from '../validators/validateConditions.js';
import { validateCampoRepetido } from '../validators/validateCampoRepetido.js'
import { validateUltimaCondicion } from '../validators/validateUltimaCondicion.js';
import { actualizarOperadoresYValorInput } from '../transforms/asideDynamicInputs.js';
import { mostrarMensajeError } from '../utils/mostrarMensajeError.js';

export function inicializarEventosAside() {
    const crearFiltroBtn = document.getElementById('crearFiltroPersonalizado');
    const aside = document.getElementById('filtroPersonalizadoAside');
    const cerrarAsideBtn = document.getElementById('cerrarAside');
    const cancelarFiltroBtn = document.getElementById('cancelarFiltro');
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

        //Activar chandge del campo
        const primerCampoSelect = aside.querySelector('.campo-select');
        if (primerCampoSelect) {
            actualizarOperadoresYValorInput(primerCampoSelect, );
        }

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

    // Función para manejar la actualización de los operadores activos
    function actualizarOperadorActivo() {
        const operadores = document.querySelectorAll('input[name="operadorLogico"]');
        operadores.forEach(operador => {
            operador.parentElement.classList.remove('active');
        });

        const operadorSeleccionado = document.querySelector('input[name="operadorLogico"]:checked');
        operadorSeleccionado.parentElement.classList.add('active');
    }

    // Inicializar la selección del operador lógico
    document.querySelectorAll('input[name="operadorLogico"]').forEach(input => {
        input.addEventListener('change', actualizarOperadorActivo);
    });

    // Llamar a la función inicial para asegurar que el operador inicial sea el correcto
    actualizarOperadorActivo();

    // Cerrar Aside
    function cerrarAside() {
        // Reset aside position and scroll
        aside.style.right = '-415px';
        document.body.style.overflow = '';

        // Reset all conditions except the first one
        const conditions = condicionesContainer.querySelectorAll('.condicion');
        conditions.forEach((condition, index) => {
            if (index > 0) condition.remove();
        });

        // Reset first condition values
        const firstCondition = condicionesContainer.querySelector('.condicion');
        if (firstCondition) {
            const campoSelect = firstCondition.querySelector('.campo-select');
            const operadorSelect = firstCondition.querySelector('.operador-select');
            const valorInput = firstCondition.querySelector('.valor-input');

            if (campoSelect) campoSelect.selectedIndex = 0;
            if (operadorSelect) operadorSelect.selectedIndex = 0;
            if (valorInput) valorInput.value = '';
        }

        // Reset operator to default (first one)
        const defaultOperator = document.querySelector('input[name="operadorLogico"]');
        if (defaultOperator) {
            defaultOperator.checked = true;
            actualizarOperadorActivo();
        }

        // Reset any error messages
        const messageDiv = condicionesContainer.querySelector('.showMessage');
        if (messageDiv) messageDiv.innerHTML = '';

        // Update add button state
        actualizarBotonAgregar();
    }

    if (cerrarAsideBtn) cerrarAsideBtn.addEventListener('click', cerrarAside);
    if (cancelarFiltroBtn) cancelarFiltroBtn.addEventListener('click', cerrarAside);

    // Obtener opciones base desde la primera condición
    const condicionBase = document.querySelector('.condicion');
    const campoOptions = condicionBase.querySelector('.campo-select').innerHTML;
    const operadorOptions = condicionBase.querySelector('.operador-select').innerHTML;

    function crearCondicion(esUltima = false) {
        const nuevaCondicion = document.createElement('div');
        nuevaCondicion.classList.add('condicion', 'mb-3');

        // Validar solo si ya existe al menos una condición previa
        if (condicionesContainer.children.length > 0) {
            // 1. Validar la última condición
            const resultadoUltima = validateUltimaCondicion(condicionesContainer);
            if (!resultadoUltima.isValid) {
                return;
            }

            // 2. Validar que no haya campos repetidos
            const resultadoDuplicado = validateCampoRepetido(condicionesContainer);
            if (!resultadoDuplicado.isValid) {
                return;
            }
            // 3. Validar cantidad máxima de condiciones
            const resultadoCantidad = validateCantidadCondiciones(condicionesContainer, document.getElementById('agregarCondicion'));
            if (!resultadoCantidad.isValid) {
                return;
            }


            // 4. Si todo está bien, agregar operador lógico a la condición anterior
            const ultimaCondicion = condicionesContainer.lastElementChild;
            const operatorContainer = ultimaCondicion.querySelector('.operatorContainer');

            if (operatorContainer) {
                let operadorSeleccionado = document.querySelector('input[name="operadorLogico"]:checked');
                if (!operadorSeleccionado) {
                    operadorSeleccionado = document.querySelector('input[name="operadorLogico"]');
                    operadorSeleccionado.checked = true;
                }

                const valorOperador = operadorSeleccionado.value;
                operatorContainer.innerHTML = `
            <span class="badge badge-secondary px-2 py-1 ml-2 mb-2">${valorOperador}</span>
        `;
            }
        }


        nuevaCondicion.innerHTML = `
        <div class="form-row">
            <div class="col-md-4">
                <label>Campo</label>
                <select class="form-control campo-select">
                    ${campoOptions}
                </select>
            </div>
            <div class="col-md-3">
                <label>Operador</label>
                <select class="form-control operador-select" style="position: relative; z-index: 1070;">
                    ${operadorOptions}
                </select>
            </div>
            <div class="col-md-3">
                <label>Valor</label>
                <input type="text" class="form-control valor-input">
            </div>
            <div class="col-md-2 d-flex align-items-end justify-content-between">
                <div class="d-flex align-items-center">
                    ${esUltima ? `<button type="button" id="agregarCondicion" class="btn btn-link text-success agregar-condicion p-0 mb-2 mr-2" title="Agregar condición">
                        <i class="fas fa-plus-circle"></i>
                    </button>` : ''}
                    <button type="button" class="btn btn-link text-danger eliminar-condicion p-0 mb-2 mr-1" title="Eliminar condición">
                        <i class="fas fa-times"></i>
                    </button>
                    <div class='operatorContainer'></div>
                </div>
            </div>
        </div>
        <div class="operador-logico"></div> <!-- Este queda como backup en caso de lógica extra -->
        `;

        // Eliminar condición
        const eliminarBtn = nuevaCondicion.querySelector('.eliminar-condicion');
        eliminarBtn.addEventListener('click', function () {
            nuevaCondicion.remove();
            actualizarBotonAgregar();
        });

        // Mostrar el operador lógico directamente en el badge (solo si no es la última)
        if (!esUltima) {
            const badge = nuevaCondicion.querySelector('.operador-logico-badge');
            const operadorSeleccionado = document.querySelector('input[name="operadorLogico"]:checked');
            if (badge && operadorSeleccionado) {
                badge.textContent = operadorSeleccionado.value;
            }
        }

        // Inicializar select dinámico
        const campoSelect = nuevaCondicion.querySelector('.campo-select');
        if (campoSelect) {
            setTimeout(() => {
                actualizarOperadoresYValorInput(campoSelect, condicionesContainer);
            }, 0);
        }

        condicionesContainer.appendChild(nuevaCondicion);
        actualizarBotonAgregar();
        actualizarOperadorActivo();
        
    }


    // Mantener solo un botón de agregar en la última condición
    function actualizarBotonAgregar() {
        document.querySelectorAll('.agregar-condicion').forEach(btn => btn.remove());

        const ultimaCondicion = condicionesContainer.lastElementChild;
        if (ultimaCondicion) {
            const divBotones = ultimaCondicion.querySelector('.d-flex');
            const nuevoBtnAgregar = document.createElement('button');
            nuevoBtnAgregar.type = 'button';
            nuevoBtnAgregar.id = 'agregarCondicion';
            nuevoBtnAgregar.className = 'btn btn-link text-success agregar-condicion p-0 mb-2 mr-2';
            nuevoBtnAgregar.title = 'Agregar condición';
            nuevoBtnAgregar.innerHTML = '<i class="fas fa-plus-circle"></i>';

            nuevoBtnAgregar.addEventListener('click', function () {
                validateCantidadCondiciones(condicionesContainer, nuevoBtnAgregar);
                crearCondicion(true);
            });

            // Insertar al principio del div de botones
            divBotones.insertBefore(nuevoBtnAgregar, divBotones.firstChild);
        }
    }

    // Agregar nueva condición inicial
    actualizarBotonAgregar();

    // Actualizar operadores y campo valor dinámicamente según el tipo
    document.querySelector('#condicionesContainer').addEventListener('change', function (e) {
        if (e.target.classList.contains('campo-select')) {
            actualizarOperadoresYValorInput(e.target, condicionesContainer);
        }
    });

    // Eliminar la primera condición si es más de una
    const eliminarCondicionBtn = document.querySelector('.condicion .eliminar-condicion');
    if (eliminarCondicionBtn) {
        eliminarCondicionBtn.addEventListener('click', function () {
            if (document.querySelectorAll('.condicion').length > 1) {
                eliminarCondicionBtn.closest('.condicion').remove();
                actualizarBotonAgregar();
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
                
                const resultadoDuplicado = validateCampoRepetido(condicionesContainer);
                if (!resultadoDuplicado.isValid) {
                    return;
                }
                const resultadoUltima = validateUltimaCondicion(condicionesContainer);
                if (!resultadoUltima.isValid) {
                    return;
                }
            
                const resultado = validateConditions(condicionesContainer);
                const condiciones = resultado.conditions;
                const label = resultado.label;
                console.log(condiciones);
                
                
                if (condiciones.length > 0) {
                    window.agregarFiltroActivo('personalizado',label,condiciones);
                    window.enviarFiltrosAlBackend();
                    const messageDiv = condicionesContainer.querySelector('.showMessage');
                    if (!messageDiv) return;

                    messageDiv.innerHTML = `
                        <div class="alert alert-success alert-dismissible fade show" role="alert">
                            <strong>Éxito:</strong> Filtro aplicado correctamente
                            <button type="button" class="close" data-dismiss="alert" aria-label="Cerrar">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                    `;
                } else {
                    mostrarMensajeError(condicionesContainer, 'Debe agregar al menos una condición válida');
                }
            });
    }
}
