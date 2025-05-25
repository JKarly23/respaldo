import { editarFiltro } from "../api/filtroRequest.js";
import { validateConditions } from "../validators/validateConditions.js";

/**
 * Convierte camelCase o snake_case a una cadena legible para el usuario.
 */
function prettify(str) {
    if (!str) return '';
    return str
        .replace(/_/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

/**
 * Crea un input HTML según el tipo de dato.
 */
function crearInput(nombre, valor, tipo) {
    const input = document.createElement('input');
    input.name = nombre;
    input.value = valor || '';
    input.classList.add('form-control');
    switch (tipo) {
        case 'date':
        case 'datetime':
            input.type = 'date';
            break;
        case 'number':
            input.type = 'number';
            break;
        default:
            input.type = 'text';
    }
    return input;
}

export function inicializarModalUpdate(filter) {
    const modalUpdate = document.getElementById('updateFilterModal');
    const btnUpdate = document.getElementById('btnUpdate');
    const btnCancel = document.getElementById('btnCancel');
    const form = document.getElementById('filterEditForm');

    if (!modalUpdate || !btnUpdate || !btnCancel || !form) return;

    $('#updateFilterModal').modal('show');

    // Limpiar eventos previos
    const nuevoBtnUpdate = btnUpdate.cloneNode(true);
    btnUpdate.parentNode.replaceChild(nuevoBtnUpdate, btnUpdate);
    const nuevoBtnCancel = btnCancel.cloneNode(true);
    btnCancel.parentNode.replaceChild(nuevoBtnCancel, btnCancel);

    // Limpiar formulario
    form.innerHTML = '';

    // Campo para editar el nombre del filtro
    const nombreContainer = document.createElement('div');
    nombreContainer.classList.add('form-group');
    const nombreLabel = document.createElement('label');
    nombreLabel.textContent = 'Nombre del filtro';
    nombreLabel.classList.add('font-weight-bold');
    const nombreInput = document.createElement('input');
    nombreInput.type = 'text';
    nombreInput.name = 'filterName';
    nombreInput.classList.add('form-control', 'mb-3');
    nombreInput.value = filter.name || '';
    nombreInput.placeholder = 'Ej. Estructuras activas';
    nombreContainer.appendChild(nombreLabel);
    nombreContainer.appendChild(nombreInput);
    form.appendChild(nombreContainer);

    const scrollContainer = document.createElement('div');
    scrollContainer.style.maxHeight = '400px';
    scrollContainer.style.overflowY = 'auto';
    scrollContainer.style.padding = '10px';
    scrollContainer.style.border = '1px solid #dee2e6';
    scrollContainer.style.borderRadius = '5px';
    form.appendChild(scrollContainer);

    // Guardar referencias a los selects de operadores lógicos
    const logicoSelects = [];

    // Mostrar condiciones
    filter.payload.forEach((condicion, index) => {
        // Fila de la condición
        const row = document.createElement('div');
        row.classList.add('form-row', 'align-items-center', 'mb-4', 'pb-2', 'border-bottom');

        // Columna campo
        const campoCol = document.createElement('div');
        campoCol.classList.add('col-md-3');
        campoCol.innerHTML = `<label class="font-weight-bold mb-1">${prettify(condicion.campo.split('.')[0])}</label>`;
        row.appendChild(campoCol);

        // Columna operador
        const operadorCol = document.createElement('div');
        operadorCol.classList.add('col-md-3');
        operadorCol.innerHTML = `<span class="text-uppercase font-weight-bold">${condicion.operador}</span>`;
        row.appendChild(operadorCol);

        // Columna valor
        const valorCol = document.createElement('div');
        valorCol.classList.add('col-md-6');

        if (condicion.operador === 'Entre') {
            const [start, end] = (condicion.valor || '').split(' - ');
            const startInput = crearInput(`valor_${index}_start`, start, condicion.tipo);
            const endInput = crearInput(`valor_${index}_end`, end, condicion.tipo);
            startInput.classList.add('mb-2');
            valorCol.appendChild(startInput);
            valorCol.appendChild(endInput);
        } else if (condicion.tipo === 'boolean') {
            const switchWrapper = document.createElement('div');
            switchWrapper.classList.add('custom-control', 'custom-switch');
            const switchInput = document.createElement('input');
            switchInput.type = 'checkbox';
            switchInput.classList.add('custom-control-input');
            switchInput.id = `switch_${index}`;
            switchInput.name = `valor_${index}`;
            switchInput.checked = condicion.valor === 'true' || condicion.valor === true;
            const switchLabel = document.createElement('label');
            switchLabel.classList.add('custom-control-label');
            switchLabel.setAttribute('for', `switch_${index}`);
            switchLabel.textContent = switchInput.checked ? 'Habilitado' : 'Deshabilitado';
            switchInput.addEventListener('change', () => {
                switchLabel.textContent = switchInput.checked ? 'Habilitado' : 'Deshabilitado';
            });
            switchWrapper.appendChild(switchInput);
            switchWrapper.appendChild(switchLabel);
            valorCol.appendChild(switchWrapper);
        } else {
            const input = crearInput(`valor_${index}`, condicion.valor, condicion.tipo);
            valorCol.appendChild(input);
        }

        row.appendChild(valorCol);
        scrollContainer.appendChild(row);

        // Insertar select de operador lógico ENTRE condiciones (no después de la última)
        if (index < filter.payload.length - 1) {
            const logicoRow = document.createElement('div');
            logicoRow.classList.add('form-row', 'justify-content-center', 'mb-4');
            const logicoCol = document.createElement('div');
            logicoCol.classList.add('col-md-6', 'text-center');
            const logicoSelect = document.createElement('select');
            logicoSelect.name = `logico_${index + 1}`; // El logico pertenece a la siguiente condición
            logicoSelect.classList.add('form-control', 'custom-select', 'w-50', 'mx-auto');
            ['AND', 'OR'].forEach(op => {
                const option = document.createElement('option');
                option.value = op;
                option.textContent = op;
                // Selecciona el valor si está en la siguiente condición
                if (filter.payload[index + 1]?.logico === op) option.selected = true;
                logicoSelect.appendChild(option);
            });
            logicoCol.appendChild(logicoSelect);
            logicoRow.appendChild(logicoCol);
            scrollContainer.appendChild(logicoRow);
            logicoSelects.push({ index: index + 1, select: logicoSelect });
        }
    });

    nuevoBtnUpdate.addEventListener('click', () => {
        const nuevoNombre = nombreInput.value.trim();
        const errores = [];

        if (!nuevoNombre) {
            errores.push('El nombre del filtro no puede estar vacío.');
        }

        // Construir el nuevo payload
        const nuevoPayload = filter.payload.map((cond, index) => {
            let valor = '';
            if (cond.operador === 'Entre') {
                const start = form.querySelector(`[name="valor_${index}_start"]`)?.value.trim() || '';
                const end = form.querySelector(`[name="valor_${index}_end"]`)?.value.trim() || '';
                if (!start || !end) {
                    errores.push(`La condición "${prettify(cond.campo)}" debe tener ambos valores (inicio y fin).`);
                }
                valor = `${start} - ${end}`;
            } else if (cond.tipo === 'boolean') {
                const input = form.querySelector(`[name="valor_${index}"]`);
                valor = input?.checked ? 'true' : 'false';
            } else {
                valor = form.querySelector(`[name="valor_${index}"]`)?.value.trim() || '';
                if (!valor) {
                    errores.push(`El valor de la condición "${prettify(cond.campo)}" no puede estar vacío.`);
                }
            }

            let logico = null;
            if (index > 0) {
                const select = form.querySelector(`[name="logico_${index}"]`);
                logico = select ? select.value : null;
            }

            return {
                ...cond,
                valor,
                logico
            };
        });

        const erroresCondiciones = validateConditions(scrollContainer);
        if (erroresCondiciones.length) errores.push(...erroresCondiciones);

        let errorCard = document.getElementById('validationErrorCard');
        if (!errorCard) {
            errorCard = document.createElement('div');
            errorCard.id = 'validationErrorCard';
            errorCard.className = 'alert alert-danger alert-dismissible fade show mt-3';
            errorCard.role = 'alert';
        }

        errorCard.innerHTML = `
            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
            <strong>Errores detectados: </strong>
            <ul>${errores.map(e => `<li>${prettify(e.split('.')[0])}" no puede estar vacio</li>`).join('')}</ul>
        `;

        // Mostrar errores si los hay
        if (errores.length > 0) {
            if (!document.getElementById('validationErrorCard')) {
                form.insertBefore(errorCard, form.firstChild);
            }
            return;
        } else {
            errorCard.remove();
        }

        // Enviar datos actualizados
        editarFiltro({
            ...filter,
            name: nuevoNombre,
            payload: nuevoPayload
        });

        $('#updateFilterModal').modal('hide');
    });

    nuevoBtnCancel?.addEventListener('click', () => $('#updateFilterModal').modal('hide'));
    modalUpdate.querySelector('.close-btn')?.addEventListener('click', () => $('#updateFilterModal').modal('hide'));
}