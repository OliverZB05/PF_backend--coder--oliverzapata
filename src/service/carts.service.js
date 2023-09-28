import CartRepository from '../repositories/carts.repository.js';
import ProductRepository from '../repositories/products.repository.js';
import UsersRepository from "../repositories/users.repository.js";
import userModel from "../dao/dbManagers/models/users.model.js";
import Products from '../service/products.service.js';

const cartRepository = new CartRepository();
const productRepository = new ProductRepository(); 
const usersRepository = new UsersRepository();
let ProductsInstance = new Products();

export default class Carts {

    create = async (cart, userEmail) => {
        cart.ownerCart = userEmail;
        const result = await cartRepository.create(cart);
        return result;
    }

    createCartAndAssociateWithUser = async (cartData, userEmail) => {
        try {
            // Crea el carrito
            const cart = { ...cartData }; // Copia los datos del carrito para evitar modificar el objeto original
            cart.ownerCart = userEmail;
            const result = await cartRepository.create(cart);
    
            // Asociar el carrito con el usuario actual
            const user = await usersRepository.findByEmail(userEmail);
            if (!user) {
                throw new Error("Usuario no encontrado");
            }
    
            user.carts.push({ cart: result._id });
            await user.save();
    
            return result;
        } catch (error) {
            throw error;
        }
    }
    
    
    getId = async (id) => {
        const cart = await cartRepository.findOne({ _id: id });
        return cart;
    }

    erase = async (id) => {
        const result = await cartRepository.deleteOne({ _id: id });
        return result;
    }

    getAll = async (ids) => {
        const carts = await cartRepository.findAndPopulate({ _id: { $in: ids } });
        return carts;
    }
    
    getAllCartsWithProducts = async (user, ids) => {
    const cartIds = user.carts.map(c => c.cart);
    const carts = await cartRepository.findAndPopulate({ _id: { $in: ids } });

    if (carts.some(cart => !Array.isArray(cart.products))) {
        throw new Error("Algunos objetos del carrito no tienen una propiedad de products válida");
    }

    const transformedCarts = await Promise.all(carts.map(async cart => {
        cart.products = await Promise.all(cart.products.map(async p => {
        if (p.IDprod) {
            const product = await productRepository.findById(p.IDprod);
            if (product) {
            const productObj = product.toObject();
            delete productObj._id;
            return { name: p.name, price: p.price, IDprod: product._id.toString(), quantity: p.quantity, stock: p.stock };
            } else {
            console.log(`El producto con IDprod ${p.IDprod} no existe en la base de datos`);
            return null;
            }
        } else {
            return null;
        }
        }));
        cart.products = cart.products.filter(product => product !== null);
        return cart;
    }));

    return transformedCarts;
    }

    async addProductToCart(cartId, prodId, quantity) {
        try {
            // Verificar si el carrito existe
            const cart = await cartRepository.findById(cartId);
            
            if (!cart) {
                throw new Error('Carrito no encontrado');
            }
    
            // Verificar si el producto ya está en el carrito
            const productInCart = cart.products.find(product => product.IDprod.toString() === prodId);
    
            if (productInCart) {
                throw new Error('El producto ya está en el carrito');
            } else {
                // Agregar el producto al carrito
                const updatedCart = await cartRepository.addProductToCart(cart, prodId, quantity);
                // Actualizar el carrito en la base de datos
                await cartRepository.save(updatedCart);
    
                return updatedCart;
            }
        } catch (error) {
            throw error;
        }
    }

    getCartById = async (user, cartId) => {
        try {
            // Comprueba si el carrito pertenece al usuario actual.
            const cartIds = user.carts.map(c => c.cart.toString());
            if (!cartIds.includes(cartId)) {
                throw new Error('Carrito no encontrado');
            }
    
            // Obtiene el carrito
            const cart = await cartRepository.findById(cartId);
            if (!cart) {
                throw new Error('Carrito no encontrado');
            }
    
            // Transforma la respuesta
            const transformedCart = cart.products.map(p => ({
                id: p.product,
                quantity: p.quantity
            }));
    
            return [cart];
        } catch (error) {
            throw new Error(`Error al obtener el carrito: ${error.message}`);
        }
    }
    

