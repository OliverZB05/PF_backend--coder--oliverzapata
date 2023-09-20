import { Router } from 'express';
import userModel from '../../dao/dbManagers/models/users.model.js';
import passport from 'passport';
import { createHash } from '../../utils.js';
const router = Router();

//========= Register =========
router.post('/register', (req, res, next) => {
    passport.authenticate('register', (err, data, info) => {
    if (err) return next(err);
    if (!data) return res.send({ status: 'error', message: info.message });
    res.cookie('jwt', data.token, { httpOnly: true });
    res.send({ status: 'success', message: 'User registered', token: data.token });
    })(req, res, next);
});
//========= Register =========

//========= Login =========
router.post('/login', (req, res, next) => {
passport.authenticate('login', async (err, data, info) => {
if (err) return next(err);
if (!data) return res.send({ status: 'error', message: info.message });

// Actualizar last_connection en el modelo de usuario
const user = await userModel.findById(data.user._id);
user.last_connection = new Date();
await user.save();

req.session.user = data.user; 

res.cookie('jwt', data.token, { httpOnly: true });
res.send({ status: 'success', message: 'Login success', token: data.token });
})(req, res, next);
});

//========= Login =========

//========= Github =========
router.get('/github', passport.authenticate(
'github', { scope: ['user:email'] }
), async (req, res) => {
res.send({ status: "success", message: "User registered" })
});
router.get('/github-callback', passport.authenticate(
'github', { failureRedirect: '/login' }
), async (req, res) => {
// Asignando el objeto user a la sesión
req.session.user = req.user.user;
res.cookie('jwt', req.user.token, { httpOnly: true });
res.redirect('/products');
});
//========= Github =========

//========= Reset =========
router.post('/reset', async (req, res) => {
try {
const { email, password } = req.body;
    if (!email || !password) return res.status(400).send({ status: 'error', error: 'Incomplete values' });
    const user = await userModel.findOne({ email });
    if (!user) return res.status(400).send({ status: 'error', error: 'Este correo no coincide con ningún usuario registrado' });
    user.password = createHash(password);
    await userModel.updateOne({ email }, user);
    res.send({ status: 'success', message: 'Password reset' })
} catch (error) {
req.logger(req, 'error', `${error.message}`);
res.status(500).send({ status: 'error', error: error.message });
}
})
//========= Reset =========

router.get('/current', passport.authenticate('current', { session: false }), (req, res) => {
res.send({ status: 'success', user: req.user });
});

//========= Logout =========
const logout = (req, res) => {
// Limpiando cookie de JWT
res.clearCookie('jwt');
//Destruir sesión
req.session.destroy(err => {
if (err) return res.status(500).send({ status: 'error', error: 'Logout fail' });
res.redirect('/')
})
};
router.get('/logout', logout);
//========= Logout =========
export { router as default, logout };