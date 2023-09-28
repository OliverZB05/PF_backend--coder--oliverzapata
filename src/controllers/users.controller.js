import Users from "../service/users.service.js";
import { __dirname } from "../utils.js";

let usersInstance = new Users();

const userPremium = async (req, res) => {
// Obtener el ID del usuario de los parámetros de ruta
const userId = req.params.id;

// Buscar al usuario en la base de datos por su ID
const user = await usersInstance.getId(userId);

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

// Guarda el cambio en la base de datos
await usersInstance.save(user);

// Enviar respuesta al cliente
res.json({ message: `El rol del usuario ha sido cambiado a ${user.role}` });
}; 

const uploadDocuments = async (req, res) => {


const userId = req.params.id;
const user = await usersInstance.upload(req, userId);

// Enviar respuesta al cliente
res.json({ message: 'Documentos cargados con éxito' });
};

const getAllUsers = async (req, res) => {
    const users = await usersInstance.getAll();
    res.json(users);
};

const updateUserRole = async (req, res) => {
    try {
        const user = await usersInstance.updateRole(req.params.id, req.body.role);
        res.json({ message: 'User role updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteUser = async (req, res) => {
    try {
        await usersInstance.delete(req.params.id);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteInactiveUsers = async (req, res) => {
    const daysInactive = req.params.days;
    const deletedUsersCount = await usersInstance.deleteInactiveUsers(daysInactive);
    if (deletedUsersCount > 0) {
        res.json({ message: 'Usuarios inactivos eliminados con éxito' });
    } else {
        res.json({ message: 'No se eliminaron usuarios inactivos' });
    }
};

export { userPremium, uploadDocuments, getAllUsers, updateUserRole, deleteUser, deleteInactiveUsers };