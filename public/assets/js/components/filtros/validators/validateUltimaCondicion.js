import { mostrarMensajeError } from '../utils/mostrarMensajeError.js';
import { validateTipoDato, validateOperadorPorTipo } from '../validators/validateConditions.js';
import { validarRangoBetween } from '../transforms/asideDynamicInputs.js';
export function validateUltimaCondicion(container) {
    let isValid = true;
    let messageError = '';
    const ultimaCondicion = container.querySelector('.condicion:last-child');

    // Limpiar cualquier mensaje de error previo
    const messageDiv = container.querySelector('.showMessage');
    if (messageDiv) {
        messageDiv.innerHTML = ''; // Limpiar cualquier mensaje previo
    }

    if (!ultimaCondicion) {
        mostrarMensajeError(container, 'No hay ninguna condición agregada.');
        return { isValid: false, messageError: 'No hay ninguna condición agregada.' };
    }


    const campoSelect = ultimaCondicion.querySelector('.campo-select');
    const operadorSelect = ultimaCondicion.querySelector('.operador-select');
    const valoresInputs = ultimaCondicion.querySelectorAll('.valor-input');
    const valores = Array.from(valoresInputs).map(input => input.value.trim()).filter(v => v !== '');

    const campo = campoSelect?.value;
    const operador = operadorSelect?.value;
    const tipo = campoSelect?.selectedOptions[0]?.dataset?.type;

    if (!campo || !operador || valores.length === 0) {
        isValid = false;
        messageError = `La última condición está incompleta.`;
    }

    if (operador === 'between' && valores.length < 2) {
        isValid = false;
        messageError = `La condición 'Entre' requiere dos valores.`;
    }

    if (operador === 'between') {
        if (tipo === 'date' || tipo === 'datetime') {
            const fecha1 = new Date(valores[0]);
            const fecha2 = new Date(valores[1]);
            
            // Verificar si las fechas son válidas
            if (!isNaN(fecha1.getTime()) && !isNaN(fecha2.getTime())) {
                // Comparar si la primera fecha es mayor que la segunda
                if (fecha1 > fecha2) {
                    isValid = false;
                    messageError = `La fecha inicial no puede ser mayor que la fecha final.`;
                }
            } else {
                isValid = false;
                messageError = `Las fechas ingresadas no son válidas.`;
            }
        } else if (valores[0] > valores[1]){
            isValid = false;
                messageError = `El valor inicial no puede ser mayor que el valor final.`;
        }
    }    
    for (let valor of valores) {
        const tipoValidation = validateTipoDato(tipo, valor);
        if (!tipoValidation.isValid) {
            isValid = false;
            messageError = tipoValidation.messageError;
            break;
        }
    }

    const opValidation = validateOperadorPorTipo(tipo, operador);
    if (!opValidation.isValid) {
        isValid = false;
        messageError = opValidation.messageError;
    }

    
    // Si hay un error, lo mostramos en el div de mensajes
    if (!isValid) {
        mostrarMensajeError(container, messageError);
    }

    return { isValid, messageError };
}
