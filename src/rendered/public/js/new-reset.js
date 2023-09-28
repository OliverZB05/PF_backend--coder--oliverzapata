// En new-reset.js
document.getElementById('resetPassword').addEventListener('submit', event => {
    event.preventDefault();
    
    // Obtener los valores del formulario
    let email = document.getElementById('email').value;

    // Eliminar los espacios en blanco al principio y al final del correo electrónico
    email = email.trim();

    // Verificar si el campo de correo electrónico está vacío
    if (!email) {
        Swal.fire({
            icon: 'error',
            title: 'Campo vacío',
            text: 'Por favor, ingresa tu correo electrónico',
            showConfirmButton: false,
            timer: 1500
        });
        return;
    }

    fetch('/send-email', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            email: email
        })
    });
    
});