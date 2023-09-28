// En newPassword.js
document.querySelector('form[action="/reset-password"]').addEventListener('submit', event => {
    event.preventDefault();
    
    // Obtener los valores del formulario
    let password = document.getElementById('password').value;
    
    // Eliminar los espacios en blanco al principio y al final de la contraseña
    password = password.trim();
    
    // Verificar si el campo de contraseña está vacío
    if (!password) {
        Swal.fire({
            icon: 'error',
            title: 'Campo vacío',
            text: 'Por favor, ingresa tu nueva contraseña',
            showConfirmButton: false,
            timer: 1500
        });
        return;
    }
    
    // Enviar el formulario
    event.target.submit();
});