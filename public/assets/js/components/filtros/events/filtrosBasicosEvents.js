const hoy = new Date();
const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
const primerDiaAnno = new Date(hoy.getFullYear(), 0, 1);
const haceCincoMeses = new Date(hoy.getFullYear(), hoy.getMonth() - 5, hoy.getDate());

function formatoFecha(fecha) {
    return fecha.toISOString().slice(0, 10);
}

const condicionesBasicas = {
    'Habilitados': {
        campo: 'activo',
        operador: 'Igual',
        valor: 'true',
        logico: null,
        tipo: 'boolean'
    },
    'Desabilitados': {
        campo: 'activo',
        operador: 'Igual',
        valor: 'false',
        logico: null,
        tipo: 'boolean'
    },
    'Creados este mes': {
        campo: 'creado',
        operador: 'Entre',
        valor: `${formatoFecha(primerDiaMes)} - ${formatoFecha(hoy)}`,
        logico: null,
        tipo: 'datetime'
    },
    'Creados el último año': {
        campo: 'creado',
        operador: 'Entre',
        valor: `${formatoFecha(primerDiaAnno)} - ${formatoFecha(hoy)}`,
        logico: null,
        tipo: 'datetime'
    },
    'Actualizados hace 5 meses': {
        campo: 'actualizado',
        operador: 'MayorIgual',
        valor: formatoFecha(haceCincoMeses),
        logico: null,
        tipo: 'datetime'
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

            // Enviar como array de condiciones
            window.agregarFiltroActivo('basico', texto, [payload], true);

            if (filtrosPanel) {
                filtrosPanel.style.display = 'none';
            }
        });
    });
}