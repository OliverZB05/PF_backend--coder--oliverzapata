//========={ Dependencias }=========
import express from 'express';
import exphbs from 'express-handlebars';
import Handlebars from 'handlebars';
import { allowInsecurePrototypeAccess } from '@handlebars/allow-prototype-access';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import session from 'express-session';
import initializePassport from './config/passport.config.js';
import passport from 'passport';
import flash from 'connect-flash';
import bodyParser from 'body-parser';
import nodemailer from 'nodemailer';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUiExpress from 'swagger-ui-express';
import fs from 'fs';
//========={ Dependencias }=========

// Importar el archivo config.js
import config from './config/config.js';

// Conectar a la base de datos MongoDB
mongoose.connect(config.mongoUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

//========={ Dirname }=========
import {__dirname} from './utils.js';
//========={ Dirname }=========

//========={ Routers }=========
import productsRouter from './routes/api/products.router.js';
import cartsRouter from './routes/api/carts.router.js';
import viewsProductRouter from './routes/web/views.products.js';
import sessionsRouter from './routes/api/sessions.router.js';
import viewsRouter from './routes/web/views.router.js';
import logsRouter from './routes/api/loggers.router.js';
import usersRouter from './routes/api/users.router.js'
//========={ Routers }=========

import { Server } from "socket.io";
import { getProducts } from './routes/web/views.products.js';
import { getCart } from './routes/web/views.products.js';

//========={ Logs }=========
import { developmentLogger, productionLogger } from './logs/winston.config.js';
import { logMessage } from "./logs/logger.js";
//========={ Logs }=========

import User from "./dao/dbManagers/models/users.model.js";

const app = express();

app.use(express.json());  
app.use(express.urlencoded({ extended: true }));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(flash());

process.env.NODE_TLS_REJECT_UNAUTHORIZED = config.nodeTlsRejectUnauthorized;

// Registra el helper
const hbs = exphbs.create({
    handlebars: allowInsecurePrototypeAccess(Handlebars),
    helpers: {
        multiply: function(a, b) {
            return a * b;
        },
        debug: function (value) {
            if (process.env.NODE_ENV === 'development') {
                developmentLogger.log('info', 'Current Context');
                developmentLogger.log('info', '====================');
                developmentLogger.log('info', this);
            } else {
                productionLogger.log('info', 'Current Context');
                productionLogger.log('info', '====================');
                productionLogger.log('info', this);
            }

            if (value) {
                if (process.env.NODE_ENV === 'development') {
                    developmentLogger.log('info', 'Value');
                    developmentLogger.log('info', '====================');
                    developmentLogger.log('info', value);
                } else {
                    productionLogger.log('info', 'Value');
                    productionLogger.log('info', '====================');
                    productionLogger.log('info', value);
                }
            }
        },
    },
});


app.engine("handlebars", hbs.engine);
app.set("view engine", "handlebars");

// Lee y compila la plantilla CartDetails.handlebars
app.use(express.static(`${__dirname}/rendered/public`));  // Aquí se especifica el nuevo directorio del js de las vistas
app.set('views', `${__dirname}/rendered/views`); // Aquí se especifica el nuevo directorio de vistas

app.use(session({
    secret: 'Coder39760',
    resave: true,
    saveUninitialized: true
}))

//======== { Configuración de logs }========
app.use((req, res, next) => {
    if (process.env.NODE_ENV === 'development') {
        req.logger = (req, level, message) => logMessage(developmentLogger, req, level, message);
    } else {
        req.logger = (req, level, message) => logMessage(productionLogger, req, level, message);
    }
    next();
});
//======== { Configuración de logs }========

//========={ Inicialización de passport }=========
initializePassport();

app.use(session({
    secret: 'your secret here',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
//========={ Inicialización de passport }=========

const swaggerOptions = {
    definition: {
        openapi: '3.0.1',
        info: {
            title: 'Documentación del proyecto',
            description: 'API pensada para resolver el proceso de documentación'
        }
    },
    apis: [`${__dirname}/docs/**/*.yaml`]
};

const specs = swaggerJsdoc(swaggerOptions);
app.use('/api/docs', swaggerUiExpress.serve, swaggerUiExpress.setup(specs));

function checkRole(roles) {
    return (req, res, next) => {

        if (req.isAuthenticated()) {

            if (roles.includes(req.user.role)) {
                return next();
            } else {
                req.logger(
                    req,
                    'error',
                    'Solo los administradores y los usuarios premium pueden usar los métodos de productos'
                );
                res.status(401).json({
                    message:
                        'Solo los administradores y los usuarios premium pueden usar los métodos de productos',
                });
            }
        } else {
            res.status(401).json({ message: 'Unauthorized' });
        }
    };
}


//========={ Usando de routers }=========
app.use("/", viewsProductRouter);
app.use('/api/products', passport.authenticate('jwt', { session: false }), checkRole(['admin', 'premium']), productsRouter);
app.use('/api/carts', cartsRouter);
app.use("/api/sessions", sessionsRouter);
app.use("/api/users", usersRouter);
app.use("/", viewsRouter);
app.use("/", logsRouter);
//============ Nodemailer ============
app.post('/send-email', async (req, res) => {
    // Obtener la información del correo electrónico desde la solicitud HTTP
    const { email } = req.body;

    // Verificar si el correo electrónico existe en la base de datos
    const user = await User.findOne({ email: email });
    if (!user) {
        // El correo electrónico no existe en la base de datos
        // Enviar una respuesta al cliente indicando que el correo electrónico no existe
        res.status(400).send('El correo electrónico no existe');

        if (process.env.NODE_ENV === 'development') {
            developmentLogger.log('error', 'El correo electrónico no existe');
        } else {
            productionLogger.log('error', 'El correo electrónico no existe');
        }

        return;
    }

    // Generar un token único y una marca de tiempo
    const token = crypto.randomBytes(20).toString('hex');
    const timestamp = Date.now();

    // Configurar las opciones del correo electrónico
        const mailOptions = {
            from: 'Prueba',
            to: email,
            subject: 'Restablecimiento de contraseña',
            html: `<p>Para restablecer su contraseña, haga clic en el siguiente enlace: <a href="http://localhost:8080/reset/${token}/${timestamp}?email=${email}">Restablecer contraseña</a></p>`
        };

    // Crear un objeto transporter y enviar el correo electrónico
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        port: 587,
        auth: {
            user: 'zapataoliver280.2020@gmail.com',
            pass: 'drlfwobvhmugooms'
        }
    });

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            res.sendStatus(500);
        } else {
            if (process.env.NODE_ENV === 'development') {
                developmentLogger.log('info', `Email enviado: ${info.response}`);
            } else {
                productionLogger.log('info', `Email enviado: ${info.response}`);
            }
            res.sendStatus(200);
        }
    });
});


