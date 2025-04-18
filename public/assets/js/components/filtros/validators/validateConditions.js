import { mostrarMensajeError } from '../utils/mostrarMensajeError.js';

export const operadoresPorTipo = {
    number: ['=', '!=', '>', '<', '>=', '<=', 'between'],
    integer: ['=', '!=', '>', '<', '>=', '<=', 'between'],
    string: ['contiene', 'no contiene', 'comienza', 'termina', '=', '!='],
    date: ['=', '!=', '>', '<', '>=', '<=', 'between'],
    datetime: ['=', '!=', '>', '<', '>=', '<=', 'between'],
    boolean: ['=']
};

export const nombresOperadores = {
    '=': 'Igual',
    '!=': 'Diferente',
    '>': 'Mayor',
    '<': 'Menor',
    '>=': 'Mayor o igual',
    '<=': 'Menor o igual',
    'between': 'Entre',
    'contiene': 'Contiene',
    'no contiene': 'No contiene',
    'comienza': 'Empieza con',
    'termina': 'Termina con'
};

export function validateConditions(container) {
    let isValid = true;
    let messageError = '';
    const conditions = [];
    const condiciones = container.querySelectorAll('.condicion');

    let expresionFinal = '';

    for (let i = 0; i < condiciones.length; i++) {
        const condicion = condiciones[i];
        const campoSelect = condicion.querySelector('.campo-select');
        const operadorSelect = condicion.querySelector('.operador-select');
        const valoresInputs = condicion.querySelectorAll('.valor-input');
        const valores = Array.from(valoresInputs).map(input => input.value.trim()).filter(v => v !== '');

        const campo = campoSelect?.value;
        const operador = operadorSelect?.value;
        const tipo = campoSelect?.selectedOptions[0]?.dataset?.type;

        // Validación de campos incompletos
        if (!campo || !operador || valores.length === 0) {
            isValid = false;
            messageError = `La condición ${i + 1} está incompleta.`;
            break;
        }

        // Validación especial para operador 'between'
        if (operador === 'between' && valores.length < 2) {
            isValid = false;
            messageError = `La condición ${i + 1} requiere dos valores para 'Entre'.`;
            break;
        }

        // Validar tipo de dato
        for (let valor of valores) {
            const tipoValidation = validateTipoDato(tipo, valor, i + 1);
            if (!tipoValidation.isValid) {
                isValid = false;
                messageError = tipoValidation.messageError;
                break;
            }
        }

        // Validar operador según tipo
        const opValidation = validateOperadorPorTipo(tipo, operador, i + 1);
        if (!opValidation.isValid) {
            isValid = false;
            messageError = opValidation.messageError;
            break;
        }

        // Obtener operador lógico de la condición anterior (si existe)
        let operadorLogico = null;
        if (i > 0) {
            const condicionAnterior = condiciones[i - 1];
            const operadorBadge = condicionAnterior.querySelector('.operatorContainer .badge');
            operadorLogico = operadorBadge ? operadorBadge.textContent.trim() : null;
        }

        // Construir expresión legible para backend
        const nombreCampo = campoSelect.options[campoSelect.selectedIndex].text;
        const operadorLegible = operadorSelect.options[operadorSelect.selectedIndex].text;

        let expresion = '';
        if (operador === 'between') {
            expresion = `(${nombreCampo} BETWEEN '${valores[0]}' AND '${valores[1]}')`;
        } else if (operador.toLowerCase().includes('contiene')) {
            expresion = `(${nombreCampo} LIKE '%${valores[0]}%')`;
        } else if (['igual', 'Igual'].includes(operador)) {
            expresion = `(${nombreCampo} = '${valores[0]}')`;
        } else if (['diferente', 'No igual'].includes(operador)) {
            expresion = `(${nombreCampo} != '${valores[0]}')`;
        } else {
            expresion = `(${nombreCampo} ${operadorLegible} '${valores[0]}')`;
        }

        expresionFinal += i === 0 ? expresion : ` ${operadorLogico} ${expresion}`;

        conditions.push({
            campo: nombreCampo,
            operador: operadorLegible,
            valor: operador === 'between' ? valores.join(' - ') : valores[0],
            logico: operadorLogico,
            tipo: tipo
        });
    }

    const mappedConditions = construirExpresionLegible(conditions);

    if (!isValid) {
        mostrarMensajeError(container, messageError);
    }

    return {
        isValid,
        messageError,
        conditions,
        label: mappedConditions
    };
}

export const validateTipoDato = (tipo, valor, index) => {
    if (tipo === 'number' && isNaN(valor)) {
        return { isValid: false, messageError: `El valor de la condición ${index} debe ser un número.` };
    }

    if (tipo === 'date' && !/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
        return { isValid: false, messageError: `El valor de la condición ${index} debe tener formato YYYY-MM-DD.` };
    }

    if (tipo === 'string' && valor.length > 255) {
        return { isValid: false, messageError: `El valor de la condición ${index} excede 255 caracteres.` };
    }

    if (tipo === 'boolean' && !['true', 'false'].includes(valor.toLowerCase())) {
        return { isValid: false, messageError: `El valor de la condición ${index} debe ser 'Sí' o 'No'.` };
    }

    return { isValid: true, messageError: '' };
};

export const validateOperadorPorTipo = (tipo, operador, index) => {
    const operadoresValidos = operadoresPorTipo[tipo] || [];

    if (!operadoresValidos.includes(operador)) {
        return {
            isValid: false,
            messageError: `El operador de la condición ${index} no es válido para campos de tipo ${tipo}.`
        };
    }

    return { isValid: true, messageError: '' };
};

export function validateCantidadCondiciones(condicionesContainer, nuevoBtnAgregar) {
    const condicionesActuales = condicionesContainer.querySelectorAll('.condicion').length;
    const primerSelect = condicionesContainer.querySelector('.campo-select');
    const camposDisponibles = primerSelect ? primerSelect.options.length : 0;

    const isValid = condicionesActuales < camposDisponibles;

    if (nuevoBtnAgregar) {
        nuevoBtnAgregar.style.display = isValid ? 'block' : 'none';
    }

    return {
        isValid,
        message: isValid ? '' : 'No puedes agregar más condiciones: ya estás usando todos los campos disponibles.'
    };
}

function construirExpresionLegible(filtros) {
    return filtros.map(f => {
        const campo = f.campo;
        const operador = traducirOperador(f.operador);
        const valor = f.valor === true ? "Sí" : f.valor === false ? "No" : `"${f.valor}"`;
        const logico = f.logico ? ` ${f.logico} ` : '';
        return `${logico}${campo} ${operador} ${valor}`;
    }).join('');
}

function traducirOperador(op) {
    const mapa = {
        '=': 'es igual a',
        '!=': 'es distinto de',
        '>': 'es mayor que',
        '<': 'es menor que',
        'like': 'contiene',
        'between': 'está entre'
    };
    return mapa[op] || op;
}
