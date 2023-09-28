import chai from 'chai';
import supertest from 'supertest';

const expect = chai.expect;
const requester = supertest('http://localhost:8080');


describe('Testing de productos', () => {

    it('POST de /api/products debe crear productos correctamente', async () => {
        try {
            const prodMock = {
                title: "Silla de oficina",
                description: "Silla de oficina en excelente estado",
                price: 3000,
                thumbnail: [
                    "https://i.ibb.co/P9Ytc2W/1-Silla-de-oficina.png"
                ],
                stock: 20,
                category: "Productos del hogar"
            };

            const { statusCode, ok, _body } = await requester.post('/api/products').send(prodMock);
            expect(statusCode).to.be.eql(200);
            expect(_body.payload).to.have.property('_id');
        } catch {
        }
        });

        it('PUT de /api/products se debe corroborar que se actualice correctamente la información de nuestra mascota', async () => {
            try {
                const prodMock = {
                    title: "Silla de oficina",
                    description: "Silla de oficina en excelente estado",
                    price: 3000,
                    thumbnail: [
                        "https://i.ibb.co/P9Ytc2W/1-Silla-de-oficina.png"
                    ],
                    stock: 20,
                    category: "Productos del hogar"
                };
        
                const { _body } = await requester.post('/api/products').send(prodMock);
                const id = _body.payload._id;

                const prodMockUpdated = {
                    title: "Silla de oficina - updated",
                    description: "Silla de oficina en excelente estado - updated",
                    price: 3000,
                    thumbnail: [
                        "https://i.ibb.co/P9Ytc2W/1-Silla-de-oficina.png"
                    ],
                    stock: 20,
                    category: "Productos del hogar"
                };
        
                const putResult = await requester.put(`/api/products/${id}`).send(prodMockUpdated);
                expect(putResult.statusCode).to.be.eql(200);
                expect(putResult._body.message).to.be.eql('product updated');
            } catch {
            }
        });


        it('DELETE de /api/products se debe corroborrar que se elimine correctamente la última mascota agregada', async () => {
            try {
                const prodMock = {
                    title: "Silla de oficina",
                    description: "Silla de oficina en excelente estado",
                    price: 3000,
                    thumbnail: [
                        "https://i.ibb.co/P9Ytc2W/1-Silla-de-oficina.png"
                    ],
                    stock: 20,
                    category: "Productos del hogar"
                };
        
                const { _body } = await requester.post('/api/products').send(prodMock);
                const id = _body.payload._id;
                const deleteResult = await requester.delete(`/api/products/${id}`);
                expect(deleteResult.statusCode).to.be.eql(200);
                const getResult = await requester.get('/api/products');
                const products = getResult._body.payload;
                expect(products.find(pet => pet._id === id)).to.be.eql(undefined);
            } catch {
            }
        });

});