// En la ruta que maneja el restablecimiento de la contraseña
app.get('/reset/:token/:timestamp', async (req, res) => {
    const token = req.params.token;
    const timestamp = parseInt(req.params.timestamp);

    // Imprimir los valores de los parámetros de ruta

    // Verificar si el token es válido y no ha expirado
   if (Date.now() - timestamp > 60 * 1000) { 
        // El enlace ha expirado
        // Mostrar un mensaje al usuario y ofrecerle la opción de solicitar un nuevo enlace

        res.redirect('/new-reset');
    } else {
        // El enlace es válido
        // Obtener los valores del formulario desde la solicitud HTTP

        const email = req.query.email;

        // Obtener la contraseña actual del usuario desde la base de datos
        const user = await User.findOne({ email: email });
        
        // Verificar si el objeto user es nulo
        if (!user) {
            // El correo electrónico no existe en la base de datos
            // Enviar una respuesta al cliente indicando que el correo electrónico no existe
            res.status(400).send('El correo electrónico no existe');
            req.logger(req, 'error', 'El correo electrónico no existe');
            return;
        }

        // Mostrar la página de restablecimiento de contraseña al usuario
        res.render('newPassword', { email, token, timestamp });
    }
});


// En la ruta que maneja las solicitudes para generar un nuevo correo de restablecimiento
app.post('/new-reset', async (req, res) => {
      // Obtener la información del correo electrónico desde la solicitud HTTP
    const { email } = req.body;

    // Verificar si el correo electrónico existe en la base de datos
    const user = await User.findOne({ email: email });
    if (!user) {
        // El correo electrónico no existe en la base de datos
        // Enviar una respuesta al cliente indicando que el correo electrónico no existe
        res.status(400).send('El correo electrónico no existe');
        req.logger(req, 'error', 'El correo electrónico no existe');
        return;
    }

    // Generar un token único y una marca de tiempo
    const token = crypto.randomBytes(20).toString('hex');
    const timestamp = Date.now();

    // Configurar las opciones del correo electrónico
        const mailOptions = {
            from: 'Prueba',
            to: email,
            subject: 'Restablecimiento de contraseña',
            html: `<p>Para restablecer su contraseña, haga clic en el siguiente enlace: <a href="http://localhost:8080/reset/${token}/${timestamp}?email=${email}">Restablecer contraseña</a></p>`
        };

    // Crear un objeto transporter y enviar el correo electrónico
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        port: 587,
        auth: {
            user: 'zapataoliver280.2020@gmail.com',
            pass: 'drlfwobvhmugooms'
        }
    });

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            res.sendStatus(500);
        } else {

            if (process.env.NODE_ENV === 'development') {
                developmentLogger.log('info', 'Email enviado: ' + info.response);
            } else {
                productionLogger.log('info', 'Email enviado: ' + info.response);
            }

            res.sendStatus(200);
        }
    });
});


