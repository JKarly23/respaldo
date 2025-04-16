// main.js

import { inicializarEventosFiltrosPanel } from './events/filtrosPanelEvents.js';
import { inicializarEventosAside } from './events/asideEvents.js';
import { inicializarFiltroActivoManager } from './events/inicializarFiltroActivoManager.js';
import { inicializarEventosFiltrosBasicos } from './events/filtrosBasicosEvents.js';
import { inicializarEventosFiltrosGuardados } from './events/filtrosGuardadosEvents.js';

document.addEventListener('DOMContentLoaded', () => {
    inicializarEventosFiltrosPanel();
    inicializarEventosAside();
    inicializarFiltroActivoManager();
    inicializarEventosFiltrosBasicos();
    inicializarEventosFiltrosGuardados();
});

window.addEventListener('DOMContentLoaded', () => {
    const url = new URL(window.location.href);
    
    // Solo si hay parámetros de filtros, los removemos
    if (url.searchParams.has('filtros_activos')) {
        url.searchParams.delete('filtros_activos');
        window.history.replaceState({}, '', url.pathname + url.search);
    }
});