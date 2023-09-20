import { Router } from 'express';
import multer from 'multer';
import { userPremium, uploadDocuments, deleteInactiveUsers, getUsers, updateRoleUser, deleteUser } from '../../service/users.service.js';
import { __dirname } from '../../utils.js';
import User from '../../dao/dbManagers/models/users.model.js';
import { transporter } from '../../transporter.js';
import jwt from 'jsonwebtoken';

const router = Router();

router.post('/premium/:id', userPremium);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let folder;
    if (file.fieldname === 'profileImage') {
      folder = `${__dirname}/uploads/profiles`;
    } else if (file.fieldname === 'productImage') {
      folder = `${__dirname}/uploads/products`;
    } else if (file.fieldname === 'document') {
      folder = `${__dirname}/uploads/documents`;
    }

    if (!folder) {
      // Indicar que ha ocurrido un error
      return cb(new Error('Tipo de archivo no válido'));
    }

    cb(null, folder);
  },

  filename: function (req, file, cb) {
    const extension = file.originalname.split('.').pop();
    cb(null, file.fieldname + '-' + Date.now() + '.' + extension);
  }
});

const upload = multer({ storage: storage });

router.post('/:id/documents', upload.fields([
  { name: 'profileImage' },
  { name: 'productImage' },
  { name: 'document' }
]), (req, res, next) => {
  // Verificar si ha ocurrido un error
  if (req.fileValidationError) {
    return res.status(400).json({ message: req.fileValidationError.message });
  }
  next();
}, uploadDocuments);


router.get('/', getUsers);


const authenticateJWT = (req, res, next) => {
  const token = req.cookies.jwt;

  if (!token) {
      return res.status(403).json({ message: 'No se proporcionó un token de autenticación' });
  }

  jwt.verify(token, 'your_jwt_secret', (err, user) => {
      if (err) {
          return res.status(403).json({ message: 'Token de autenticación inválido' });
      }

      req.user = user;
      next();
  });
};

router.delete('/', authenticateJWT, async (req, res) => {
  await deleteInactiveUsers(req, res);
});

router.put('/:id', updateRoleUser);

router.delete('/:id', deleteUser);

export default router;