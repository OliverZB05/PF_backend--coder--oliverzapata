import passport from 'passport';
import mongoose from 'mongoose'; 
import Factory from "../dao/factory.js";
const { Carts, Products } = await Factory();

const CartsInstance = new Carts();
const ProductsInstance = new Products();

import TicketService from '../service/ticket.service.js';
const ticketServiceInstance = new TicketService();

import CartRepository from '../repositories/carts.repository.js';
const cartRepository = new CartRepository();

import ProductRepository from '../repositories/products.repository.js';
const productRepository = new ProductRepository();

//======== { getAll_Carts / mostrar todos los carritos } ========
const getUserCarts = async (user) => {
    if (!Array.isArray(user.carts)) {
        throw new Error("El objeto de usuario no tiene una propiedad de carts válida");
    }
    const cartIds = user.carts.map(c => c.cart);
    const carts = await CartsInstance.getAll(cartIds);
    // Convertir cada carrito a un objeto JavaScript y eliminar el campo 'products'
    const transformedCarts = carts.map(cart => {
        const cartObject = cart.toObject();
        delete cartObject.products;
        return cartObject;
    });
    console.log(transformedCarts);
    return transformedCarts;
}



const getAll_Carts = async (req, res, next) => {
    passport.authenticate('jwt', { session: false }, async (err, user, info) => {
        if (err) { return next(err); }
        if (!user) { return res.status(401).send({ status: "error", error: "Unauthorized" }); }
        req.user = user;

        if (!Array.isArray(req.user.carts)) {
            req.logger(req, 'error', "El objeto de usuario no tiene una propiedad de carts válida");
            throw new Error("El objeto de usuario no tiene una propiedad de carts válida");
        }

        try {
            const cartIds = req.user.carts.map(c => c.cart);
            const carts = await CartsInstance.getAll(cartIds);

            if (carts.some(cart => !Array.isArray(cart.products))) {
                req.logger(req, 'error', "Algunos objetos del carrito no tienen una propiedad de products válida");
                throw new Error("Algunos objetos del carrito no tienen una propiedad de products válida");
            }

            const transformedCarts = await Promise.all(carts.map(async cart => {
                cart.products = await Promise.all(cart.products.map(async p => {

                    if (p.IDprod) {
                        const product = await productRepository.findById(p.IDprod);
                        if (product) {
                        // El producto existe y tiene _id
                        const productObj = product.toObject();
                        delete productObj._id;
                        return { name: p.name, price: p.price, IDprod: product._id.toString(), quantity: p.quantity, stock: p.stock };
                        } else {
                        // El producto con IDprod no existe en la base de datos
                        console.log(`El producto con IDprod ${p.IDprod} no existe en la base de datos`);
                        return null;
                        }
                    } else {
                        // El producto no tiene un IDprod
                        return null;
                    }
                    

                }));
                // Filtra cualquier producto nulo que pueda haber sido devuelto por la función map
                cart.products = cart.products.filter(product => product !== null);
                return cart;
            }));
            

            res.status(200).send({ status: 200, payload: transformedCarts });
        } catch (error) {
            console.log(error); 
            req.logger(req, 'error', `${error.message}`);
            res.status(500).send({ error: error.message });
        }
    })(req, res, next);
};


//======== { getAll_Carts / mostrar todos los carritos } ========

//======== { getID_Carts / mostrar por ID los carritos } ========
const getID_Carts = async (req, res, next) => {
    passport.authenticate('jwt', { session: false }, async (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.status(401).send({ status: "error", error: "Unauthorized" });
        }
        req.user = user;
        const { cid } = req.params;
        try {
            // Compruebe si el carrito pertenece al usuario actual.
            const cartIds = req.user.carts.map(c => c.cart.toString());
            if (!cartIds.includes(cid)) {
                req.logger(req, 'error', "Carrito no encontrado");
                return res.status(404).send({ error: 'Carrito no encontrado' });
            }

            // Consigue el carrito
            const cart = await CartsInstance.getId(cid);
            if (!cart) {
                req.logger(req, 'error', "Carrito no encontrado");
                return res.status(404).send({ error: 'Carrito no encontrado' });
            }

            // Transforma la respuesta
            const transformedCart = cart.products.map(p => ({
                id: p.product,
                quantity: p.quantity
            }));

            res.status(200).send({ status: 200, payload: [cart] });
        } catch (error) {
            req.logger(req, 'error', `${error.message}`);
            res.status(500).send({ status: "error", error });
        }
    })(req, res, next);
};
//======== { getID_Carts / mostrar por ID los carritos } =======

