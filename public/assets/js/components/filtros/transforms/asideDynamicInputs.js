import { mostrarMensajeError } from '../utils/mostrarMensajeError.js';
import { operadoresPorTipo, nombresOperadores } from '../validators/validateConditions.js';

export function actualizarOperadoresYValorInput(campoSelect, container) {
    const condicion = campoSelect.closest('.condicion');
    const tipo = normalizarTipo(campoSelect.selectedOptions[0]?.dataset?.type);

    const operadorSelect = condicion.querySelector('.operador-select');
    const valorInput = condicion.querySelector('.valor-input');

    eliminarElemento(condicion.querySelector('.segundo-valor-input')?.parentElement);

    actualizarSelectOperadores(operadorSelect, tipo);
    const nuevoInput = crearInputPorTipo(tipo, 'valor-input');
    valorInput.replaceWith(nuevoInput);

    operadorSelect.addEventListener('change', () => {
        manejarCambioOperador(condicion, tipo, container);
    });
}

export function manejarCambioOperador(condicion, tipo, container) {
    const operador = condicion.querySelector('.operador-select').value;
    const valorInput = condicion.querySelector('.valor-input');
    const valorContainer = valorInput.closest('.col-md-3');
    const valorLabel = valorContainer.querySelector('label');

    eliminarElemento(condicion.querySelector('.segundo-valor-container'));

    if (operador === 'between') {
        valorLabel.textContent = 'Desde';

        const segundoInputContainer = document.createElement('div');
        segundoInputContainer.className = 'col-md-3 segundo-valor-container';
        segundoInputContainer.style.marginTop = '10px';

        segundoInputContainer.innerHTML = `
            <label>Hasta</label>
        `;

        // Modificar aquí para añadir ambas clases: segundo-valor-input y valor-input
        const segundoInput = crearInputPorTipo(tipo, 'segundo-valor-input valor-input');
        segundoInputContainer.appendChild(segundoInput);
        valorContainer.parentNode.insertBefore(segundoInputContainer, valorContainer.nextSibling);

        [valorInput, segundoInput].forEach(input =>
            input.addEventListener('change', () => validarRangoBetween(condicion, tipo, container))
        );

        validarRangoBetween(condicion, tipo, container);
    }
}

export function validarRangoBetween(condicion, tipo, container) {
    const primerInput = condicion.querySelector('.valor-input');
    const segundoInput = condicion.querySelector('.segundo-valor-input');

    if (!primerInput || !segundoInput) return true;

    const val1 = primerInput.value;
    const val2 = segundoInput.value;

    if (!val1 || !val2) return true;

    const esValido = compararValores(val1, val2, tipo);

    if (!esValido) {
        segundoInput.setCustomValidity('El valor final debe ser mayor que el valor inicial');
        segundoInput.reportValidity();
        mostrarMensajeError(container, 'El valor final debe ser mayor que el valor inicial');
    } else {
        segundoInput.setCustomValidity('');
    }

    return esValido;
}

// ==== Funciones auxiliares ====

function normalizarTipo(tipo) {
    return tipo === 'datetime' ? 'date' : tipo === 'integer' ? 'number' : tipo;
}

function eliminarElemento(elemento) {
    if (elemento) elemento.remove();
}

function actualizarSelectOperadores(select, tipo) {
    select.innerHTML = '';
    (operadoresPorTipo[tipo] || []).forEach(op => {
        const option = document.createElement('option');
        option.value = op;
        option.text = nombresOperadores[op];
        select.appendChild(option);
    });
}

function crearInputPorTipo(tipo, claseExtra = '') {
    let input;

    if (tipo === 'boolean') {
        input = document.createElement('select');
        input.innerHTML = `
            <option value="true">Sí</option>
            <option value="false">No</option>
        `;
    } else {
        input = document.createElement('input');
        input.type = tipo === 'date' ? 'date' : tipo === 'number' ? 'number' : 'text';
        if (['comienza', 'termina'].includes(tipo)) input.setAttribute('maxlength', '1');
    }

    input.className = `form-control ${claseExtra}`.trim();
    return input;
}

function compararValores(val1, val2, tipo) {
    if (tipo === 'number') {
        return parseFloat(val2) > parseFloat(val1);
    } else if (tipo === 'date') {
        return new Date(val2) > new Date(val1);
    }
    return true;
}
