import { mostrarMensajeError } from '../utils/mostrarMensajeError.js';

export function validateCampoRepetido(container) {
    const condiciones = container.querySelectorAll('.condicion');
    const camposUsados = new Map();

    for (let i = 0; i < condiciones.length; i++) {
        const condicion = condiciones[i];
        const campoSelect = condicion.querySelector('.campo-select');
        const campo = campoSelect?.value;

        // El operador lógico que une la anterior con esta está en esta condición (excepto la primera)
        const logicoSelect = condicion.querySelector('.operatorContainer');
        const operadorLogico = i > 0
            ? (logicoSelect?.textContent?.trim()?.toUpperCase() || 'AND')
            : null;
        console.log('Operador lógico:', operadorLogico);
        if (!campo) continue;

        // Solo validar repetidos si el operador lógico es AND y no es la primera condición
        if (operadorLogico === 'AND' && camposUsados.has(campo)) {
            const campoTexto = campoSelect.options[campoSelect.selectedIndex].text;
            console.log('Campo ', campoTexto);
            const mensaje = `El campo "${campoTexto}" ya fue usado en otra condición unida con AND.`;

            mostrarMensajeError(container, mensaje);

            return {
                isValid: false,
                messageError: mensaje
            };
        }

        camposUsados.set(campo, i);
    }

    // Limpiar mensajes anteriores si todo está bien
    const messageDiv = container.querySelector('.showMessage');
    if (messageDiv) messageDiv.innerHTML = '';

    return {
        isValid: true,
        messageError: ''
    };
}