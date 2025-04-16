import { mostrarMensajeError } from '../utils/mostrarMensajeError.js'; // Ajustá la ruta si es necesario

export function validateCampoRepetido(container) {
    const condiciones = container.querySelectorAll('.condicion');
    const campos = [];

    for (let i = 0; i < condiciones.length; i++) {
        const campoSelect = condiciones[i].querySelector('.campo-select');
        const campo = campoSelect?.value;

        if (campos.includes(campo)) {
            const mensaje = `El campo "${campoSelect.options[campoSelect.selectedIndex].text}" ya fue usado en otra condición.`;

            // Mostramos el error
            mostrarMensajeError(container, mensaje);

            return {
                isValid: false,
                messageError: mensaje
            };
        }

        campos.push(campo);
    }

    // Limpiar mensajes anteriores si todo está ok
    const messageDiv = container.querySelector('.showMessage');
    if (messageDiv) messageDiv.innerHTML = '';

    return {
        isValid: true,
        messageError: ''
    };
}
