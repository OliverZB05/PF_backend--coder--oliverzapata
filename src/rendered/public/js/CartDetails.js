// Función para calcular el precio total del carrito
const calculateTotalCartPrice = () => {
    const totalPriceElements = document.querySelectorAll('.total-price');
    let totalCartPrice = 0;
    totalPriceElements.forEach(element => {
    totalCartPrice += Number(element.textContent);
    });
    return totalCartPrice;
};

// Función para mostrar el precio total del carrito
const displayTotalCartPrice = () => {
    const totalCartPriceElement = document.getElementById('total-cart-price');
    totalCartPriceElement.textContent = calculateTotalCartPrice();
};

    const incrementButtons = document.querySelectorAll('.increment');
    const decrementButtons = document.querySelectorAll('.decrement');

    // Muestra el precio total del carrito al cargar la página
    displayTotalCartPrice();

    incrementButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            const cartId = document.querySelector('.styled-table').dataset.cartId;
            const productId = button.dataset.productId;
            const stockElement = document.querySelector(`.stock[data-product-id="${productId}"]`);
            const stock = Number(stockElement.textContent);
            const quantityElement = document.querySelector(`.quantity[data-product-id="${productId}"]`);
            const quantity = Number(quantityElement.textContent);
            if (quantity >= stock) {
                Swal.fire({
                    title: 'Advertencia',
                    text: 'La cantidad no puede exceder el stock del producto',
                    icon: 'warning',
                    timer: 2000,
                    showConfirmButton: false
                });
                return;
            }
            fetch(`/api/carts/${cartId}/product/${productId}/increment`, { method: 'POST' })
                .then(response => response.json())
                .then(data => {
                    quantityElement.textContent = data.newQuantity;
                    const unitPriceElement = document.querySelector(`.unit-price[data-product-id="${productId}"]`);
                    const unitPrice = Number(unitPriceElement.dataset.unitPrice);
                    const totalPriceElement = document.querySelector(`.total-price[data-product-id="${productId}"]`);
                    if (totalPriceElement) {
                        totalPriceElement.textContent = unitPrice * data.newQuantity;

                        // Actualiza el precio total del carrito
                        displayTotalCartPrice();
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
        });
    });
    








    decrementButtons.forEach(button => {
        button.addEventListener('click', function(event) {
        const cartId = document.querySelector('.styled-table').dataset.cartId;    
        const productId = button.dataset.productId;
        fetch(`/api/carts/${cartId}/product/${productId}/decrement`, { method: 'POST' })
            .then(response => response.json())
            .then(data => {
            const quantityElement = document.querySelector(`.quantity[data-product-id="${productId}"]`);
            quantityElement.textContent = data.newQuantity;
            console.log(data.newQuantity);

            if (data.newQuantity === 0) {
                // Encuentra la fila del producto y la elimina
                const productRow = document.getElementById(`product-row-${productId}`);
                console.log('1.-Entró a remove!!!');
                productRow.remove();
                console.log('2.-Ejecutó remove!!!');
                displayTotalCartPrice();
            } else {
                console.log('3.-Entró al else!!!');

                const unitPriceElement = document.querySelector(`.unit-price[data-product-id="${productId}"]`);
                const unitPrice = Number(unitPriceElement.dataset.unitPrice);
                const totalPriceElement = document.querySelector(`.total-price[data-product-id="${productId}"]`);
                if (totalPriceElement) {
                totalPriceElement.textContent = unitPrice * data.newQuantity;

                // Actualiza el precio total del carrito
                displayTotalCartPrice();
                } else {
                console.log('No se encontró el elemento de precio total');
                }
            }
            displayTotalCartPrice();
            })
            .catch(error => {
            console.log('Error al hacer la solicitud:', error);
            });
        });
    });