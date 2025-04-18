// main.js

import { inicializarEventosFiltrosPanel } from './events/filtrospanelevents.js';
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
