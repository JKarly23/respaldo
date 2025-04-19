// main.js

import { inicializarFiltroActivoManager } from './events/inicializarFiltroActivoManager.js';
import { inicializarEventosFiltrosBasicos } from './events/filtrosBasicosEvents.js';
import { inicializarEventosFiltrosGuardados } from './events/filtrosGuardadosEvents.js';
import { inicializarEventosAside } from './events/asideevents.js';
import { inicializarEventosFiltrosPanel } from './events/filtrospanelevents.js';

document.addEventListener('DOMContentLoaded', () => {
    inicializarEventosFiltrosPanel();
    inicializarEventosAside();
    inicializarFiltroActivoManager();
    inicializarEventosFiltrosBasicos();
    inicializarEventosFiltrosGuardados();
});
