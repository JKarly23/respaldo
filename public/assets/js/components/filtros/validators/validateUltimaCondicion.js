import { mostrarMensajeError } from '../utils/mostrarMensajeError.js';
import { validateTipoDato, validateOperadorPorTipo } from '../validators/validateConditions.js';

export function validateUltimaCondicion(container) {
    const ultimaCondicion = container.querySelector('.condicion:last-child');
    const messageDiv = container.querySelector('.showMessage');
    if (messageDiv) messageDiv.innerHTML = '';

    if (!ultimaCondicion) {
        const msg = 'No hay ninguna condición agregada.';
        mostrarMensajeError(container, msg);
        return { isValid: false, messageError: msg };
    }

    const campoSelect = ultimaCondicion.querySelector('.campo-select');
    const operadorSelect = ultimaCondicion.querySelector('.operador-select');
    const valoresInputs = ultimaCondicion.querySelectorAll('.valor-input');

    const campo = campoSelect?.value;
    const operador = operadorSelect?.value;
    const tipo = campoSelect?.selectedOptions[0]?.dataset?.type;
    const valores = Array.from(valoresInputs).map(input => input.value.trim()).filter(Boolean);

    let isValid = true;
    let messageError = '';

    // Validación general de presencia
    if (!campo || !operador || valores.length === 0) {
        return returnError('La última condición está incompleta.');
    }

    // Validación de operador 'between'
    if (operador === 'between') {
        if (valores.length < 2) return returnError(`La condición 'Entre' requiere dos valores.`);

        const [valorInicial, valorFinal] = valores;

        if (['date', 'datetime'].includes(tipo)) {
            const fecha1 = new Date(valorInicial);
            const fecha2 = new Date(valorFinal);

            if (isNaN(fecha1) || isNaN(fecha2)) return returnError(`Las fechas ingresadas no son válidas.`);
            if (fecha1 > fecha2) return returnError(`La fecha inicial no puede ser mayor que la fecha final.`);
        } else if (valorInicial > valorFinal) {
            return returnError(`El valor inicial no puede ser mayor que el valor final.`);
        }
    }

    // Validación de operadores especiales
    if (['comienza', 'termina'].includes(operador) && valores[0].length > 1) {
        return returnError(`El operador 'Comienza' o 'Termina' solo requiere un valor de un carácter.`);
    }

    // Validación por tipo de dato
    for (let valor of valores) {
        const tipoValidation = validateTipoDato(tipo, valor);
        if (!tipoValidation.isValid) return returnError(tipoValidation.messageError);
    }

    // Validación por tipo de operador
    const opValidation = validateOperadorPorTipo(tipo, operador);
    if (!opValidation.isValid) return returnError(opValidation.messageError);

    return { isValid: true, messageError: '' };

    // Función auxiliar para manejar errores
    function returnError(msg) {
        mostrarMensajeError(container, msg);
        return { isValid: false, messageError: msg };
    }
}
