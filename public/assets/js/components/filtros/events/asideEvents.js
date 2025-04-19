// Importaciones de validaciones y utilidades
import { validateCantidadCondiciones, validateConditions } from '../validators/validateConditions.js';
import { validateCampoRepetido } from '../validators/validateCampoRepetido.js';
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
    const messageDiv = document.querySelector('.showMessage');
    const condicionBase = document.querySelector('.condicion');
    const campoOptions = condicionBase.querySelector('.campo-select').innerHTML;
    const operadorOptions = condicionBase.querySelector('.operador-select').innerHTML;
    
    if (!crearFiltroBtn || !aside) return;

    // Restaurar aside si estaba abierto
    if (localStorage.getItem('aside_abierto') === '1') {
        abrirAside();
        restaurarCondiciones();
    }

    crearFiltroBtn.addEventListener('click', (e) => {
        e.preventDefault();
        abrirAside();
    });

    function abrirAside() {
        aside.style.right = '0';
        document.body.style.overflow = 'hidden';
        localStorage.setItem('aside_abierto', '1');

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
    }

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


    function crearCondicion(esUltima = false, datos = null) {
        if (condicionesContainer.children.length > 0 && !datos) {
            if (!validateUltimaCondicion(condicionesContainer).isValid) return;
            if (!validateCampoRepetido(condicionesContainer).isValid) return;
            if (!validateCantidadCondiciones(condicionesContainer, document.getElementById('agregarCondicion')).isValid) return;

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
        nuevaCondicion.innerHTML = `
            <div class="form-row">
                <div class="col-md-4">
                    <label>Campo</label>
                    <select class="form-control campo-select">${campoOptions}</select>
                </div>
                <div class="col-md-3">
                    <label>Operador</label>
                    <select class="form-control operador-select">${operadorOptions}</select>
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
        const operadorSelect = nuevaCondicion.querySelector('.operador-select');
        const valorInput = nuevaCondicion.querySelector('.valor-input');

        condicionesContainer.appendChild(nuevaCondicion);

        if (datos) {
            campoSelect.value = datos.campo || '';
            setTimeout(() => {
                actualizarOperadoresYValorInput(campoSelect, condicionesContainer);
                operadorSelect.value = datos.operador || '';
                valorInput.value = datos.valor || '';
            }, 0);
        }

        actualizarBotonAgregar();
        actualizarOperadorActivo();

        if (campoSelect) {
            setTimeout(() => actualizarOperadoresYValorInput(campoSelect, condicionesContainer), 0);
        }
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
        const condiciones = validateConditions(condicionesContainer);
        if (!condiciones.isValid) return mostrarMensajeError(condicionesContainer, condiciones.message);

        const condicionesJSON = JSON.stringify(condiciones);
        localStorage.setItem('aside_abierto', '1');
        localStorage.setItem('condiciones_guardadas', condicionesJSON);

        window.agregarFiltroActivo('personalizado', condiciones.label, condiciones.conditions, false);

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

    function restaurarCondiciones() {
        const saved = localStorage.getItem('condiciones_guardadas');
        if (!saved) return;

        const parsed = JSON.parse(saved);
        const condiciones = parsed.conditions || [];
        const operador = parsed.label || 'AND';

        // Limpiar condiciones existentes
        condicionesContainer.innerHTML = '';
        
        // Restaurar cada condición
        condiciones.forEach((c, index) => {
            crearCondicion(index === condiciones.length - 1, {
                campo: c.field,
                operador: c.operator,
                valor: c.value
            });
        });

        // Restaurar operador lógico
        const operadorInputs = document.querySelectorAll('input[name="operadorLogico"]');
        let operadorEncontrado = false;
        
        operadorInputs.forEach(input => {
            if (input.value === operador) {
                input.checked = true;
                operadorEncontrado = true;
            }
        });
        
        // Si no se encontró coincidencia exacta, seleccionar el primero o el default
        if (!operadorEncontrado && operadorInputs.length > 0) {
            operadorInputs[0].checked = true;
        }
        
        actualizarOperadorActivo();

        // Actualizar los operadores y valores de input después de restaurar
        document.querySelectorAll('.campo-select').forEach(select => {
            actualizarOperadoresYValorInput(select, condicionesContainer);
        });

        // Actualizar el botón de agregar
        actualizarBotonAgregar();
    }
}
