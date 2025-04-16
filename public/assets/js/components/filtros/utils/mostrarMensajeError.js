export const mostrarMensajeError = (container, mensaje) => {
    const messageDiv = container.querySelector('.showMessage');
    if (!messageDiv) return;

    messageDiv.innerHTML = `
        <div class="alert alert-danger alert-dismissible fade show" role="alert">
            <strong>Error:</strong> ${mensaje}
            <button type="button" class="close" data-dismiss="alert" aria-label="Cerrar">
                <span aria-hidden="true">&times;</span>
            </button>
        </div>
    `;
}
