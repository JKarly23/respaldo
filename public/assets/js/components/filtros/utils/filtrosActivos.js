// utils/filtrosActivos.js


// Obtener el elemento contenedor de filtros
const filtrosActivos = document.getElementById('filtrosActivos');
const contenedorFiltrosActivos = filtrosActivos ? filtrosActivos.closest('.position-relative') : null;
const toggleFiltrosActivos = document.getElementById('toggleFiltrosActivos');

/**
 * Crea un elemento visual para un filtro activo
 * @param {Object} filtro - Objeto filtro con propiedades campo, operador y valor
 * @returns {HTMLElement} El elemento de filtro creado
 */
export function crearFiltroActivo(filtro) {
    const elemento = document.createElement('div');
    elemento.className = 'filtro-activo';
    elemento.innerHTML = `
        <span>${filtro.campo} ${filtro.operador} ${filtro.valor}</span>
        <button type="button" class="btn-eliminar" title="Eliminar filtro">×</button>
    `;

    elemento.querySelector('.btn-eliminar').addEventListener('click', function () {
        elemento.remove();
        if (filtrosActivos && filtrosActivos.children.length === 0) {
            if (contenedorFiltrosActivos) {
                contenedorFiltrosActivos.classList.add('d-none');
            } else {
                filtrosActivos.classList.add('d-none');
            }
        }
    });

    return elemento;
}

/**
 * Agrega un nuevo filtro al contenedor de filtros activos
 * @param {Object} filtro - Objeto filtro a agregar
 */
export function agregarFiltroActivo(filtro) {
    if (!filtrosActivos) return;
    
    // Mostrar el contenedor
    filtrosActivos.classList.remove('d-none');
    if (contenedorFiltrosActivos) {
        contenedorFiltrosActivos.classList.remove('d-none');
    }
    
    // Agregar el filtro
    filtrosActivos.appendChild(crearFiltroActivo(filtro));
    
    // Actualizar botón de alternar si existe
    if (toggleFiltrosActivos) {
        toggleFiltrosActivos.classList.remove('collapsed');
    }
}

/**
 * Reemplaza todos los filtros activos con un nuevo conjunto
 * @param {Array} filtros - Array de objetos filtro
 */
export function reemplazarFiltrosActivos(filtros) {
    if (!filtrosActivos) return;

    filtrosActivos.innerHTML = '';

    if (filtros.length > 0) {
        // Mostrar el contenedor y agregar filtros
        filtrosActivos.classList.remove('d-none');
        if (contenedorFiltrosActivos) {
            contenedorFiltrosActivos.classList.remove('d-none');
        }
        
        filtros.forEach(filtro => {
            filtrosActivos.appendChild(crearFiltroActivo(filtro));
        });
        
        // Actualizar botón de alternar si existe
        if (toggleFiltrosActivos) {
            toggleFiltrosActivos.classList.remove('collapsed');
        }
    } else {
        // Ocultar el contenedor si no hay filtros
        if (contenedorFiltrosActivos) {
            contenedorFiltrosActivos.classList.add('d-none');
        } else {
            filtrosActivos.classList.add('d-none');
        }
    }
}

/**
 * Obtiene todos los filtros activos como un array de objetos
 * @returns {Array} Array de objetos filtro
 */
export function obtenerFiltrosActivos() {
    if (!filtrosActivos) return [];
    
    const filtros = [];
    filtrosActivos.querySelectorAll('.filtro-activo').forEach(elemento => {
        const texto = elemento.querySelector('span').textContent;
        const partes = texto.split(' ');
        
        if (partes.length >= 3) {
            filtros.push({
                campo: partes[0],
                operador: partes[1],
                valor: partes.slice(2).join(' ')
            });
        }
    });
    
    return filtros;
}

// Exponer funciones en window para uso en HTML inline
window.filtrosManager = {
    agregarFiltroActivo,
    reemplazarFiltrosActivos,
    obtenerFiltrosActivos
};
