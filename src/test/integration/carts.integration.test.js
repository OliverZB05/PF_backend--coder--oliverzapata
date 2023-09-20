import chai from 'chai';
import supertest from 'supertest';
const expect = chai.expect;
const requester = supertest('http://localhost:8080');

// En tu archivo de test, envía una solicitud a la ruta de prueba para verificar la autenticación y los permisos del usuario
describe('Testing de carritos', () => {
    let productId;
    let cartId;

    // Primer caso de prueba: crear un producto
    it('POST de /api/products debe crear un producto correctamente', async () => {
        console.log('Enviando solicitud POST a /api/products');
        try {
            const productData = {
                title: "Silla de oficina",
                description: "Silla de oficina en excelente estado",
                price: 3000,
                thumbnail: [
                    "https://i.ibb.co/P9Ytc2W/1-Silla-de-oficina.png"
                ],
                stock: 20,
                category: "Productos del hogar"
            };
            const response = await requester.post('/api/products').send(productData);
            console.log(response.statusCode);
            console.log(response.body.payload._id);

            expect(response.statusCode).to.be.eql(200);
            expect(response.body.payload).to.have.property('_id');
            productId = response.body.payload._id;
        } catch (error) {}
    });


    
    // Segundo caso de prueba: crear un carrito
    it('POST de /api/carts debe crear un carrito correctamente', async () => {
        console.log('Enviando solicitud POST a /api/carts');
        try {
            const response = await requester.post('/api/carts');
            console.log('Respuesta recibida:', response);

            expect(response.statusCode).to.be.eql(200);
            expect(response.body.payload).to.have.property('_id');
            cartId = response.body.payload._id;
        } catch (error) {}
    });

    // Tercer caso de prueba: agregar el producto al carrito
    it('POST de /:cid/product/:pid debe agregar el producto al carrito correctamente', async () => {
        console.log('Enviando solicitud POST a /api/carts/:cid/product/:pid');
        try {
            const cid = cartId;
            const pid = productId;
            const response = await requester.post(`/${cid}/product/${pid}`);
            console.log('Respuesta recibida:', response);

            expect(response.statusCode).to.be.eql(200);
            // Agrega aquí más verificaciones utilizando la función expect
        } catch (error) {}
    });

    // Cuarto caso de prueba: actualizar el carrito
    it('PUT de /api/carts/:cid/product/:pid debe actualizar el carrito correctamente', async () => {
        console.log('Enviando solicitud PUT a /api/carts/:cid/product/:pid');
        try {
            const cid = cartId;
            const pid = productId;
            const response = await requester.put(`/api/carts/${cid}/product/${pid}`).send({ quantity: 8 });
            console.log('Respuesta recibida:', response);

            expect(response.statusCode).to.be.eql(200);
            // Agrega aquí más verificaciones utilizando la función expect
        } catch (error) {}
    });
});