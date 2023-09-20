const CreateCart = async () => {
    try {
        const response = await fetch(`/api/carts`, { method: 'POST' });
        const responseData = await response.json();
        location.reload();
    } catch (error) {
        console.error('Error al hacer la solicitud:', error); // Imprimir el error
    } 
};

const DeleteCart = async () => {
    const { value: cartId } = await Swal.fire({
        title: 'Ingresa el ID del carrito que deseas eliminar',
        input: 'text',
        inputPlaceholder: 'ID del carrito',
        showCancelButton: true,
        inputValidator: (value) => {
            if (!value) {
                return 'Necesitas escribir algo!'
            }
        }
    })

    if (cartId) {
        try {
            const response = await fetch(`/api/carts/deleteCart/${cartId}`, { method: 'DELETE' });
            if (!response.ok) {
                throw new Error('Error al eliminar el carrito');
            }
            const responseData = await response.json();
            Swal.fire('Eliminado!', 'El carrito ha sido eliminado.', 'success');
            setTimeout(function(){ location.reload(); }, 2000);
        } catch (error) {
            Swal.fire({
                title: 'Error!',
                text: 'No se pudo eliminar el carrito. Por favor, verifica el ID e intenta nuevamente.',
                icon: 'error',
                timer: 3000,
                showConfirmButton: false
            });
        }
    }
};


const changeToPremium = async (userId) => {
    try {
        const response = await fetch(`/api/users/premium/${userId}`, { method: 'POST' });
        const responseData = await response.json();
        location.reload();
    } catch (error) {
        console.error('Error al hacer la solicitud:', error); // Imprimir el error
    } 
};


const purchaseCart = async (cartId) => {
    const confirmed = await Swal.fire({
        title: '¿Estás seguro?',
        text: "¿Quieres enviar la orden de compra?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, enviar!'
    });

    if (confirmed.isConfirmed) {
        try {
            const response = await fetch(`/api/carts/${cartId}/purchase`, { method: 'POST' });
            if (!response.ok) {
                throw new Error('Error al enviar la orden de compra');
            }
            const responseData = await response.json();
            totalAmount = responseData.payload.ticket.amount;  // Guardar el monto total
            Swal.fire('Orden enviada!', 'La orden de compra ha sido enviada.', 'success');
            Swal.fire({
                title: 'Detalles de la orden',
                html: `
                    Fecha y hora de compra: ${responseData.payload.ticket.purchase_datetime}<br>
                    Monto total: ${responseData.payload.ticket.amount}<br>
                    Comprador: ${responseData.payload.ticket.purchaser}<br>
                    ID del ticket: ${responseData.payload.ticket._id}<br>
                    Código del ticket: ${responseData.payload.ticket.code}
                `,
                confirmButtonText: 'OK',
                preConfirm: async () => {
                    try {
                        const deleteResponse = await fetch(`/api/carts/deleteCart/${cartId}`, { method: 'DELETE' });
                        if (!deleteResponse.ok) {
                            throw new Error('Error al eliminar el carrito');
                        }
                        await deleteResponse.json();
                        location.reload();  // Mover la recarga de la página aquí
                    } catch (error) {
                        Swal.fire({
                            title: 'Error!',
                            text: 'No se pudo eliminar el carrito. Por favor, intenta nuevamente.',
                            icon: 'error',
                            timer: 3000,
                            showConfirmButton: false
                        });
                    }
                }
            });
            
            
            // Aquí puedes agregar el código para eliminar el carrito después de enviar la orden de compra
        } catch (error) {
            Swal.fire({
                title: 'Error!',
                text: 'No se pudo enviar la orden de compra. Por favor, intenta nuevamente.',
                icon: 'error',
                timer: 3000,
                showConfirmButton: false
            });
        }
    }
};
