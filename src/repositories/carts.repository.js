import { cartsModel } from "../dao/dbManagers/models/carts.model.js";
/* import { productsModel } from "../dao/dbManagers/models/products.model.js"; */

export default class CartRepository {
    
    async create (cart) {
        const result = await cartsModel.create(cart);
        return result;
    }

    async findOne(filter) {
        const cart = await cartsModel.findOne(filter).lean();
        return cart;
    }

    async deleteOne(filter) {
        const result = await cartsModel.deleteOne(filter);
        return result;
    }

    async find(filter) {
        const carts = await cartsModel.find(filter).lean();
        return carts;
    }

    async findAndPopulate(filter) {
        const carts = await cartsModel.find(filter).populate('products.IDprod');
        return carts;
    }
    

    async findById(id) {
        const cart = await cartsModel.findById(id);
        return cart;
    }

    async findByIdProds(id) {
        const query = cartsModel.findById(id);
        return query;
    }

    async findByIdPage(id) {
        const query = cartsModel.findById(id).exec();
        return query;
    }

    async save(cart) {
        await cart.save();
    }
    
    async addProductToCart(cartId, prodId, quantity) {
        try {
            // Verificar si el carrito existe
            const cart = await cartsModel.findById(cartId);
            
            if (!cart) {
                throw new Error('Carrito no encontrado');
            }
    
            // Verificar si el producto ya está en el carrito
            const productInCart = cart.products.find(product => product.IDprod.toString() === prodId);
    
            if (productInCart) {
                throw new Error('El producto ya está en el carrito');
            } else {
                // Agregar el producto al carrito
                cart.products.push({ IDprod: prodId, quantity });
                
                // Actualizar el carrito en la base de datos
                await cart.save(); // Guarda los cambios en el carrito
    
                return cart; // Devuelve el carrito actualizado
            }
        } catch (error) {
            throw error;
        }
    }
    
}