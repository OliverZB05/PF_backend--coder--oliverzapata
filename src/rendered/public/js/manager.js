let isTableVisible = false;

document.getElementById('view-users-btn').addEventListener('click', function(event) {
    event.preventDefault(); // Evita que la página se recargue

    if (isTableVisible) {
        // Si la tabla está visible, ocúltala y cambia el texto del botón a "Ver usuarios"
        document.getElementById('users-table').innerHTML = '';
        event.target.textContent = 'Ver usuarios';
        isTableVisible = false;
    } else {
        // Si la tabla no está visible, muéstrala y cambia el texto del botón a "Ocultar usuarios"
        fetch('/api/users')
            .then(response => response.json())
            .then(data => {
                // Crea la tabla
                let table = '<table>';
                table += '<tr><th>ID</th><th>Nombre</th><th>Email</th><th>Rol</th><th>Cambiar Rol</th><th>Eliminar Usuario</th></tr>'; // Agrega encabezado para el botón de eliminación
                data.forEach(user => {
                    table += `<tr><td>${user.id}</td><td>${user.name}</td><td>${user.email}</td><td>${user.role}</td>`;
                    if (user.id !== window.currentUserId) { // No permitir cambiar el rol del usuario actual
                        table += `<td>
                            <select id="role-select-${user.id}">
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                                <option value="premium">Premium</option>
                            </select>
                            <button onclick="window.changeRole('${user.id}')">Cambiar Rol</button>
                        </td>`;
                    } else {
                        table += '<td></td>';
                    }
                    table += `<td><button onclick="window.deleteUser('${user.id}')">Eliminar Usuario</button></td></tr>`; // Botón de eliminación
                });
                table += '</table>';

                // Muestra la tabla en el div
                document.getElementById('users-table').innerHTML = table;

                event.target.textContent = 'Ocultar usuarios';
                isTableVisible = true;
            })
            .catch(error => console.error('Error:', error));
    }
});


document.getElementById('delete-inactive-users-btn').addEventListener('click', function(event) {
    event.preventDefault(); // Evita que la página se recargue

    fetch('/api/users', {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
    })
    .then(response => response.json())
    .then(data => {
        // Muestra una alerta de SweetAlert con el mensaje de respuesta
        swal({
            title: "Usuarios inactivos eliminados",
            text: data.message,
            icon: "success",
            timer: 3000,
            buttons: false
        });

        // Actualiza la tabla para reflejar la eliminación de los usuarios inactivos
        document.getElementById('view-users-btn').click();
    })
    .catch(error => console.error('Error:', error));
});

window.changeRole = function(userId) {
    const newRole = document.getElementById(`role-select-${userId}`).value;

    fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
    })
    .then(response => response.json())
    .then(data => {
        // Actualiza la tabla para reflejar el nuevo rol
        document.getElementById('view-users-btn').click();
    })
    .catch(error => console.error('Error:', error));
}

window.deleteUser = function(userId) {
    fetch(`/api/users/${userId}`, {
        method: 'DELETE',
    })
    .then(response => response.json())
    .then(data => {
        // Actualiza la tabla para reflejar la eliminación del usuario
        document.getElementById('view-users-btn').click();
    })
    .catch(error => console.error('Error:', error));
}
