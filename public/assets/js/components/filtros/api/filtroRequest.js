export function savedFilters() {
    const filtrosActivos = localStorage.getItem('filtros_activos');
    const filtroNombre = document.getElementById('nombreFiltro').value.trim();

    if (!filtroNombre || !filtrosActivos) {
        alert('Faltan datos: asegúrate de completar el nombre y tener filtros activos.');
        return;
    }

    const filtrosArray = JSON.parse(filtrosActivos);
    const filtroPersonalizado = filtrosArray.find(f => f.tipo === 'personalizado');

    if (!filtroPersonalizado || !filtroPersonalizado.payload) {
        alert('No se encontró un filtro personalizado válido.');
        return;
    }

    const filtrosJSON = filtroPersonalizado.payload;

    const urlActual = window.location.pathname;
    const nameEntity = urlActual.split('/')[2];
    console.log(nameEntity);


    const payload = {
        name: filtroNombre,
        nameEntity: nameEntity,
        filterJson: filtrosJSON
    };

    fetch('/filter/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(payload)
    })
        .then(response => {
            if (!response.ok) throw new Error('Error al guardar el filtro');
            return response.json();
        })
        .then(data => {
            alert('✅ Filtro guardado correctamente');
        })
        .catch(error => {
            console.error('❌ Error en el guardado:', error);
            alert('Hubo un problema al guardar el filtro');
        });
}

export const findAllByUser = async () => {
    try {
        const entity = window.location.pathname.split('/')[2];
        const response = await fetch(`/filter/${entity}`);
        if (!response.ok) {
            throw new Error(`Error en la respuesta: ${response.status}`);
        }
        const { filters } = await response.json();
        return filters.length ? filters : { message: 'No hay filtros guardados para esta vista' };
    } catch (error) {
        console.error('Error al obtener los filtros:', error);
        return { message: 'Error al cargar los filtros' };
    }
};