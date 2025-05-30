export const showDataFilterable = (registros, headers) => {
    const url = window.location.href;
    const container = document.querySelector(".card-body");

    // Limpiar tabla previa (y DataTables si aplica)
    const oldTable = container.querySelector(".table");
    if (oldTable) {
        if ($.fn.DataTable.isDataTable(oldTable)) {
            $(oldTable).DataTable().destroy();
        }
        oldTable.remove();
    }

    // Construir el encabezado de la tabla
    const thead = `
        <thead>
            <tr>
                <th>No.</th>
                ${headers.map(header => `<th>${header.label}</th>`).join('')}
                <th class="text-center">Opciones</th>
            </tr>
        </thead>
    `;

    // Construir el cuerpo de la tabla
    const tbody = `
        <tbody>
            ${registros.map((registro, index) => {
        const rowCells = `
                    <td>${index + 1}</td>
                    ${headers.map(header => {
            let value = getNestedValue(registro, header.field);

            // Lógica especial para el campo 'activo'
            if (header.field === 'activo') {
                value = value === '1' || value === 1
                    ? `<span class="ms-status -active">Habilitado</span>`
                    : `<span class="ms-status">Deshabilitado</span>`;
            }

            return `<td>${value !== undefined && value !== null ? value : ''}</td>`;
        }).join('')}
                `;

        const actions = `
                    <td class="text-center">
                        <a class="btn btn-outline-primary" title="Detalles" href='${url}/${registro.id}/detail'>
                            <i class="fa fa-eye"></i>
                        </a>
                        <a class="btn btn-outline-primary" title="Modificar" href='${url}/${registro.id}/modificar'>
                            <i class="fa fa-edit"></i>
                        </a>
                        <a class="btn btn-outline-danger" title="Eliminar" href='${url}/${registro.id}/eliminar'>
                            <i class="fa fa-trash"></i>
                        </a>
                    </td>
                `;

        return `<tr>${rowCells}${actions}</tr>`;
    }).join('')}
        </tbody>
    `;

    const tableHTML = `
        <table class="table table-striped table-bordered table-hover">
            ${thead}
            ${tbody}
        </table>
    `;
    container.innerHTML = tableHTML;

    restaurarDataTable();
};

const getNestedValue = (obj, field) => {
    return field.split('.').reduce((o, key) => (o ? o[key] : undefined), obj);
};