app.post('/reset-password', async (req, res) => {
    const { email, token, timestamp, password } = req.body;

    // Verificar si el token es válido y no ha expirado
    if (Date.now() - parseInt(timestamp) > 60 * 1000) {
    // El enlace ha expirado
    // Mostrar un mensaje al usuario y ofrecerle la opción de solicitar un nuevo enlace
    res.redirect('/new-reset');
    } else {
    // El enlace es válido
    // Hashear la nueva contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Actualizar la contraseña del usuario en la base de datos
    await User.updateOne({ email }, { password: hashedPassword });

    // Redirigir al usuario a la página de inicio de sesión
    res.redirect('/login');
    }
});
//============ Nodemailer ============

//========={ Usando de routers }========


//========={ Usando socket.io }========
const server = app.listen(8080, () => {
    if (process.env.NODE_ENV === 'development') {
        developmentLogger.log('info', 'Listening on 8080');
    } else {
        productionLogger.log('info', 'Listening on 8080');
    }
});

const io = new Server(server);

app.on('cartUpdated', async cartId => {
const productsData = await getProducts();
io.emit('products', productsData.products);

const cartData = await getCart(cartId);
io.emit('cart', cartData.products);
});


//======={ CHAT }=======
const messages = [];

io.on("connection", (socket) => {

    if (process.env.NODE_ENV === 'development') {
        developmentLogger.log('info', 'Nuevo cliente conectado');
    } else {
        productionLogger.log('info', 'Nuevo cliente conectado');
    }

    // Leer mensajes del evento:
    socket.on("message", (data) => {
    messages.push(data);
    io.emit("messageLogs", messages);
    });
    // Leer mensajes luego de autenticarse.
    socket.on("auth", (data) => {
    socket.emit("messageLogs", messages);
    socket.broadcast.emit("newUser", data);
    });
});
//======={ CHAT }=======

app.set('socketio', io);
io.sockets.setMaxListeners(20);
//========={ Usando socket.io }========