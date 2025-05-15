import { deleteFilter } from "../api/filtroRequest.js";

export function inicializarModalDelete(filterId) {
    const modalDelete = document.getElementById('deleteFilterModal');
    const btnDelete = document.getElementById('btnDelete');
    const btnCancel = document.getElementById('btnCancel');

    if (!modalDelete || !btnDelete || !btnCancel) return;

    // Mostrar el modal
    $('#deleteFilterModal').modal('show');

    // Limpiar event listeners anteriores
    const nuevoBtnDelete = btnDelete.cloneNode(true);
    btnDelete.parentNode.replaceChild(nuevoBtnDelete, btnDelete);

    const nuevoBtnCancel = btnCancel.cloneNode(true);
    btnCancel.parentNode.replaceChild(nuevoBtnCancel, btnCancel);

    // Establecer el nuevo botón como el de referencia
    nuevoBtnDelete.setAttribute('data-id', filterId);

    // Agregar eventos
    nuevoBtnDelete.addEventListener('click', () => {
        console.log("Click ", filterId)
        const id = nuevoBtnDelete.getAttribute('data-id');
        deleteFilter(filterId); // Elimina el filtro
        $('#deleteFilterModal').modal('hide');
    });

    nuevoBtnCancel.addEventListener('click', () => {
        $('#deleteFilterModal').modal('hide');
    });
}
