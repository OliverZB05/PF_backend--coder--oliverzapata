import User from '../dao/dbManagers/models/users.model.js';
import { __dirname } from "../utils.js";
import fs from 'fs';
import path from 'path';
import { transporter } from '../transporter.js';
import userModel from "../dao/dbManagers/models/users.model.js";

export const userPremium = async (req, res) => {
// Obtener el ID del usuario de los parámetros de ruta
const userId = req.params.id;

// Buscar al usuario en la base de datos por su ID
const user = await User.findById(userId);

// Verificar si el usuario existe en la base de datos
if (!user) {
return res.status(404).json({ message: 'Usuario no encontrado' });
}

// Verificar si el usuario tiene rol de admin
if (user.role === 'admin') {
return res.status(403).json({ message: 'Solo los usuarios con rol user pueden cambiar a premium' });
}

// Verificar si el usuario tiene los documentos requeridos
const missingDocuments = [];
if (!user.documents.some(doc => doc.name === 'Identificacion')) {
missingDocuments.push('Identificacion');
}
if (!user.documents.some(doc => doc.name === 'Comprobante de domicilio')) {
missingDocuments.push('Comprobante de domicilio');
}
if (!user.documents.some(doc => doc.name === 'Comprobante de estado de cuenta')) {
missingDocuments.push('Comprobante de estado de cuenta');
}

if (missingDocuments.length > 0) {
return res.status(400).json({ message: `No se puede actualizar al usuario a premium porque le faltan los siguientes documentos: ${missingDocuments.join(', ')}` });
}

// Cambiar el rol del usuario
user.role = user.role === 'user' ? 'premium' : 'user';
await user.save();

// Enviar respuesta al cliente
res.json({ message: `El rol del usuario ha sido cambiado a ${user.role}` });
}; 

export const uploadDocuments = async (req, res) => {
// Obtener el ID del usuario de los parámetros de ruta
const userId = req.params.id;

// Buscar al usuario en la base de datos por su ID
const user = await User.findById(userId);

// Verificar si el usuario existe en la base de datos
if (!user) {
return res.status(404).json({ message: 'Usuario no encontrado' });
}

// Procesar los archivos cargados
for (const fieldName in req.files) {
for (const file of req.files[fieldName]) {
// Extraer el nombre del archivo sin la extensión
const fileName = path.parse(file.originalname).name;

// Agregar documento al usuario
user.documents.push({
name: fileName,
reference: file.path.replace(__dirname, '')
});

// Renombrar el archivo
const oldPath = file.path;
const newPath = oldPath.replace(file.filename, file.originalname);
fs.rename(oldPath, newPath, err => {
if (err) throw err;
});
}
}

// Guardar cambios en el modelo de usuario
await user.save();

// Enviar respuesta al cliente
res.json({ message: 'Documentos cargados con éxito' });
};

export const getUsers = async (req, res) => {
// Obtener todos los usuarios
const users = await User.find().select('first_name last_name email role');

// Crear un nuevo objeto para cada usuario con solo las propiedades deseadas
const results = users.map(user => ({
    id: user._id,
    name: `${user.first_name} ${user.last_name}`,
    email: user.email,
    role: user.role
}));

// Enviar los resultados al cliente
res.json(results);
};

const getUsersValue = async (req, res) => {
// Obtener todos los usuarios
const users = await User.find().select('first_name last_name email role last_connection');

// Crear un nuevo objeto para cada usuario con solo las propiedades deseadas
const results = users.map(user => ({
    id: user._id,
    name: `${user.first_name} ${user.last_name}`,
    email: user.email,
    role: user.role,
    last_connection: user.last_connection
}));

// Enviar los resultados al cliente si se proporcionó una respuesta
if (res) {
res.json(results);
}

// Devolver los resultados
return results;
};

export const deleteInactiveUsers = async (req, res) => {
// Obtener el ID del usuario que está ejecutando el método
const currentUserId = req.user.id;

// Buscar al usuario en la base de datos
const currentUser = await userModel.findById(currentUserId);

// Verificar si el usuario tiene el rol "admin"
if (currentUser.role !== 'admin') {
return res.status(403).json({ message: 'No tienes permiso para ejecutar este método, solo los usuarios con el rol admin pueden ejecutarlo' });
}

// Obtener la lista de usuarios
const users = await getUsersValue(req);

// Filtrar los usuarios inactivos y excluir al usuario actual y a los usuarios con el rol "admin"
const inactiveUsers = users.filter(user => {
if (user.id === currentUserId || user.role === 'admin') {
return false;  // Excluir al usuario actual y a los usuarios con el rol "admin"
}
return user.last_connection < new Date(new Date().getTime() - (2 * 24 * 60 * 60 * 1000));

});

// Eliminar los usuarios inactivos de la base de datos
await User.deleteMany({ _id: { $in: inactiveUsers.map(user => user.id) } });

// Enviar un correo electrónico a cada usuario inactivo
for (const user of inactiveUsers) {
// Obtener la dirección de correo electrónico del usuario
const email = user.email;

// Verificar si la dirección de correo electrónico está definida y es válida
if (!email) {
console.log(`No se pudo enviar el correo electrónico al usuario ${user._id} porque su dirección de correo electrónico no está definida`);
continue;
}

// Crear un mensaje de correo electrónico
const message = `
    <html>
    <head>
    <title>Su cuenta ha sido eliminada</title>
    </head>
    <body>
    <p>Estimado/a usuario</p>
    <p>Le informamos que su cuenta en nuestra aplicación ha sido eliminada debido a un período prolongado de inactividad.</p>
    <p>Si desea volver a activar su cuenta, por favor comuníquese con nosotros para obtener más información.</p>
    <p>Atentamente,</p>
    <p>El equipo de soporte</p>
    </body>
    </html>
    `;

// Enviar el correo electrónico
await transporter.sendMail({
    from: 'Prueba',
    to: email,
    subject: 'Su cuenta ha sido eliminada',
    html: message
});
}

// Enviar una respuesta al cliente
res.json({ message: `Se eliminaron ${inactiveUsers.length} usuarios inactivos` });
};

export const updateRoleUser = async (req, res) => {
try {
const user = await User.findById(req.params.id);

if (!user) {
return res.status(404).json({ message: 'User not found' });
}

// Actualiza el rol del usuario
user.role = req.body.role;
await user.save();

res.json({ message: 'User role updated successfully' });
} catch (error) {
res.status(500).json({ message: error.message });
}
};

export const deleteUser = async (req, res) => {
try {
const user = await User.findById(req.params.id);

if (!user) {
return res.status(404).json({ message: 'User not found' });
}

// Borrar usuario
await User.deleteOne({ _id: user._id });
res.json({ message: 'User delete successfully' });
} catch (error) {
res.status(500).json({ message: error.message });
}
};