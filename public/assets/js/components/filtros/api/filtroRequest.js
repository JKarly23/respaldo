import { resetCache, getCachedFiltersWithLoader, showFiltersSaved } from "../events/filtrosPanelEvents.js";

// Función para mostrar notificaciones
function mostrarNotificacion(mensaje, tipo = 'success') {
    const notificacion = document.createElement('div');
    notificacion.className = `alert alert-${tipo} position-fixed shadow-sm`;
    notificacion.style.cssText = `
        top: 5%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 1050;
        transition: opacity 0.3s ease;
        padding: 15px 20px;
        text-align: center;
        background-color: ${tipo === 'success' ? '#d4edda' : '#f8d7da'};
        color: ${tipo === 'success' ? '#155724' : '#721c24'};
        border: 1px solid ${tipo === 'success' ? '#c3e6cb' : '#f5c6cb'};
        border-radius: 5px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    `;
    notificacion.innerHTML = `
        <strong>${tipo === 'success' ? '✅' : '❌'}</strong> ${mensaje}
    `;

    document.body.appendChild(notificacion);

    setTimeout(() => {
        notificacion.style.opacity = '0';
        setTimeout(() => notificacion.remove(), 300);
    }, 5000);
}

// Guardar un filtro
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
    }).then(response => {
        if (!response.ok) throw new Error('Error al guardar el filtro');
        return response.json();
    })
        .then(() => {
            mostrarNotificacion('Filtro guardado correctamente.');
        })
        .catch(error => {
            console.error('Error en el guardado:', error);
            mostrarNotificacion('Hubo un problema al guardar el filtro.', 'danger');
        });
}

// Obtener todos los filtros de un usuario
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
        mostrarNotificacion('Error al cargar los filtros.', 'danger');
        return { message: 'Error al cargar los filtros' };
    }
};

// Actualizar un filtro
export const editarFiltro = async (filtro) => {
    const { id, name, payload } = filtro;

    const payloadTransformado = {
        name,
        filterJson: payload
    };

    try {
        const response = await fetch(`/filter/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(payloadTransformado)
        });

        if (!response.ok) {
            throw new Error(`Error en la respuesta: ${response.status}`);
        }

        const data = await response.json();
        mostrarNotificacion(data.message || 'Filtro actualizado correctamente.');


        resetCache();
        const filters = await getCachedFiltersWithLoader();
        showFiltersSaved(filters);
    } catch (error) {
        console.error('Error al actualizar el filtro:', error);
        mostrarNotificacion('Hubo un problema al actualizar el filtro.', 'danger');
    }
};

// Eliminar un filtro
export const deleteFilter = async (id) => {
    console.log(id);
    try {
        const response = await fetch(`/filter/${id}`, {
            method: 'DELETE',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        if (!response.ok) {
            throw new Error(`Error en la respuesta: ${response.status}`);
        }

        mostrarNotificacion('Filtro eliminado correctamente.');


        resetCache();
        const filters = await getCachedFiltersWithLoader();
        showFiltersSaved(filters);
    } catch (error) {
        console.error('Error al eliminar el filtro:', error);
        mostrarNotificacion('Hubo un problema al eliminar el filtro.', 'danger');
    }
};