//======== { post_Carts / crear los carritos } =======
const post_Carts = async (req, res, next) => {
    passport.authenticate('jwt', { session: false }, async (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.status(401).send({ status: "error", error: "Unauthorized" });
        }
        req.user = user;
        const { cart } = req.body;
        try {
            // Crea el carrito
            const result = await CartsInstance.create({ cart }, req.user.email);

            // Asociar el carrito con el usuario actual
            req.user.carts.push({ cart: result._id });
            await req.user.save();

            res.status(200).send({ status: 200, payload: result });
        } catch (error) {
            req.logger(req, 'error', `${error.message}`);
            res.status(500).send({ status: "error", error });
        }
    })(req, res, next);
};
//======== { post_Carts / crear los carritos } =======

//======== { postProds_Carts / pasar productos a los carritos } =======
const postProds_Carts = async (req, res) => {
    const cartId = req.params.cid;
    const prodId = req.params.pid;
    const quantity = req.body.quantity || 1;

    if (!mongoose.Types.ObjectId.isValid(cartId) || !mongoose.Types.ObjectId.isValid(prodId)) {
        return res.status(400).send({ error: 'Invalid cartId or prodId' });
    }

    try {
        // Busca el carrito en la base de datos
        const cart = await CartsInstance.getId(cartId);

        // Verifica si el producto ya está en el carrito
        const productInCart = cart.products.find(product => product.IDprod.toString() === prodId);


        if (productInCart) {
            // Si el producto ya está en el carrito, devuelve un error
            res.status(409).send({ error: 'El producto ya está en el carrito' });
        } else {
            const updatedCart = await CartsInstance.addProductToCart(req, cartId, prodId, quantity);
            res.status(200).send({ status: 200, payload: updatedCart });
        }
    } catch (error) {
        req.logger(req, 'error', `${error.message}`);
        res.status(500).send({ error: error.message });
    }
};





//======== { postProds_Carts / pasar productos a los carritos } =======

//======== { put_Carts / actualizar los carritos } =======
const put_Carts = async (req, res) => {
    const cartId = req.params.cid;
    const sort = req.query.sort;

    try {
        const result = await CartsInstance.updateCart(req, cartId, sort, req.query.page, req.query.limit);
        res.status(200).send({ status: 200, payload: result });
    } catch (error) {
        req.logger(req, 'error', `${error.message}`);
        res.status(500).send({ error: error.message });
    }
};
//======== { put_Carts / actualizar los carritos } =======

//======== { putProds_Carts / actualizar los productos de los carritos } =======
const putProds_Carts = async (req, res) => {
    const cartId = req.params.cid;
    const productId = req.params.pid;
    const quantity = req.body.quantity || 1;

    try {
        const result = await CartsInstance.updateProductToCart(req, cartId, productId, quantity);
        res.status(200).send({ status: 200, payload: result });
    } catch (error) {
        req.logger(req, 'error', `${error.message}`);
        res.status(500).send({ error: error.message });
    }
};
//======== { putProds_Carts / actualizar los productos de los carritos } =======

//======== { deleteProdsOne_Carts / borrar un solo producto del carrito según su ID } =======
const deleteProdsOne_Carts = async (req, res) => {

    const cartId = req.params.cid;
    const productId = req.params.pid;
    const quantity = req.body.quantity || 1;

    try {
    const remainingQuantity = await CartsInstance.deleteProdsOneToCart(req, cartId, productId, quantity);
    res.status(200).send({ status: 200, payload: { id: productId, quantity: remainingQuantity } });
    }
    catch (error) {
        req.logger(req, 'error', `${error.message}`);
        res.status(500).send({ error: error.message });
    }
};
//======== { deleteProdsOne_Carts / borrar un solo producto del carrito según su ID } =======

//======== { delete_Carts / eliminar un carrito } =======
const delete_Carts = async (req, res) => {
    const { cid } = req.params; 

    try {
        const result = await CartsInstance.erase(cid);
        res.status(200).send({ status: 200, payload: result });
    }
    catch (error){
        req.logger(req, 'error', `${error.message}`);
        res.status(500).send({ status: "error", error});
    }
}; 
//======== { delete_Carts / eliminar un carrito } =======

