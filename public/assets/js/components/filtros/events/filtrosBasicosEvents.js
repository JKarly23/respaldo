// events/filtrosBasicosEvents.js

import { reemplazarFiltrosActivos } from '../utils/filtrosActivos.js';

export function inicializarEventosFiltrosBasicos() {
    const filtrosPanel = document.getElementById('filtrosPanel');

    document.querySelectorAll('#filtrosBasicosContent .dropdown-item').forEach(item => {
        item.addEventListener('click', function (e) {
            e.preventDefault();

            const texto = this.textContent.trim();
            const filtro = {
                campo: 'Filtro básico',
                operador: '',
                valor: texto
            };

            reemplazarFiltrosActivos([filtro]);

            if (filtrosPanel) {
                filtrosPanel.style.display = 'none';
            }
        });
    });
}
