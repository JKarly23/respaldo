import { editarFiltro, findAllByUser } from "../api/filtroRequest.js";
import { inicializarModalDelete } from "./filtroDelete.js";

let cachedFilters = null;

export async function inicializarEventosFiltrosPanel() {
    const btnFiltros = document.getElementById('btnFiltros');
    const filtrosPanel = document.getElementById('filtrosPanel');

    if (!btnFiltros || !filtrosPanel) return;

    btnFiltros.addEventListener('click', async function (event) {
        event.stopPropagation();
        const isVisible = filtrosPanel.style.display === 'block';

        filtrosPanel.style.display = isVisible ? 'none' : 'block';

        if (!isVisible) {
            const filters = await getCachedFiltersWithLoader();
            showFiltersSaved(filters);
        }
    });

    document.querySelectorAll('.toggle-section').forEach(section => {
        section.addEventListener('click', function (event) {
            event.stopPropagation();
            const targetId = this.getAttribute('data-target');
            const content = document.querySelector(targetId);
            const icon = this.querySelector('.toggle-icon');

            if (content) {
                content.classList.toggle('d-none');
                icon.classList.toggle('rotate');
            }
        });
    });

    document.addEventListener('click', function (event) {
        const isClickInside = filtrosPanel.contains(event.target) || btnFiltros.contains(event.target);
        if (!isClickInside) {
            filtrosPanel.style.display = 'none';
        }
    });

    const crearFiltroPersonalizado = document.getElementById('crearFiltroPersonalizado');
    if (crearFiltroPersonalizado) {
        crearFiltroPersonalizado.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            filtrosPanel.style.display = 'none';
        });
    }
}
export async function getCachedFiltersWithLoader() {
    const tablaBody = document.getElementById('saved_filters');
    if (!tablaBody) return [];

    // Mostrar loading antes de llamar al servidor
    tablaBody.innerHTML = '';
    const loadingRow = document.createElement('tr');
    const loadingCell = document.createElement('td');
    loadingCell.setAttribute('colspan', '3');
    loadingCell.classList.add('text-center');
    loadingCell.innerHTML = `<span class="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span> Cargando filtros...`;
    loadingRow.appendChild(loadingCell);
    tablaBody.appendChild(loadingRow);

    // Si hay caché, la usamos
    if (cachedFilters) {
        await sleep(200); // Simula un pequeño delay para UX fluida
        return cachedFilters;
    }

    // Sino, la buscamos y cacheamos
    const filters = await findAllByUser();
    cachedFilters = filters;
    return filters;
}

export function resetCache() {
    cachedFilters = null;
}

// Utilidad para simular retardo suave si se desea
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function showFiltersSaved(filters) {
    const tablaBody = document.getElementById('saved_filters');
    if (!tablaBody) return;

    tablaBody.innerHTML = '';

    if (filters.message) {
        const row = document.createElement('tr');
        const cellMessage = document.createElement('td');
        cellMessage.setAttribute('colspan', '3');
        cellMessage.classList.add('text-center', 'text-muted');
        cellMessage.textContent = filters.message;
        row.appendChild(cellMessage);
        tablaBody.appendChild(row);
        return;
    }

    filters.forEach(filter => {
        const row = document.createElement('tr');

        // --- Celda del nombre del filtro ---
        const cellName = document.createElement('td');
        const nameButton = document.createElement('button');
        nameButton.textContent = filter.name;
        nameButton.classList.add('btn', 'btn-link', 'p-0', 'm-0');
        nameButton.style.textAlign = 'left';
        nameButton.title = 'Aplicar filtro';

        // Al hacer clic en el nombre, se activa el filtro
        nameButton.addEventListener('click', () => {
            window.agregarFiltroActivo('guardado', filter.name, filter.payload, true);
        });

        cellName.appendChild(nameButton);
        row.appendChild(cellName);

        // --- Celda de acciones ---
        const cellActions = document.createElement('td');
        cellActions.classList.add('text-center');

        // Botón Editar
        const editButton = document.createElement('button');
        editButton.type = 'button';
        editButton.classList.add('btn', 'btn-link', 'text-primary', 'p-0', 'mr-2');
        editButton.title = 'Editar';
        editButton.id = `edit-filter-${filter.id}`;
        editButton.dataset.id = filter.id;
        editButton.innerHTML = '<i class="fas fa-edit"></i>';

        // Botón Eliminar
        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.classList.add('btn', 'btn-link', 'text-danger', 'p-0');
        deleteButton.title = 'Eliminar';
        deleteButton.id = `delete-filter-${filter.id}`;
        deleteButton.dataset.id = filter.id;
        deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i>';

        cellActions.appendChild(editButton);
        cellActions.appendChild(deleteButton);
        row.appendChild(cellActions);
        tablaBody.appendChild(row);

        // Eventos para editar y eliminar
        editButton.addEventListener('click', (event) => {
            event.preventDefault();
            console.log(filter.filterJson);
            editarFiltro(filter.filterJson);
        });

        deleteButton.addEventListener('click', (event) => {
            event.preventDefault();
            const filterId = event.currentTarget.dataset.id;
            inicializarModalDelete(filterId);
        });
    });
}