import UsersRepository from "../repositories/users.repository.js";
import fs from 'fs';
import path from 'path';
import { __dirname } from '../utils.js';
import { sendEmail } from '../rendered/public/js/email.js';


const usersRepository = new UsersRepository();

export default class Users {

getId = async (id) => {
    const user = await usersRepository.findById({ _id: id });
    return user;
}

upload = async (req, userId) => {
// Obtener el ID del usuario de los parámetros de ruta
const user = await usersRepository.findById(userId);
/* console.log('Usuario:', user); */

// Verificar si el usuario existe en la base de datos
if (!user) {
    throw new Error("Usuario no encontrado");
}
    
// Procesar los archivos cargados
for (const fieldName in req.files) {
    for (const file of req.files[fieldName]) {
        /* console.log('Procesando archivo:', file.originalname); */
    // Extraer el nombre del archivo sin la extensión
    const fileName = path.parse(file.originalname).name;
    
    // Agregar documento al usuario
    user.documents.push({
    name: fileName,
    reference: file.path.replace(__dirname, '')
    });
    /* console.log('Usuario después de agregar documento:', user); */
    
    // Renombrar el archivo
    const oldPath = file.path;
    const newPath = oldPath.replace(file.filename, file.originalname);
    fs.rename(oldPath, newPath, err => {
    if (err) throw err;
    console.log('Archivo renombrado:', newPath);
    });
    }
}

// Devolver el usuario actualizado
/* console.log('Guardando usuario:', user); */
await usersRepository.save(user); 

}

save = async (user) => {
    await usersRepository.save(user);
}

async getAll() {
    const users = await usersRepository.findAll();
    return users.map(user => ({
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role
    }));
}

async updateRole(id, role) {
    const user = await usersRepository.updateRole(id, role);
    return user;
}

async delete(id) {
    const result = await usersRepository.deleteById(id);
    return result;
}

async deleteInactiveUsers() {
    // const daysInactive = 1/720;
    const daysInactive = 2; // Número de días de inactividad
    const users = await usersRepository.findInactiveUsers(daysInactive);
    let deletedUsersCount = 0;
    for (const user of users) {
        if (user.role !== 'admin') {
            await sendEmail(user.email);
            await usersRepository.deleteById(user._id);
            deletedUsersCount++;
        }
    }
    return deletedUsersCount;
}


}