import { fileURLToPath } from 'url';
import { dirname } from 'path';
import bcrypt from 'bcrypt';
import faker from 'faker';
import mongoose from 'mongoose';
import { PRIVATE_KEY } from "../src/config/contans.js";
import jwt from 'jsonwebtoken';

faker.locale = 'es'; //Para que esté configurado en español

export const createHash = password => bcrypt.hashSync(password, bcrypt.genSaltSync(10));
export const isValidPassword = (user, password) => bcrypt.compareSync(password, user.password);

//===============
const generateToken = (user) => {
    const token = jwt.sign({ user }, PRIVATE_KEY, { expiresIn: '24h' });
    return token;
};
//===============

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const generateProduct = () => {

    return {
        _id: new mongoose.Types.ObjectId(),
        title: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        price: faker.commerce.price(),
        thumbnail: [faker.image.imageUrl()],
        stock: faker.datatype.number({min: 0, max: 19}),
        category: faker.commerce.department(),
        status: true,
        code: true,
        __v: 0,
        isMockingProduct: true
    }
}

export {
    generateProduct,
    __dirname,
    generateToken
}