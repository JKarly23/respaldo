const condicionesBasicas = {
    'Instituciones activas': {
        campo: 'estado',
        operador: '=',
        valor: 'activa'
    },
    'Con sitio web': {
        campo: 'sitio_web',
        operador: 'IS NOT',
        valor: null
    },
    'Con rector y grado académico': {
        campo: 'rector_grado',
        operador: '=',
        valor: 'presente'
    },
    'Con teléfono disponible': {
        campo: 'telefono',
        operador: 'IS NOT',
        valor: null
    },
    'Acreditadas': {
        campo: 'acreditacion',
        operador: '=',
        valor: 'true'
    }
};
export function inicializarEventosFiltrosBasicos() {
    const filtrosPanel = document.getElementById('filtrosPanel');

    document.querySelectorAll('#filtrosBasicosContent .dropdown-item, #filtrosBasicosContent a').forEach(item => {
        item.addEventListener('click', function (e) {
            e.preventDefault();

            const texto = this.textContent.trim();
            const payload = condicionesBasicas[texto];

            if (!payload) {
                console.warn(`No se encontró una condición para el filtro: ${texto}`);
                return;
            }

            // Enviar directamente con payload
            window.agregarFiltroActivo('basico', texto, payload, true);

            if (filtrosPanel) {
                filtrosPanel.style.display = 'none';
            }
        });
    });
}
