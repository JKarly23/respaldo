// Import the necessary functions
import { actualizarOperadoresYValorInput } from '../transforms/asideDynamicInputs.js';
import { mostrarMensajeError } from '../utils/mostrarMensajeError.js';

export function restaurarEstadoAside() {
    document.addEventListener('DOMContentLoaded', () => {
        const aside = document.getElementById('filtroPersonalizadoAside');
        const condicionesContainer = document.getElementById('condicionesContainer');
        const aplicarFiltroBtn = document.getElementById('aplicarFiltro');
        const btnGuardar = document.getElementById('btnGuardarFiltro')
        const guardarFiltroBtn = document.getElementById('guardarFiltro');

        // Mostrar el botón de guardar filtro si hay filtros activos en localStorage
        if (localStorage.getItem('filtros_activos')) {
            guardarFiltroBtn.style.display = 'block';
        }

        const asideAbierto = localStorage.getItem('aside_abierto');
        const condicionesGuardadas = localStorage.getItem('condiciones_guardadas');

        if (asideAbierto === '1' && condicionesGuardadas && aside && condicionesContainer) {
            aside.style.right = '0';
            document.body.style.overflow = 'hidden';
             // Ocultar el botón de guardar filtro
            if (aplicarFiltroBtn) {
                aplicarFiltroBtn.remove();
            }


            try {
                const condiciones = JSON.parse(condicionesGuardadas);
                console.log('Condiciones cargadas:', condiciones);

                if (condiciones && condiciones.conditions && Array.isArray(condiciones.conditions)) {
                    setTimeout(() => {
                        const condicionBase = document.querySelector('.condicion');
                        if (!condicionBase) return console.error('No se encontró el elemento base de condición');

                        const campoOptions = condicionBase.querySelector('.campo-select').innerHTML;
                        const operadorOptions = condicionBase.querySelector('.operador-select').innerHTML;

                        condicionesContainer.innerHTML = '';

                        const procesarCondiciones = async () => {
                            for (let i = 0; i < condiciones.conditions.length; i++) {
                                const condicion = condiciones.conditions[i];
                                const esUltima = i === condiciones.conditions.length - 1;

                                const operadorLogicoHTML = !esUltima && condicion.logico
                                    ? `<span class="badge badge-secondary px-2 py-1 ml-2 mb-2">${condicion.logico}</span>`
                                    : '';

                                const nuevaCondicion = document.createElement('div');
                                nuevaCondicion.classList.add('condicion', 'mb-3');

                                nuevaCondicion.innerHTML = `
                                    <div class="form-row">
                                        <div class="col-md-4">
                                            <label>Campo</label>
                                            <select class="form-control campo-select" disabled>${campoOptions}</select>
                                        </div>
                                        <div class="col-md-3">
                                            <label>Operador</label>
                                            <select class="form-control operador-select" disabled>${operadorOptions}</select>
                                        </div>
                                        <div class="col-md-3">
                                            <label>Valor</label>
                                            <input type="text" class="form-control valor-input" value="${condicion.valor || ''}" readonly tabindex="-1" style="pointer-events: none;">
                                        </div>
                                        <div class="col-md-2 d-flex align-items-end justify-content-start">
                                            <div class='operatorContainer'>${operadorLogicoHTML}</div>
                                        </div>
                                    </div>
                                    <div class="operador-logico"></div>
                                `;

                                condicionesContainer.appendChild(nuevaCondicion);

                                const campoSelect = nuevaCondicion.querySelector('.campo-select');
                                if (campoSelect) {
                                    campoSelect.value = condicion.campo || '';
                                    await new Promise(resolve => setTimeout(resolve, 50));
                                    actualizarOperadoresYValorInput(campoSelect, condicionesContainer);
                                }

                                await new Promise(resolve => setTimeout(resolve, 100));

                                const operadorSelect = nuevaCondicion.querySelector('.operador-select');
                                if (operadorSelect) {
                                    const opcionExiste = Array.from(operadorSelect.options).some(
                                        option => option.value === condicion.operador
                                    );

                                    if (opcionExiste) {
                                        operadorSelect.value = condicion.operador || '';
                                    } else {
                                        const nuevaOpcion = document.createElement('option');
                                        nuevaOpcion.value = condicion.operador || '';
                                        nuevaOpcion.textContent = condicion.operador || '';
                                        operadorSelect.appendChild(nuevaOpcion);
                                        operadorSelect.value = condicion.operador || '';
                                    }
                                }

                                const valorInput = nuevaCondicion.querySelector('.valor-input');
                                if (valorInput) {
                                    valorInput.value = condicion.valor || '';
                                    valorInput.setAttribute('readonly', true);
                                    valorInput.setAttribute('tabindex', '-1');
                                    valorInput.style.pointerEvents = 'none';
                                }
                            }

                            if (condiciones.conditions.length > 1) {
                                const operadorLogico = condiciones.conditions[1].logico || 'AND';
                                const radioBtn = document.querySelector(`input[name="operadorLogico"][value="${operadorLogico}"]`);
                                if (radioBtn) {
                                    radioBtn.checked = true;
                                    document.querySelectorAll('input[name="operadorLogico"]').forEach(r =>
                                        r.parentElement.classList.remove('active'));
                                    radioBtn.parentElement.classList.add('active');
                                }
                            }

                            console.log('✅ Condiciones restauradas correctamente');
                        };

                        procesarCondiciones();
                    }, 300);
                }
            } catch (error) {
                console.error('❌ Error al restaurar condiciones:', error);
                localStorage.removeItem('condiciones_guardadas');
                localStorage.setItem('aside_abierto', '0');
            }
        }

        // Al hacer click en "Guardar", cerrar el aside
        if (btnGuardar) {
            btnGuardar.addEventListener('click', () => {
                aside.style.right = '-400px'; // Ajusta el valor si tu aside tiene otro ancho
                document.body.style.overflow = '';
                localStorage.setItem('aside_abierto', '0');
            });
        }
    });
}