    updateProductToCart = async (req, cartId, productId, quantity) => {
        const cart = await cartRepository.findById(cartId);
        if (!cart) {
            req.logger(req, 'error', `Carrito no encontrado`);
            throw new Error("Carrito no encontrado");
        };
    
        // Obtener el producto y verificar el stock
        const product = await productRepository.findById(productId);
        if (!product) {
            req.logger(req, 'error', `Producto no encontrado`);
            throw new Error("Producto no encontrado");
        };
        if (quantity > product.stock){
            req.logger(req, 'error', `Stock insuficiente`);
            throw new Error("Stock insuficiente")
        };
    
        cart.products || (cart.products = []);
        let index = cart.products.findIndex(p => p.IDprod.equals(productId));
        let finalQuantity = quantity;
        if (index !== -1) {
            // Verificar que la cantidad total no exceda el stock
            if (quantity > product.stock){
                req.logger(req, 'error', `Stock insuficiente`);
                throw new Error("Stock insuficiente")
            };
            cart.products[index].quantity = quantity;
            finalQuantity = cart.products[index].quantity;
        } else {
            // Verificar que la cantidad solicitada no exceda el stock
            if (quantity > product.stock){
                req.logger(req, 'error', `Stock insuficiente`);
                throw new Error("Stock insuficiente")
            };
            cart.products.push({ product: productId, quantity });
        }
        await cart.save();
        return { id: productId, quantity: finalQuantity };
    }

    updateCart = async (req, cartId, sort, page, limit) => {
        const cart = await cartRepository.findByIdPage(cartId);
        if (!cart){
            req.logger(req, 'error', `Carrito no encontrado`);
            throw new Error("Carrito no encontrado");
        }

        if (sort === 'asc') {
            cart.products.sort((a, b) => a.quantity - b.quantity);
        } else if (sort === 'desc') {
            cart.products.sort((a, b) => b.quantity - a.quantity);
        }

        let skip = ((page = parseInt(page) || 1) - 1) * (limit = parseInt(limit) || 3);
        const products = cart.products.map(p => ({ id: p.IDprod.toString(), quantity: p.quantity }));
        var payload = products.slice(skip, skip + limit),
            totalProducts = products.length,
            totalPages = Math.ceil(totalProducts / limit),
            hasPrevPage = page > 1,
            hasNextPage = page < totalPages;
        return {
            status: "success", payload, totalPages,
            prevPage: hasPrevPage ? page - 1 : null,
            nextPage: hasNextPage ? page + 1 : null,
            page, hasPrevPage, hasNextPage
        };
    }

    deleteProdsOneToCart = async (req, cartId, productId, quantity) => {
        const cart = await cartRepository.findById(cartId);
        if (!cart){ 
            req.logger(req, 'error', `Carrito no encontrado`);
            throw new Error("Carrito no encontrado");  
        };
        cart.products || (cart.products = []);
        let index = cart.products.findIndex(p => p.IDprod.equals(productId));
        let finalQuantity = 0;
        if (index === -1) throw new Error("Product not found in cart");
        cart.products[index].quantity -= quantity;
        finalQuantity = cart.products[index].quantity;
        if (cart.products[index].quantity <= 0) {
            cart.products.splice(index, 1);
            finalQuantity = 0;
        }
        await cart.save();
        return finalQuantity;
    }


    deleteProdsToCart = async(req, cartId)=>{
    const cart=await cartRepository.findById(cartId);
    if(!cart){
        req.logger(req, 'error', `Carrito no encontrado`);
        throw new Error("Carrito no encontrado");
    };
    cart.products=[];
    await cart.save();
}

    incrementQuantity = async (cartId, productId) => {
        const cart = await cartRepository.findById(cartId);
        if (!cart) {
            throw new Error("Carrito no encontrado");
        }
        const productIndex = cart.products.findIndex(p => p && p.IDprod && p.IDprod.equals(productId));

        if (productIndex === -1) {
            throw new Error("Producto no encontrado en el carrito");
        }

        cart.products[productIndex].quantity += 1;
        await cartRepository.save(cart);

        return cart.products[productIndex].quantity;
    };

    decrementQuantity = async (cartId, productId) => {
        const cart = await cartRepository.findById(cartId);

        if (!cart) {
            throw new Error("Carrito no encontrado");
        }

        const productIndex = cart.products.findIndex(p => p && p.IDprod && p.IDprod.equals(productId));

        if (productIndex === -1) {
            throw new Error("Producto no encontrado en el carrito");
        }

        cart.products[productIndex].quantity -= 1;

        let quantity = cart.products[productIndex].quantity;
        if (quantity === 0) {
            cart.products.splice(productIndex, 1);
        }
        let result = quantity > 0 ? quantity : 0;

        await cartRepository.save(cart);
        return result;
    };
}