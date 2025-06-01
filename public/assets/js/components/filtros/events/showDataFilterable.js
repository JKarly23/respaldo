const containerTable = document.querySelector(".card-body");
const table = containerTable.querySelector(".table"); // tabla original ya en el DOM
const originalTbodyHTML = table.querySelector("tbody").innerHTML; // Guardar contenido original




// Función para obtener valores anidados (ej: "categoriaEstructura.nombre")
const getNestedValue = (obj, field) => {
    return field.split('.').reduce((o, key) => (o ? o[key] : undefined), obj);
};


const buildBotonExport = (registros) => {

    const container = document.querySelector('.exportDiv');
    if (container) {
        container.remove();
    }

    const btnContainer = document.createElement('div');
    btnContainer.className = 'd-flex justify-content-end mb-3 exportDiv'; // Bootstrap clases para alineación y margen

    // Crear el botón de exportación
    const btnExport = document.createElement('button');
    btnExport.setAttribute('title', 'Exportar a excel');
    btnExport.className = 'btn btn-outline-primary';
    btnExport.innerHTML = '<i class="fa fa-file-excel"></i> Exportar';

    // Agregar botón al contenedor
    btnContainer.appendChild(btnExport);

    // Insertar el contenedor ANTES de la tabla si la tabla es hijo de containerTable
    if (table.parentNode === containerTable) {
        containerTable.insertBefore(btnContainer, table);
    } else {
        // Como fallback, simplemente agrégalo al inicio
        containerTable.insertBefore(btnContainer, containerTable.firstChild);
    }

    // Evento click para exportar los datos
    btnExport.addEventListener('click', () => {
        exportDataToCSV(registros);
    });
};

export const showDataFilterable = (registros, headers) => {

    buildBotonExport(registros);
    console.log("Registros: ", registros);
    console.log("Cabezera: ", headers);

    // Si DataTables está inicializado, destrúyelo antes de volver a inicializar
    if ($.fn.DataTable.isDataTable(table)) {
        $(table).DataTable().destroy();
    }

    const tbody = table.querySelector("tbody");

    if (!localStorage.getItem('filtros_activos')) {
        // Restaurar el contenido original
        tbody.innerHTML = originalTbodyHTML;
    } else {
        // Generar el nuevo contenido filtrado
        tbody.innerHTML = registros.map((registro, index) => {
            const rowCells = `
        <td>${index + 1}</td>
        ${headers.map((header, i) => {
                if (header.field === 'logo') {
                    return `<td>${getLogo(i + 1, registro)}</td>`;
                }

                let value = getNestedValue(registro, header.field);

                if (header.field === 'activo') {
                    value = value === true 
                        ? `<span class="ms-status -active">Habilitado</span>`
                        : `<span class="ms-status">Deshabilitado</span>`;
                }

                return `<td>${value !== undefined && value !== null ? value : ''}</td>`;
            }).join('')}
        <td class="text-center actions-cell">${getRowActions(registro.id)}</td>
    `;
            return `<tr>${rowCells}</tr>`;
        }).join('');
    }

    // Inicializar DataTables nuevamente
    restoreDataTable();
};

export const restoreOldTable = () => {
    if (!localStorage.getItem('filtros_activos')) {
        // Destruir DataTables antes de restaurar el contenido
        if ($.fn.DataTable.isDataTable(table)) {
            $(table).DataTable().destroy();
        }
        const tbody = table.querySelector("tbody");
        tbody.innerHTML = originalTbodyHTML;
    }
};

