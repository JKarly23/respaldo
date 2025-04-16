import { mostrarMensajeError } from '../utils/mostrarMensajeError.js';
import { operadoresPorTipo, nombresOperadores } from '../validators/validateConditions.js';

export function actualizarOperadoresYValorInput(campoSelect, container) {
 
    const condicion = campoSelect.closest('.condicion');
    let tipo = campoSelect.selectedOptions[0]?.dataset?.type;
    
    // Normaliza "datetime" como "date"
    let tipoNormalizado = tipo === 'datetime' ? 'date' : tipo;
   
    const operadorSelect = condicion.querySelector('.operador-select');
    const valorInput = condicion.querySelector('.valor-input');
    
    // Eliminar el segundo input si existe
    const segundoInput = condicion.querySelector('.segundo-valor-input');
    if (segundoInput) {
        segundoInput.parentElement.remove();
    }

    // Actualizar operadores válidos
    operadorSelect.innerHTML = '';
    const operadores = operadoresPorTipo[tipoNormalizado] || [];
    operadores.forEach(op => {
        const option = document.createElement('option');
        option.value = op;
        option.text = nombresOperadores[op];
        operadorSelect.appendChild(option);
    });

    // Cambiar input de valor según el tipo
    let nuevoInput;

    if (tipoNormalizado === 'boolean') {
        nuevoInput = document.createElement('select');
        nuevoInput.className = 'form-control valor-input';
        nuevoInput.innerHTML = `
            <option value="true">Sí</option>
            <option value="false">No</option>
        `;
    } else {
        nuevoInput = document.createElement('input');
        nuevoInput.type = tipoNormalizado === 'date' ? 'date' : (tipoNormalizado === 'number' ? 'number' : 'text');
        nuevoInput.className = 'form-control valor-input';
    }

    // Reemplazar el input actual
    valorInput.replaceWith(nuevoInput);
    
    // Agregar evento al operador para detectar cambios
    operadorSelect.addEventListener('change', function() {
        manejarCambioOperador(condicion, tipoNormalizado);
    });
}

// Función para manejar el cambio de operador
export function manejarCambioOperador(condicion, tipoNormalizado) {
    const operadorSelect = condicion.querySelector('.operador-select');
    const operador = operadorSelect.value;

    const valorInput = condicion.querySelector('.valor-input');
    const valorContainer = valorInput.closest('.col-md-3');
    const valorLabel = valorContainer.querySelector('label');

    // Eliminar el segundo input si existe
    const segundoInputContainer = condicion.querySelector('.segundo-valor-container');
    if (segundoInputContainer) {
        segundoInputContainer.remove();
    }
    
    // Si el operador es "between", agregar un segundo input
    if (operador === 'between') {
        valorLabel.textContent = 'Desde';
        const valorInput = condicion.querySelector('.valor-input');
        const valorContainer = valorInput.parentElement;
        
        // Crear contenedor para el segundo input
        const segundoInputContainer = document.createElement('div');
        segundoInputContainer.className = 'col-md-3 segundo-valor-container';
        segundoInputContainer.style.marginTop = '10px';
        
        // Crear label para el segundo input
        const label = document.createElement('label');
        label.textContent = 'Hasta';
        segundoInputContainer.appendChild(label);
        
        // Crear el segundo input
        let segundoInput;
        if (tipoNormalizado === 'boolean') {
            segundoInput = document.createElement('select');
            segundoInput.className = 'form-control segundo-valor-input';
            segundoInput.innerHTML = `
                <option value="true">Sí</option>
                <option value="false">No</option>
            `;
        } else {
            segundoInput = document.createElement('input');
            segundoInput.type = tipoNormalizado === 'date' ? 'date' : (tipoNormalizado === 'number' ? 'number' : 'text');
            segundoInput.className = 'form-control valor-input segundo-valor-input';
        }
        
        segundoInputContainer.appendChild(segundoInput);
        
        // Insertar después del contenedor del primer input
        valorContainer.parentNode.insertBefore(segundoInputContainer, valorContainer.nextSibling);
        
        // Agregar validación para asegurar que el segundo valor sea mayor que el primero
        segundoInput.addEventListener('change', function() {
            validarRangoBetween(condicion, tipoNormalizado);
        });
        
        valorInput.addEventListener('change', function() {
            validarRangoBetween(condicion, tipoNormalizado);
        });
    }

     // Validación del operador "between"
     if (operador === 'between') {
        const primerValor = condicion.querySelector('.valor-input').value;
        const segundoValor = condicion.querySelector('.segundo-valor-input')?.value;

        if (primerValor && segundoValor) {
            // Validar que el segundo valor sea mayor que el primero
            const esValido = validarRangoBetween(condicion, tipoNormalizado);
            if (!esValido) {
                mostrarMensajeError(container, 'El valor final debe ser mayor que el valor inicial');
                return; // Impide que el usuario agregue más condiciones
            }
        }
    }
}

// Función para validar que el segundo valor sea mayor que el primero
export function validarRangoBetween(condicion, tipoNormalizado) {
    const primerInput = condicion.querySelector('.valor-input');
    const segundoInput = condicion.querySelector('.segundo-valor-input');

    if (!primerInput || !segundoInput) return true; // Si no hay segundo input, no hay que validar

    const primerValor = primerInput.value;
    const segundoValor = segundoInput.value;

    if (!primerValor || !segundoValor) return true;

    let esValido = true;

    if (tipoNormalizado === 'number') {
        const num1 = parseFloat(primerValor);
        const num2 = parseFloat(segundoValor);

        if (num2 <= num1) {
            esValido = false;
        }
    } else if (tipoNormalizado === 'date') {
        const fecha1 = new Date(primerValor);
        const fecha2 = new Date(segundoValor);

        if (fecha2 <= fecha1) {
            esValido = false;
        }
    }

    if (!esValido) {
        segundoInput.setCustomValidity('El valor final debe ser mayor que el valor inicial');
        segundoInput.reportValidity();
    } else {
        segundoInput.setCustomValidity('');
    }

    return esValido;
}
