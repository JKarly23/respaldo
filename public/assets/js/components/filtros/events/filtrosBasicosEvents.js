export function inicializarEventosFiltrosBasicos() {
    const filtrosPanel = document.getElementById('filtrosPanel');

    document.querySelectorAll('#filtrosBasicosContent .dropdown-item, #filtrosBasicosContent a').forEach(item => {
        item.addEventListener('click', function (e) {
            e.preventDefault();

            const texto = this.textContent.trim();

            // Usar función global para mostrar el filtro activo
            window.agregarFiltroActivo('basico', texto);

            if (filtrosPanel) {
                filtrosPanel.style.display = 'none';
            }
        });
    });
}