const getRowActions = (id) => {
    const rowCell = table.querySelector('tbody tr');
    if (!rowCell) return '';

    const actionCell = rowCell.querySelector('td.actions-cell, td:last-child');
    if (!actionCell) return '';

    const actionsDiv = document.createElement('div');
    actionsDiv.innerHTML = actionCell.innerHTML;

    const elements = actionsDiv.querySelectorAll('a, button');

    elements.forEach(element => {
        if (element.tagName === 'A') {
            // Procesar enlaces <a>
            const href = element.getAttribute('href');
            if (href) {
                const parts = href.split('/');
                if (parts.length >= 5) {
                    parts[3] = id;
                    element.setAttribute('href', parts.join('/'));
                }
            }
        } else if (element.tagName === 'BUTTON') {
            // Procesar botones <button>
            const dataUrl = element.getAttribute('data-url');
            if (dataUrl) {
                const parts = dataUrl.split('/');
                if (parts.length >= 5) {
                    parts[3] = id;
                    element.setAttribute('data-url', parts.join('/'));
                }
            }
        }
    });

    return actionsDiv.innerHTML;
};
const getLogo = (columnIndex, registro) => {
    try {
        // Obtener la primera fila para extraer el patrón del logo
        const firstRow = table.querySelector('tbody tr');
        if (!firstRow) return '';

        // Obtener la celda del logo
        const cells = firstRow.querySelectorAll('td');
        if (columnIndex >= cells.length) return '';

        const logoCell = cells[columnIndex];
        if (!logoCell) return '';

        // Clonar el HTML para no modificar el original
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = logoCell.innerHTML;

        // Buscar la imagen y modificar su src si existe
        const img = tempDiv.querySelector('img');
        if (img && registro.logo) {
            const srcParts = img.src.split('/');
            srcParts[srcParts.length - 1] = registro.logo; // Reemplazar el nombre del archivo
            img.src = srcParts.join('/');

            // También modificar el href del enlace si existe
            const link = tempDiv.querySelector('a');
            if (link) {
                const hrefParts = link.href.split('/');
                hrefParts[hrefParts.length - 1] = registro.logo;
                link.href = hrefParts.join('/').trim(); // .trim() para eliminar espacios si los hay
            }
        }
        console.log(tempDiv.innerHTML);
        return tempDiv.innerHTML;
    } catch (error) {
        console.error('Error en getLogo:', error);
        return '';
    }
};
function exportDataToCSV(registros) {
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const filename = (pathParts[0] || 'export') + '.csv';

    if (!registros || registros.length === 0) {
        console.warn('No hay registros para exportar.');
        return;
    }

    // Generar encabezados a partir del primer registro (aplanado)
    const firstRegistro = flattenRecord(registros[0]);
    const headers = Object.keys(firstRegistro);

    // Generar filas de datos
    const csvRows = registros.map(registro => {
        const flatRegistro = flattenRecord(registro);
        return headers.map(header => {
            if (header === 'activo') {
                console.log("estado:  ", registro.activo);
                const value = registro.activo === true ? 'Habilitado' : 'Desabilitado';
                console.log("Value:  ", value);
                return `"${String(value).replace(/"/g, '""')}"`;
            }
            const value = flatRegistro[header] !== undefined ? flatRegistro[header] : '';
            return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',');
    });

    // Agregar BOM para compatibilidad UTF-8
    const bom = '\uFEFF';
    const csvContent = bom + [headers.join(','), ...csvRows].join('\n');

    // Descargar CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    link.click();
    URL.revokeObjectURL(url);
}

function flattenRecord(registro) {
    const flat = {};

    for (const key in registro) {
        if (!registro.hasOwnProperty(key)) continue;

        const value = registro[key];
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            if ('date' in value) {
                // Formato de fecha
                flat[key] = value.date;
            } else if ('nombre' in value) {
                // Objeto con campo 'nombre'
                flat[key] = value.nombre;
            } else {
                flat[key] = '[objeto]';
            }
        } else {
            flat[key] = value;
        }
    }

    return flat;
}


const restoreDataTable = () => {
    $(table).DataTable({
        lengthMenu: [[5, 25, 50, -1], [5, 25, 50, "All"]],
        responsive: true,
        scrollX: true,
        autoWidth: false,
        buttons: [
            'copy',
            'colvis',
            {
                extend: 'excelHtml5',
                text: 'Exportar a Excel',
                className: 'btn btn-success'
            }
        ],
        language: {
            sProcessing: "Procesando...",
            sLengthMenu: "Mostrar _MENU_ registros",
            sZeroRecords: "No se encontraron resultados",
            sEmptyTable: "No existen resultados",
            sInfo: "Registros del _START_ al _END_ de _TOTAL_",
            sInfoEmpty: "Registros del 0 al 0 de 0",
            sInfoFiltered: "(filtrado de un total de _MAX_ registros)",
            sSearch: "Buscar:",
            oPaginate: {
                sFirst: "Primero",
                sLast: "Último",
                sNext: "Siguiente",
                sPrevious: "Anterior"
            },
            buttons: {
                copy: "Copiar",
                colvis: "Visibilidad"
            }
        }
    });
}