//======== { deleteProds_Carts / borrar todos los productos de un carrito } =======
const deleteProds_Carts = async (req, res) => {
    const cartId = req.params.cid;

    try {
    const result = await CartsInstance.deleteProdsToCart(req, cartId);

    // Enviar respuesta al cliente
    res.status(200).send({ status: 200, payload: { products: [] } });
    } catch (error) {
        req.logger(req, 'error', `${error.message}`);
        res.status(500).send({ error: error.message });
    }
};
//======== { deleteProds_Carts / borrar todos los productos de un carrito } =======

//======== { deleteProds_Carts / borrar todos los productos de un carrito } =======

//======== { incrementar y decrementar cantidades } =======
const incrementQuantity_Carts = async (req, res, next) => {
    const { cartId, productId } = req.params;
    try {
        const newQuantity = await CartsInstance.incrementQuantity(cartId, productId);
        res.json({ newQuantity });
    } catch (error) {
        res.status(500).json({ error: error.toString() });
    }
};

const decrementQuantity_Carts = async (req, res, next) => {
    const { cartId, productId } = req.params;
    /* console.log('decrementQuantity_Carts', { cartId, productId });  */ // Imprime los valores de cartId y productId
    try {
        const newQuantity = await CartsInstance.decrementQuantity(cartId, productId);
        res.json({ newQuantity });
    } catch (error) {
        res.status(500).json({ error: error.toString() });
    }
};

//======== { incrementar y decrementar cantidades } =======


const purchase_Cart = async (req, res, next) => {
    passport.authenticate('jwt', { session: !1 }, async (err, user, info) => {
        if (err) { return next(err) }
        if (!user) { return res.status(401).send({ status: "error", error: "Unauthorized" }) }
        req.user = user;
        const { cid } = req.params;
        try {
            // Obtener el carrito con el id especificado
            const cartIds = req.user.carts.map(c => c.cart.toString());
            if (!cartIds.includes(cid)) {  
                req.logger(req, 'error', "Carrito no encontrado");
                return res.status(404).send({ error: 'Carrito no encontrado' }); 
            }
            const cart = await CartsInstance.getId(cid);
            if (!cart) {
                req.logger(req, 'error', "Carrito no encontrado");
                return res.status(404).send({ error: 'Carrito no encontrado' }); 
            }

            // Verificar el stock de los productos en el carrito
            let productsToPurchase = [];
            let productsOutOfStock = [];

            if (Array.isArray(cart.products)) {
                for (let product of cart.products) {
                    // Obtener la información del producto
                    const productInfo = await ProductsInstance.getID_Products(product.IDprod);
                
                    // Verificar si hay suficiente stock para el producto
                    if (product.quantity <= productInfo.stock) {
                        // Hay suficiente stock, restar la cantidad del stock del producto
                        await ProductsInstance.updateProductStock(product.id, productInfo.stock - product.quantity);
                
                        // Agregar el producto a productsToPurchase
                        productsToPurchase.push({
                            id: product.id,
                            quantity: product.quantity,
                            price: productInfo.price
                        });
                        
                    } else {
                        // No hay suficiente stock, agregar el id del producto a productsOutOfStock
                        productsOutOfStock.push(product.id);
                    }
                }
            }

            // Calcular el monto total de la compra
            let totalAmount = 0;
            for (let product of productsToPurchase) {
                totalAmount += product.price * product.quantity;
            }

            // Generar un ticket con los datos de la compra
            const ticket = await ticketServiceInstance.createTicket({
                amount: totalAmount,
                purchase_datetime: new Date(),
                purchaser: req.user.email,
                user: req.user._id,
                products: productsToPurchase
            });

            // Devolver una respuesta con el ticket y los productos que no pudieron procesarse
            res.status(200).send({
                status: 200,
                payload: {
                    ticket,
                    productsOutOfStock
                }
            });

            // Actualizar el carrito para que solo contenga los productos que no pudieron comprarse
            // Aquí debes actualizar el carrito para que solo contenga los productos en productsOutOfStock
        } catch (error) {
            req.logger(req, 'error', `${error.message}`);
            res.status(500).send({ error: error.message })
        }
    })(req, res, next)
}

export { getUserCarts, getAll_Carts, getID_Carts, post_Carts, postProds_Carts, put_Carts, putProds_Carts, deleteProdsOne_Carts, delete_Carts, deleteProds_Carts, incrementQuantity_Carts, decrementQuantity_Carts, purchase_Cart };