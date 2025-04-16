// events/filtrosGuardadosEvents.js
export function inicializarEventosFiltrosGuardados() {
    const filtrosPanel = document.getElementById('filtrosPanel');

    document.querySelectorAll('#filtrosGuardadosContent td.dropdown-item').forEach(item => {
        item.addEventListener('click', function (e) {
            e.preventDefault();

            const texto = this.textContent.trim();
            const filtro = {
                campo: 'Filtro guardado',
                operador: '',
                valor: texto
            };

            window.agregarFiltroActivo('basico', texto);

            if (filtrosPanel) {
                filtrosPanel.style.display = 'none';
            }
        });
    });
}
