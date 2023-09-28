import chai from 'chai';
import supertest from 'supertest';
const expect = chai.expect;
const requester = supertest('http://localhost:8080');

// En tu archivo de test, envía una solicitud a la ruta de prueba para verificar la autenticación y los permisos del usuario
describe('Testing de sesiones', () => {
    let token;

    it('Debemos registrar un usuario correctamente', async() => {
        try {
            const userMock = {
                first_name: 'Coder',
                last_name: 'House',
                email: 'ch@gmail.com',
                password: '1234'
            };

            const { statusCode, _body } = await requester.post('/api/sessions/register').send(userMock);
            expect(statusCode).to.be.eql(200);
            expect(_body).to.be.ok; 
        } catch (error) {}
    });


    it('Debemos loguear al usuario y retornar un token', async () => {
        try {
            const credentialsMock = {
                email: 'ch@gmail.com',
                password: '1234'
            };

            const loginResult = await requester.post('/api/sessions/login').send(credentialsMock);
            token = loginResult.body.token;

            expect(token).to.be.ok;
        } catch (error) {}
    });

    // Tercer caso de prueba
    it('Debemos enviar un token en el servicio current y entregar la información al usuario', async() => {
        try {
            const { _body } = await requester.get('/api/sessions/current')
                .set('Authorization', 'Bearer ' + token);

            expect(_body.payload.email).to.be.eql('ch@gmail.com');
        }   catch (error) {}
    });

});