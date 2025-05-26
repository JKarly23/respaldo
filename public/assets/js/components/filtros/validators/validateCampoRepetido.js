import { mostrarMensajeError } from '../utils/mostrarMensajeError.js';

export function validateCampoRepetido(container) {
    const condiciones = container.querySelectorAll('.condicion');

    // Grupo actual: Map<campo, Set<operadores>>
    let camposGrupoActual = new Map();
    let grupoIndex = 0;

    for (let i = 0; i < condiciones.length; i++) {
        const condicion = condiciones[i];
        const campoSelect = condicion.querySelector('.campo-select');
        const operadorSelect = condicion.querySelector('.operador-select'); // <-- Asegúrate que el select exista

        const campo = campoSelect?.value;
        const operadorComparacion = operadorSelect?.value;

        if (!campo || !operadorComparacion) continue;

        // Leer el operador lógico desde la condición ANTERIOR
        let operadorLogico = 'AND'; // valor por defecto

        if (i > 0) {
            const condicionAnterior = condiciones[i - 1];
            const operadorSpan = condicionAnterior.querySelector('.operatorContainer span.badge');
            const texto = operadorSpan?.textContent?.trim()?.toUpperCase();
            if (texto === 'OR') {
                operadorLogico = 'OR';
            }
        }

        // Si es OR, reiniciar grupo actual
        if (operadorLogico === 'OR') {
            camposGrupoActual = new Map();
            grupoIndex++;
        }

        // Validación: campo ya existe con mismo operador de comparación
        const operadoresExistentes = camposGrupoActual.get(campo);

        if (operadoresExistentes?.has(operadorComparacion)) {
            const campoTexto = campoSelect.options[campoSelect.selectedIndex].text;
            const operadorTexto = operadorSelect.options[operadorSelect.selectedIndex].text;
            const mensaje = `El campo "${campoTexto}" ya tiene la condición "${operadorTexto}" dentro del mismo grupo AND.`;

            mostrarMensajeError(container, mensaje);
            return {
                isValid: false,
                messageError: mensaje
            };
        }

        // Agregar el operador al conjunto de operadores de ese campo
        if (!camposGrupoActual.has(campo)) {
            camposGrupoActual.set(campo, new Set([operadorComparacion]));
        } else {
            camposGrupoActual.get(campo).add(operadorComparacion);
        }
    }

    // Limpiar errores previos si todo está bien
    const messageDiv = container.querySelector('.showMessage');
    if (messageDiv) messageDiv.innerHTML = '';

    return {
        isValid: true,
        messageError: ''
    };
}
