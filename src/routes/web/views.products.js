import {Router} from 'express';
import { productModel } from "../../dao/mongo/models/products.model.js";
import { cartsModel } from "../../dao/mongo/models/carts.model.js";
import passport from 'passport';

const router = Router();

// Función para obtener productos con paginación
async function getProducts(page = 1, limit = 3) {
const skip = (page - 1) * limit;
const products = await productModel.find().skip(skip).limit(limit);
const productsArray = products.map(product => product.toObject());
const totalProducts = await productModel.countDocuments();
const totalPages = Math.ceil(totalProducts / limit);

return {
    products: productsArray,
    page,
    totalPages,
    prevPage: page > 1 ? page - 1 : null,
    nextPage: page < totalPages ? page + 1 : null
};
}

// Ruta para obtener productos con autenticación JWT
router.get('/products', passport.authenticate('jwt', { session: false }), async (req, res) => {
const page = parseInt(req.query.page) || 1;
const limit = parseInt(req.query.limit) || 3;

let data = await getProducts(page, limit);

if (req.user) {
    data.user = req.user.toObject();
    data.user.name = `${data.user.first_name} ${data.user.last_name}`;
} else {
data.user = null;
}

// Convertir el ID del producto a una cadena
data.products = data.products.map(product => {
product._id = product._id.toString();
return product;
});

req.session.viewedProducts = true; // Para verificar si el usuario hiso login
res.render("products", data);
});

router.get('/carts/CartList', passport.authenticate('jwt', { session: false }), async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 3;

    const data = await getProducts(page, limit);

    if (req.user) {
        data.user = req.user.toObject();
        data.user.name = `${data.user.first_name} ${data.user.last_name}`;
    } else {
        data.user = null;
    }

    // Busca los carritos en el modelo de carritos que pertenecen al usuario activo
    const carts = await cartsModel.find({ ownerCart: req.user.email });

    // Añade los carritos a los datos que se pasan a la vista
    data.carts = carts;

    data.carts = data.carts.map(cart => {
        cart._id = cart._id.toString();
        return cart;
    });

    // Añade los IDs de los carritos a los datos que se pasan a la vista
    data.cartIds = data.carts.map(cart => cart._id).join(',');

    req.session.viewedProducts = true; // Para verificar si el usuario hiso login

    res.render("CartList", data);
});

router.get('/carts/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
    const cart = await cartsModel.findById(req.params.id);  // Obtén el carrito por su ID

    if (!cart) {
        // Maneja el caso en que no se encontró el carrito
        console.log(`No se encontró ningún carrito con el ID ${req.params.id}`);
        return res.status(404).send('Carrito no encontrado');
    }

    const cartWithIdAsString = {
        ...cart.toObject(),
        products: cart.products.map(product => {
            return {
                name: product.name,
                price: product.price,
                quantity: product.quantity,
                IDprod: product.IDprod.toString(),
                stock: product.stock
            };
        })
    };
    

    const data = { cart: cartWithIdAsString };  // Pasa el nuevo objeto carrito a la vista
    res.render("CartDetails", data);
});

// Función para obtener el carrito de compras con paginación
async function getCart(cartId, page = 1, limit = 3) {
const skip = (page - 1) * limit;
const cart = await cartsModel.findById(cartId).populate('products.product');
if (!cart) {
req.logger(req, 'error', `Carrito no encontrado`);
throw new Error('Cart not found');
}

const products = cart.products.map(p => ({
id: p.product.id,
title: p.product.title,
price: p.product.price,
quantity: p.quantity
}));
const paginatedProducts = products.slice(skip, skip + limit);
const totalProducts = products.length;
const totalPages = Math.ceil(totalProducts / limit);

return {
    products: paginatedProducts,
    page,
    totalPages,
    prevPage: page > 1 ? page - 1 : null,
    nextPage: page < totalPages ? page + 1 : null
};
}

// Ruta para obtener el carrito de compras
router.get("/carts/:cid", async (req, res) => {
const cartId = req.params.cid;
const page = parseInt(req.query.page) || 1;
const limit = parseInt(req.query.limit) || 3;

try {
    const data = await getCart(cartId, page, limit);
    res.render("cart", data);
} catch (error) {
    req.logger(req, 'error', `${error.message}`);
    res.status(404).send({ error: error.message });
}
});

export default router;
export {getProducts};
export {getCart};