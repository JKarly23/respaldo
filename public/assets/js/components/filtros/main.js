import { inicializarEventosFiltrosPanel } from './events/filtrosPanelEvents.js';
import { inicializarEventosAside } from './events/asideEvents.js';
import { inicializarEventosFiltrosBasicos } from './events/filtrosBasicosEvents.js';
import { inicializarEventosFiltrosGuardados } from './events/filtrosGuardadosEvents.js';
import { agregarFiltroActivo, reemplazarFiltrosActivos, obtenerFiltrosActivos } from './utils/filtrosActivos.js';

// Inicializar inmediatamente para asegurar que los eventos se registren
inicializarEventosFiltrosPanel();

// También inicializar cuando el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function () {
    inicializarEventosFiltrosPanel();
    inicializarEventosAside();
    inicializarEventosFiltrosBasicos();
    inicializarEventosFiltrosGuardados();
});

// Exponer funciones para uso global
export { agregarFiltroActivo, reemplazarFiltrosActivos, obtenerFiltrosActivos };
