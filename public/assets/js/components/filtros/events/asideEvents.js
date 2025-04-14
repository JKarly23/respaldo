// events/asideEvents.js

import { reemplazarFiltrosActivos } from '../utils/filtrosActivos.js';

export function inicializarEventosAside() {
    // Referencias a elementos
    const crearFiltroBtn = document.getElementById('crearFiltroPersonalizado');
    const aside = document.getElementById('filtroPersonalizadoAside');
    const cerrarAsideBtn = document.getElementById('cerrarAside');
    const cancelarFiltroBtn = document.getElementById('cancelarFiltro');
    const agregarCondicionBtn = document.getElementById('agregarCondicion');
    const condicionesContainer = document.getElementById('condicionesContainer');
    const guardarFiltroBtn = document.getElementById('guardarFiltro');
    const confirmarGuardarFiltroBtn = document.getElementById('confirmarGuardarFiltro');
    const aplicarFiltroBtn = document.getElementById('aplicarFiltro');
    
    // Verificar que los elementos existan
    if (!crearFiltroBtn || !aside) return;
    
    // Abrir el aside
    crearFiltroBtn.addEventListener('click', function(e) {
        e.preventDefault();
        aside.style.right = '0';
        document.body.style.overflow = 'hidden'; // Evitar scroll en el body
    });
    
    // Cerrar el aside
    function cerrarAside() {
        aside.style.right = '-400px';
        document.body.style.overflow = ''; // Restaurar scroll
    }
    
    if (cerrarAsideBtn) cerrarAsideBtn.addEventListener('click', cerrarAside);
    if (cancelarFiltroBtn) cancelarFiltroBtn.addEventListener('click', cerrarAside);
    
    // Agregar nueva condición
    if (agregarCondicionBtn && condicionesContainer) {
        agregarCondicionBtn.addEventListener('click', function() {
            const condicionOriginal = document.querySelector('.condicion');
            if (!condicionOriginal) return;
            
            const nuevaCondicion = condicionOriginal.cloneNode(true);
            // Limpiar valores
            nuevaCondicion.querySelectorAll('select, input').forEach(el => {
                if (el.tagName === 'SELECT') {
                    el.selectedIndex = 0;
                } else if (el.type === 'text') {
                    el.value = '';
                }
            });
            
            // Agregar evento para eliminar esta condición
            nuevaCondicion.querySelector('.eliminar-condicion').addEventListener('click', function() {
                nuevaCondicion.remove();
            });
            
            condicionesContainer.appendChild(nuevaCondicion);
        });
    }
    
    // Eliminar condición (para la primera condición)
    const eliminarCondicionBtn = document.querySelector('.eliminar-condicion');
    if (eliminarCondicionBtn) {
        eliminarCondicionBtn.addEventListener('click', function() {
            if (document.querySelectorAll('.condicion').length > 1) {
                this.closest('.condicion').remove();
            } else {
                alert('Debe haber al menos una condición');
            }
        });
    }
    
    // Abrir modal para guardar filtro
    if (guardarFiltroBtn) {
        guardarFiltroBtn.addEventListener('click', function() {
            // Usar Bootstrap 4 modal
            $('#guardarFiltroModal').modal('show');
        });
    }
    
    // Guardar filtro
    if (confirmarGuardarFiltroBtn) {
        confirmarGuardarFiltroBtn.addEventListener('click', function() {
            const nombreFiltro = document.getElementById('nombreFiltro').value.trim();
            
            if (!nombreFiltro) {
                alert('Por favor, ingrese un nombre para el filtro');
                return;
            }
            
            // Aquí iría la lógica para guardar el filtro
            console.log('Filtro guardado:', nombreFiltro);
            
            // Cerrar modal y aside
            $('#guardarFiltroModal').modal('hide');
            cerrarAside();
            
            // Opcional: Actualizar la lista de filtros guardados
            // actualizarListaFiltros(nombreFiltro);
        });
    }
    
    // Aplicar filtro sin guardar
    if (aplicarFiltroBtn) {
        aplicarFiltroBtn.addEventListener('click', function() {
            // Recopilar todas las condiciones
            const condiciones = [];
            document.querySelectorAll('.condicion').forEach(condicion => {
                const campoSelect = condicion.querySelector('.campo-select');
                const operadorSelect = condicion.querySelector('.operador-select');
                const valorInput = condicion.querySelector('.valor-input');
                
                if (!campoSelect || !operadorSelect || !valorInput) return;
                
                const campo = campoSelect.options[campoSelect.selectedIndex].text;
                const operador = operadorSelect.options[operadorSelect.selectedIndex].text;
                const valor = valorInput.value;
                
                if (campo && operador && valor) {
                    condiciones.push({
                        campo: campo,
                        operador: operador,
                        valor: valor
                    });
                }
            });
            
            // Aplicar los filtros
            if (condiciones.length > 0) {
                if (window.filtrosManager) {
                    window.filtrosManager.reemplazarFiltrosActivos(condiciones);
                }
                
                // Opcional: Mostrar alguna indicación de que el filtro se aplicó
                alert('Filtro aplicado correctamente');
                cerrarAside();
            } else {
                alert('Debe agregar al menos una condición válida');
            }
        });
    }
}
