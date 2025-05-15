import { editarFiltro } from "../api/filtroRequest.js";
import { validateConditions } from "../validators/validateConditions.js";
export function inicializarModalUpdate(filter) {
    const modalUpdate = document.getElementById('updateFilterModal');
    const btnUpdate = document.getElementById('btnUpdate');
    const btnCancel = document.getElementById('btnCancel');
    const form = document.getElementById('filterEditForm');
    const container = document.querySelector('.modal-body');

    if (!modalUpdate || !btnUpdate || !btnCancel || !form) return;

    // Mostrar modal (Bootstrap 4)
    $('#updateFilterModal').modal('show');

    // Limpiar event listeners anteriores
    const nuevoBtnUpdate = btnUpdate.cloneNode(true);
    btnUpdate.parentNode.replaceChild(nuevoBtnUpdate, btnUpdate);

    const nuevoBtnCancel = btnCancel.cloneNode(true);
    btnCancel.parentNode.replaceChild(nuevoBtnCancel, btnCancel);

    // Limpiar el formulario
    form.innerHTML = '';

    // Agregar contenedor con scroll
    const scrollContainer = document.createElement('div');
    scrollContainer.style.maxHeight = '400px';
    scrollContainer.style.overflowY = 'auto';
    scrollContainer.style.padding = '10px';
    scrollContainer.style.border = '1px solid #ddd';
    scrollContainer.style.borderRadius = '5px';
    form.appendChild(scrollContainer);

    // Construir formulario dinámico
    filter.payload.forEach((condicion, index) => {
        const row = document.createElement('div');
        row.classList.add('form-row', 'align-items-center', 'mb-4', 'pb-2', 'border-bottom');

        // Campo: campo (mostrar solo la parte antes del punto)
        const campoCol = document.createElement('div');
        campoCol.classList.add('col-md-3', 'pr-3');
        const campoLabel = document.createElement('label');
        campoLabel.classList.add('font-weight-bold', 'mb-1');
        campoLabel.textContent = condicion.campo.split('.')[0]; // Mostrar solo la parte antes del punto
        campoCol.appendChild(campoLabel);
        row.appendChild(campoCol);

        // Campo: operador (sin color de fondo)
        const operadorCol = document.createElement('div');
        operadorCol.classList.add('col-md-3', 'pr-3');
        const operadorLabel = document.createElement('span');
        operadorLabel.classList.add('text-uppercase', 'font-weight-bold');
        operadorLabel.textContent = condicion.operador;
        operadorCol.appendChild(operadorLabel);
        row.appendChild(operadorCol);

        // Campo: valor (editable según tipo)
        const valorCol = document.createElement('div');
        valorCol.classList.add('col-md-6', 'pr-3');

        if (condicion.operador === 'Entre') {
            // Si el operador es "Entre", mostrar dos inputs
            const [startValue, endValue] = (condicion.valor || '').split(' - ');

            const startInput = document.createElement('input');
            startInput.classList.add('form-control', 'mb-2');
            startInput.name = `valor_${index}_start`;
            startInput.value = startValue || '';
            startInput.type = condicion.tipo === 'datetime' ? 'date' : 'text';

            const endInput = document.createElement('input');
            endInput.classList.add('form-control');
            endInput.name = `valor_${index}_end`;
            endInput.value = endValue || '';
            endInput.type = condicion.tipo === 'datetime' ? 'date' : 'text';

            valorCol.appendChild(startInput);
            valorCol.appendChild(endInput);
        } else if (condicion.tipo === 'boolean') {
            // Switch para booleanos
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

            // Cambiar texto dinámicamente al alternar el switch
            switchInput.addEventListener('change', () => {
                switchLabel.textContent = switchInput.checked ? 'Habilitado' : 'Deshabilitado';
            });

            switchWrapper.appendChild(switchInput);
            switchWrapper.appendChild(switchLabel);
            valorCol.appendChild(switchWrapper);
        } else {
            let valorInput = document.createElement('input');
            valorInput.classList.add('form-control');
            valorInput.name = `valor_${index}`;
            valorInput.value = condicion.valor || '';

            switch (condicion.tipo) {
                case 'date':
                case 'datetime':
                    valorInput.type = 'date';
                    break;
                case 'number':
                    valorInput.type = 'number';
                    break;
                default:
                    valorInput.type = 'text';
            }

            valorCol.appendChild(valorInput);
        }

        row.appendChild(valorCol);
        scrollContainer.appendChild(row);

        // Campo: lógico (opcional, entre condiciones)
        if (index < filter.payload.length - 1) {
            const logicoRow = document.createElement('div');
            logicoRow.classList.add('form-row', 'justify-content-center', 'mb-4');

            const logicoCol = document.createElement('div');
            logicoCol.classList.add('col-md-6', 'text-center');

            const logicoSelect = document.createElement('select');
            logicoSelect.name = `logico_${index}`;
            logicoSelect.classList.add('form-control', 'custom-select', 'w-50', 'mx-auto');

            ['AND', 'OR'].forEach(op => {
                const option = document.createElement('option');
                option.value = op;
                option.textContent = op;
                if (condicion.logico === op) option.selected = true;
                logicoSelect.appendChild(option);
            });

            logicoCol.appendChild(logicoSelect);
            logicoRow.appendChild(logicoCol);
            scrollContainer.appendChild(logicoRow);
        }
    });

    // Evento guardar
    nuevoBtnUpdate.addEventListener('click', () => {
        const nuevoPayload = filter.payload.map((cond, index) => {
            let valor = '';

            if (cond.operador === 'Entre') {
                const startValue = form.querySelector(`[name="valor_${index}_start"]`)?.value || '';
                const endValue = form.querySelector(`[name="valor_${index}_end"]`)?.value || '';
                valor = `${startValue} - ${endValue}`;
            } else if (cond.tipo === 'boolean') {
                valor = form.querySelector(`[name="valor_${index}"]`)?.checked ? 'true' : 'false';
            } else {
                valor = form.querySelector(`[name="valor_${index}"]`)?.value || '';
            }

            const logico = form.querySelector(`[name="logico_${index}"]`)?.value || null;

            return {
                ...cond,
                valor,
                logico
            };
        });

        // Validar las condiciones antes de enviar
        const validationErrors = validateConditions(container);
        if (validationErrors.length > 0) {
            // Crear un contenedor para el mensaje de error
            let errorCard = document.getElementById('validationErrorCard');
            if (!errorCard) {
            errorCard = document.createElement('div');
            errorCard.id = 'validationErrorCard';
            errorCard.classList.add('alert', 'alert-danger', 'mt-3');
            form.insertBefore(errorCard, form.firstChild);
            }

            // Mostrar los errores en el card
            errorCard.innerHTML = `
            <strong>Errores de validación:</strong>
            <ul>
                ${validationErrors.map(error => `<li>${error}</li>`).join('')}
            </ul>
            `;
            return;
        } else {
            // Eliminar el mensaje de error si no hay errores
            const existingErrorCard = document.getElementById('validationErrorCard');
            if (existingErrorCard) {
            existingErrorCard.remove();
            }
        }

        const nuevoFiltro = {
            ...filter,
            payload: nuevoPayload
        };

        editarFiltro(nuevoFiltro);
        $('#updateFilterModal').modal('hide');
    });

    // Evento cancelar
    btnCancel?.addEventListener('click', () => $('#updateFilterModal').modal('hide'));
    modalUpdate.querySelector('.btn-close')?.addEventListener('click', () => $('#updateFilterModal').modal('hide'));
}