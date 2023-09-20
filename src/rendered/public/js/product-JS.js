const socket = io();

socket.on('products', products => {
    // Actualiza la lista de productos en la vista en tiempo real
    const productsList = document.getElementById("products-list");
    productsList.innerHTML = products.map(product => {
        return `
            <li>
            <h2>Nombre: ${product.title}</h2>
            <p>Descripción: ${product.description}</p>
            <p>Precio: ${product.price}</p>
            <p>Stock: ${product.stock}</p>
            <p>Categoría: ${product.category}</p>
            <p>ID: ${product._id}</p>
            <button onclick="addToCart('${product._id}')">Agregar al carrito</button>
            </li>
        `;
    }).join('');
});

document.addEventListener('click', function (event) {
    // Si el elemento clicado no es un botón de "Agregar al carrito", ignora el clic
    if (!event.target.matches('.add-to-cart-button')) return;

    // Obtén el ID del producto del atributo de datos personalizado
    var productId = event.target.getAttribute('data-product-id');
    // Llama a la función addToCart con el ID del producto
    addToCart(productId);
}, false);

const addToCart = async (productId) => {
    const { value: cartId } = await Swal.fire({
    title: 'Ingrese el ID del carrito',
    input: 'text',
    inputLabel: 'ID del carrito',
    inputPlaceholder: 'Ingrese el ID del carrito aquí'
    });

    if (!cartId) return;
    
    fetch(`/api/carts/${cartId}/product/${productId}`, { method: 'POST' })
    .then(response => {
        console.log('Respuesta recibida:', response);
        if (!response.ok) {
        if (response.status === 409) { // Suponiendo que tu servidor devuelve un código de estado 409 cuando un producto ya está en el carrito
            Swal.fire({
            title: 'Error',
            text: 'Este producto ya está en el carrito',
            icon: 'error',
            timer: 2000,
            showConfirmButton: false
            });
        } else {
            throw new Error('Error en la respuesta: ' + response.statusText);
        }
        } else {
        return response.json();
        }
    })
    .then(responseData => {
        if (responseData) {
        Swal.fire('Producto agregado al carrito');
        }
    })
    .catch(error => {
        console.log('Error al hacer la solicitud:', error);
        Swal.fire({
        title: 'Error',
        text: 'Debes tener el rol user o premium para poder poner productos en el carrito',
        icon: 'error',
        timer: 2000,
        showConfirmButton: false
        });
    });
};

// Función para cambiar al usuario a premium
const changeToPremium = async (userId) => {
    try {
        const response = await fetch(`/api/users/premium/${userId}`, { method: 'POST' });
        const responseData = await response.json();
        location.reload();
    } catch (error) {
        console.error('Error al hacer la solicitud:', error); // Imprimir el error
    }
};