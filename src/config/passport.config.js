import jwt from 'jsonwebtoken';
import passport from 'passport';
import local from 'passport-local';
import GitHubStrategy from 'passport-github2';
import userModel from '../dao/dbManagers/models/users.model.js';
import { createHash, isValidPassword } from '../utils.js';
import passportJWT from 'passport-jwt';
import { privateKey } from './contans.js';
import config from './config.js';
import { UserDto } from '../dao/DTOs/config.dto.js';

import { getUserCarts } from '../controllers/carts.controller.js';

const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;
const LocalStrategy = local.Strategy;

const initializePassport = () => {

    const cookieExtractor = (req) => {
        let token = null;
        // Extrayendo el token JWT de las cookies
        if (req && req.cookies) {
            token = req.cookies['jwt'];
        }
        return token;
    };
    
// Estrategia de autenticación JWT
passport.use('jwt', new JWTStrategy({
    jwtFromRequest: ExtractJWT.fromExtractors([cookieExtractor]),
    secretOrKey: privateKey,
    passReqToCallback: true 
}, async (req, jwt_payload, done) => {
    try {
        // Buscando al usuario en la base de datos
        const user = await userModel.findById(jwt_payload.id);
        if (user) {
            return done(null, user);
        } else {
            return done(null, false);
        }
    } catch (error) {
        req.logger(req, 'error', `${error.message}`);
        return done(error);
    }
}));


//=========={ Login }==========
passport.use('login', new LocalStrategy({
    usernameField: 'email',
    passReqToCallback: true
}, async (req, username, password, done) => {
    try {
        // Buscando al usuario en la base de datos
        const user = await userModel.findOne({ email: username });

        if (!user) {
            return done(null, false, { message: 'Este correo no coincide con ningún usuario registrado, por favor regístrese antes de iniciar sesión' });
        }

        // Verificando si la contraseña es válida
        if (!isValidPassword(user, password)) {
            return done(null, false, { message: 'Contraseña incorrecta' });
        } else {
            // Actualizar last_connection en el modelo de usuario
            user.lastConnection = new Date();
            await user.save();

            // Creando un token JWT
            const token = jwt.sign({ id: user._id }, privateKey);
            return done(null, { user, token });
        }
    } catch (error) {
        req.logger(req, 'error', `${error.message}`);
        return done(`Error al obtener el usuario: ${error}`)
    }
}));

//=========={ Login }==========

//=========={ Register }==========
passport.use('register', new LocalStrategy({
usernameField: 'email',
passReqToCallback: true
}, async (req, username, password, done) => {
const { firstName, lastName, email, age, documents, lastConnection } = req.body;
try {
// Verificando si el correo ya está registrado
const user = await userModel.findOne({ email: username });

if (user) {
return done(null, false, { message: 'El correo pertenece a un usuario ya registrado' })
}

let role;
// Asignando el rol de administrador si el correo y la contraseña coinciden con los valores de configuración
if (email === config.adminEmail && password === config.adminPassword) {
role = "admin";
}
const userToSave = {
firstName,
lastName,
email,
age,
password: createHash(password),
role
}
// Creando un nuevo usuario en la base de datos
const result = await userModel.create(userToSave);
// Creando un token JWT
const token = jwt.sign({ id: result._id }, privateKey);
return done(null, { user: result, token })
} catch (error) {
req.logger(req, 'error', `${error.message}`);
return done(`Error al obtener el usuario: ${error}`)
}
}));
//=========={ Register }==========

//=========={ Login en github }==========
passport.use('github', new GitHubStrategy({
clientID: "Iv1.ad3077c6cea461c0",
clientSecret: "52e9e374d314ec5d4b39159799ea43d6ef83752c",
callbackURL: "http://localhost:8080/api/sessions/github-callback",
scope: ['user:email'],
passReqToCallback: true 
}, async (req, accessToken, refreshToken, profile, done) => {
try {
const email = profile.emails[0].value;
// Buscando al usuario en la base de datos
const user = await userModel.findOne({ email })
const role = 'user';
if (!user) {
// Creando un nuevo usuario en la base de datos si no existe
const newUser = {
firstName: profile.username,
name: profile.username,
lastName: '',
age: '',
email,
password: '',
role
}

const result = await userModel.create(newUser);

// Creando un token JWT
const token = jwt.sign({ id: result._id }, privateKey);

// Asignando el objeto user a la sesión
req.session.user = result;

done(null, { user: result, token });
} else {
// Creando un token JWT
const token = jwt.sign({ id: user._id }, privateKey);
done(null, { user, token });
}
} catch (error) {
req.logger(req, 'error', `${error.message}`);
return done(error);
}
}));

//=========={ Login en github }==========


//=========={ current }==========
// Modificar la estrategia de Passport para utilizar getUserCarts
passport.use('current', new JWTStrategy({
    jwtFromRequest: ExtractJWT.fromExtractors([(req) => {
    let token = null;
    // Extrayendo el token JWT de las cookies
    if (req && req.cookies) {
        token = req.cookies['jwt'];
    }
        return token;
    }]),
    secretOrKey: privateKey,
    passReqToCallback: true 
    }, async (req, jwtPayload, done) => {
    try {
    // Buscando al usuario en la base de datos
        const user = await userModel.findById(jwtPayload.id);
    if (user) {
        // Creando una instancia del DTO y pasándole el objeto user
        const userDto = new UserDto(user);
        // Obteniendo los carritos del usuario usando getUserCarts
        userDto.carts = await getUserCarts(userDto);
        // Devolviendo la instancia del DTO en lugar del objeto user
        return done(null, userDto);
    } else {
        return done(null, false);
    }
    } catch (error) {
    req.logger(req, 'error', `${error.message}`);
        return done(error);
    }
}));
//=========={ current }==========


//=========={ serializar y deserializar }==========
passport.serializeUser(function(data, done) {
    done(null, data.user._id);
});


passport.deserializeUser(async function(id, done) {
    try {
        const user = await userModel.findById(id);
        done(null, user);
    } catch (err) {
    done(err);
    }
});
//=========={ serializar y deserializar }==========

};
export default initializePassport;