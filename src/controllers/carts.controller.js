import passport from 'passport';
import mongoose from 'mongoose'; 

import Products from '../service/products.service.js';
import Carts from '../service/carts.service.js';

let CartsInstance = new Carts();
let ProductsInstance = new Products();

import { createTicketController } from '../controllers/tickets.controller.js';

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
    return transformedCarts;
}


const getAllCarts = async (req, res, next) => {
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
        const transformedCarts = await CartsInstance.getAllCartsWithProducts(user, cartIds);

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
const getIDCarts = async (req, res, next) => {
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
            const cart = await CartsInstance.getCartById(user, cid);
            res.status(200).send({ status: 200, payload: cart });
        } catch (error) {
            // Manejar el error y enviar un mensaje claro
            res.status(500).send({ status: "error", error: error.message });
        }
    })(req, res, next);
};

//======== { getID_Carts / mostrar por ID los carritos } =======

//======== { post_Carts / crear los carritos } =======
const postCarts = async (req, res, next) => {
    passport.authenticate('jwt', { session: false }, async (err, user) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.status(401).send({ status: "error", error: "Unauthorized" });
        }

        const { cart } = req.body;
        try {
            const result = await CartsInstance.createCartAndAssociateWithUser(cart, user.email);
            res.status(200).send({ status: 200, payload: result });
        } catch (error) {
            req.logger(req, 'error', `${error.message}`);
            res.status(500).send({ status: "error", error: error.message });
        }
    })(req, res, next);
};
//======== { post_Carts / crear los carritos } =======

//======== { postProds_Carts / pasar productos a los carritos } =======
const postProdsCarts = async (req, res) => {
    const cartId = req.params.cid;
    const prodId = req.params.pid;
    const quantity = req.body.quantity || 1;

    if (!mongoose.Types.ObjectId.isValid(cartId) || !mongoose.Types.ObjectId.isValid(prodId)) {
        return res.status(400).send({ error: 'Invalid cartId or prodId' });
    }

    try {
        const updatedCart = await CartsInstance.addProductToCart(cartId, prodId, quantity);
        res.status(200).send({ status: 200, payload: updatedCart });
    } catch (error) {
        req.logger(req, 'error', `${error.message}`);
        res.status(500).send({ error: error.message });
    }
};
//======== { postProds_Carts / pasar productos a los carritos } =======

//======== { put_Carts / actualizar los carritos } =======
const putCarts = async (req, res) => {
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
const putProdsCarts = async (req, res) => {
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
const deleteProdsOneCarts = async (req, res) => {

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
const deleteCarts = async (req, res) => {
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
const deleteProdsCarts = async (req, res) => {
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
const incrementQuantityCarts = async (req, res, next) => {
    const { cartId, productId } = req.params;
    try {
        const newQuantity = await CartsInstance.incrementQuantity(cartId, productId);
        res.json({ newQuantity });
    } catch (error) {
        res.status(500).json({ error: error.toString() });
    }
};

const decrementQuantityCarts = async (req, res, next) => {
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

const purchaseCart = async (req, res, next) => {
    passport.authenticate('jwt', { session: false }, async (err, user, info) => {
        if (err) { return next(err); }
        if (!user) { return res.status(401).send({ status: "error", error: "Unauthorized" }); }
        req.user = user;
        const { cid } = req.params;
        try {
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
            let productsToPurchase = [];
            let productsOutOfStock = [];
            if (Array.isArray(cart.products)) {
                for (let product of cart.products) {
                    const productInfo = await ProductsInstance.getIDProducts(product.IDprod);
                    if (product.quantity <= productInfo.stock) {
                        await ProductsInstance.updateProductStock(product.IDprod, productInfo.stock - product.quantity);
                        productsToPurchase.push({ id: product.IDprod, quantity: product.quantity, price: productInfo.price });
                    } else {
                        productsOutOfStock.push();
                    }
                }
            }
            let totalAmount = 0;
            for (let product of productsToPurchase) {
                totalAmount += product.price * product.quantity;
            }
            // Crear una nueva solicitud y respuesta para el controlador de tickets
            const ticketReq = { body: { amount: totalAmount, purchase_datetime: new Date(), purchaser: req.user.email, user: req.user._id, products: productsToPurchase } };
            const ticketRes = { json: function(ticket) { this.ticket = ticket; return ticket; } };
            await createTicketController(ticketReq, ticketRes);
            res.status(200).send({ status: 200, payload: { ticket: ticketRes.ticket, productsOutOfStock } });
        } catch (error) {
            req.logger(req, 'error', `${error.message}`);
            res.status(500).send({ error: error.message });
        }
    })(req, res, next);
}



export { getUserCarts, getAllCarts, getIDCarts, postCarts, postProdsCarts, putCarts, putProdsCarts, deleteProdsOneCarts, deleteCarts, deleteProdsCarts, incrementQuantityCarts, decrementQuantityCarts, purchaseCart };
