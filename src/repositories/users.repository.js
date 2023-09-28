import userModel from "../dao/dbManagers/models/users.model.js";

export default class UsersRepository {

    async findAll() {
        const users = await userModel.find().lean();
        return users;
    }

    async updateRole(id, role) {
        const user = await userModel.findById(id);
        if (!user) throw new Error('User not found');
        user.role = role;
        await user.save();
        return user;
    }

    async deleteById(id) {
        const result = await userModel.deleteOne({ _id: id });
        return result;
    }
    
    async create (user) {
        const result = await userModel.create(user);
        return result;
    }

    async findOne(filter) {
        const user = await userModel.findOne(filter).lean();
        return user;
    }

    async deleteOne(filter) {
        const result = await userModel.deleteOne(filter);
        return result;
    }

    async find(filter) {
        const users = await userModel.find(filter).lean();
        return users;
    }

    async findAndPopulate(filter) {
        const users = await userModel.find(filter).populate('products.IDprod');
        return users;
    }
    

    async findById(id) {
        const user = await userModel.findById(id);
        return user;
    }


    async save(user) {
        await user.save();
    }

    async findInactiveUsers(daysInactive) {
        const inactiveDate = new Date(new Date().getTime() - (daysInactive * 24 * 60 * 60 * 1000));
        const users = await userModel.find({ lastConnection: { $lt: inactiveDate } }).lean();
        return users;
    }
    
    async findByEmail(email) {
        try {
            // Utiliza el método findOne de Mongoose para buscar un usuario por su correo electrónico
            const user = await userModel.findOne({ email });

            // Si no se encuentra ningún usuario con el correo electrónico proporcionado, devuelve null
            if (!user) {
                return null;
            }

            // Si se encuentra un usuario, devuelve el objeto de usuario encontrado
            return user;
        } catch (error) {
            throw error;
        }
    }
}