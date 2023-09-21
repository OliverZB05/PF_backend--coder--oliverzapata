import ProductsMongo from '../dao/mongo/products.mongo.js';

let products = new ProductsMongo();

import { productModel } from "../dao/mongo/models/products.model.js";
import { generateProduct } from "../utils.js";
import { ProductDto } from '../dao/DTOs/config.dto.js';
import { transporter } from '../transporter.js';
import userModel from "../dao/dbManagers/models/users.model.js";

//======= { get_Products / productos con paginación } =======
const get_Products = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; // Número de página actual
        const limit = parseInt(req.query.limit) || 3; // Número de documentos por página
        const skip = (page - 1) * limit; // Número de documentos a omitir

        // Agregar parámetros de consulta adicionales
        const category = req.query.category;
        const availability = req.query.availability;
        const sort = req.query.sort;

        // Construir objeto de filtro
        let filter = {};
        if (category) {
            filter.category = category;
        }
        if (availability) {
            filter.stock = availability === 'available' ? { $gt: 0 } : { $eq: 0 };
        }

        // Construir objeto de opciones
        let options = { skip, limit };
        if (sort) {
            options.sort = { price: sort === 'asc' ? 1 : -1 };
        }

        // Obtener productos filtrados y ordenados
        const productsResult = await products.get_Products(filter, options);
        
        // Calcular información de paginación
        const totalProducts = await productModel.countDocuments(filter);
        const totalPages = Math.ceil(totalProducts / limit);

        const hasPrevPage = page > 1;
        const hasNextPage = page < totalPages;

        const prevPage = hasPrevPage ? page - 1 : null;
        const nextPage = hasNextPage ? page + 1 : null;

        const prevLink = hasPrevPage ? `${req.protocol}://${req.get('host')}${req.baseUrl}?page=${prevPage}&limit=${limit}` : null;
        const nextLink = hasNextPage ? `${req.protocol}://${req.get('host')}${req.baseUrl}?page=${nextPage}&limit=${limit}` : null;

        res.status(200).send({
            status: 200,
            payload: productsResult,
            totalPages,
            prevPage,
            nextPage,
            page,
            hasPrevPage,
            hasNextPage,
            prevLink,
            nextLink
        });
        
    }
    catch (error){
        req.logger(req, 'error', `${error.message}`);
        res.status(500).send({ status: "error", error});
    }
}
//======== { get_Products / productos con paginación } ========

//======== { getID_Products / productos por su ID } ========
const getID_Products = async (req, res) => {
    const { pid } = req.params; 

    try {
        const productsResult = await products.getID_Products(pid);
        res.status(200).send({ status: 200, payload: productsResult });

        //======== { TDD de getID_Products } ========
        // 1. Vefifica que devuelva el producto correcto según su id
        if(productsResult._id.toString() != pid.toString()) {
            req.logger(req, 'error', 'No devuelve los productos según su ID');
        }
        //======== { TDD de getID_Products } ========
    }
    catch (error){
        req.logger(req, 'error', `${error.message}`);
        res.status(500).send({ status: "error", error});
    }
}; 
//======== { getID_Products / productos por su ID } ========

//======== { post_Products / crear productos } ========
const post_Products = async (req, res) => {
    const { title, description, price, thumbnail, stock, category } = req.body;

    // Verificar que se reciba un error en caso de que falten campos requeridos por especificar
    if (!title || !description || !price || !thumbnail || !stock || !category) {
    let missingProperties = [];
    if (!title) missingProperties.push('title');
    if (!description) missingProperties.push('description');
    if (!price) missingProperties.push('price');
    if (!thumbnail) missingProperties.push('thumbnail');
    if (!stock) missingProperties.push('stock');
    if (!category) missingProperties.push('category');

    req.logger(
        req,
        'error',
        `Faltan especificar las siguientes propiedades: ${missingProperties.join(', ')}`
    );
    return res
        .status(400)
        .send({
        status: 'error',
        error: `Faltan las siguientes propiedades: ${missingProperties.join(', ')}`,
        });
    }

    let response;

    try {
    // Verificar si el producto no existe
    const existingProduct = await productModel.findOne({ title, description });
    if (existingProduct) {
        req.logger(req, 'error', 'Este producto ya existe');
        res.status(400).send({
        status: 'error',
        error: `El producto con título "${title}" y descripción "${description}" ya existe en la base de datos.`,
        });
    } else {
        /* console.log('req.user.email:', req.user.email); */ // Imprimir el valor de req.user.email

        const productDto = new ProductDto({
        title,
        description,
        price,
        thumbnail,
        stock,
        category,
        owner: req.user.email,
        });

        /* console.log('productDto:', productDto); */ // Imprimir el objeto productDto

        const dbProduct = { ...productDto };
        delete dbProduct['title/category'];

        const productsResult = await products.post_Products(dbProduct);

        response = { ...productDto };
        delete response.title;
        delete response.category;

        /* console.log('response:', response); */ // Imprimir el objeto response
        res.status(200).send({ status: 200, payload: response });
    }
    } catch (error) {
    req.logger(req, 'error', `${error.message}`);
    res.status(500).send({ status: 'error', error });
    }
};
//======== { post_Products / crear productos } ========

//======== { put_Products / actualizar productos } ========
const put_Products = async (req, res) => {
    const { title, description, price, thumbnail, stock, category } = req.body;
    const { pid } = req.params;

    if (!title || !description || !price || !thumbnail || !stock || !category) {
    return res
        .status(400)
        .send({ status: 'error', error: 'incomplete values' });
    }

    try {
    // Buscar el producto en la base de datos por su ID
    const product = await productModel.findById(pid);

    // Verificar si el producto existe en la base de datos
    if (!product) {
        return res.status(404).json({ message: 'Producto no encontrado' });
    }

    // Verificar si el usuario tiene permiso para actualizar el producto
    if (req.user.role === 'premium' && product.owner !== req.user.email) {
        return res.status(403).json({ message: 'No tienes permiso para realizar esta acción' });
    }

    const existingProduct = await productModel.findOne({
        _id: { $ne: pid },
        title,
        description,
    });
    if (existingProduct) {
        req.logger(
        req,
        'error',
        `El producto con título "${title}" y descripción "${description}" ya existe en la base de datos.`
        );
        res.status(400).send({
        status: 'error',
        error: `El producto con título "${title}" y descripción "${description}" ya existe en la base de datos.`,
        });
    } else {
        const productDto = new ProductDto({
        title,
        description,
        price,
        thumbnail,
        stock,
        category,
        });

        const dbProduct = { ...productDto, _id: pid };
        delete dbProduct['title/category'];

        const productsResult = await products.put_Products(pid, dbProduct);

        const response = { ...productDto };
        delete response.title;
        delete response.category;
        res.status(200).send({ status: 200, payload: response });
    }
    } catch (error) {
    req.logger(req, 'error', `${error.message}`);
    res.status(500).send({ status: 'error', error });
    }
};

//======== { put_Products / actualizar productos } ========

//======== { delete_Products / borrar productos } ========
/* const delete_Products = async (req, res) => {
    const { pid } = req.params;

    try {
    // Buscar el producto en la base de datos por su ID
    const product = await productModel.findById(pid);

    // Verificar si el producto existe en la base de datos
    if (!product) {
        return res.status(404).json({ message: 'Producto no encontrado' });
    }

    // Verificar si el usuario tiene permiso para eliminar el producto
    if (req.user.role === 'premium' && product.owner !== req.user.email) {
        return res.status(403).json({ message: 'No tienes permiso para realizar esta acción' });
    }

    const productsResult = await products.delete_Products(pid);
    res.status(200).send({ status: 200, payload: productsResult });
    } catch (error) {
    req.logger(req, 'error', `${error.message}`);
    res.status(500).send({ status: 'error', error });
    }
}; */

const delete_Products = async (req, res) => {
    const { pid } = req.params;

    try {
        // Buscar el producto en la base de datos por su ID
        const product = await productModel.findById(pid);

        // Verificar si el producto existe en la base de datos
        if (!product) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        // Verificar si el usuario tiene permiso para eliminar el producto
        if (req.user.role === 'premium' && product.owner !== req.user.email) {
            return res.status(403).json({ message: 'No tienes permiso para realizar esta acción' });
        }

        const productsResult = await products.delete_Products(pid);

        // Buscar al propietario del producto en la base de datos
        const owner = await userModel.findOne({ email: product.owner });

        // Verificar si el propietario es un usuario premium
        if (owner && owner.role === 'premium') {
            // Crear un mensaje de correo electrónico
            const message = `
            <html>
            <head>
            <title>Su producto ha sido eliminado</title>
            </head>
            <body>
            <p>Estimado/a usuario</p>
            <p>Le informamos que su producto en nuestra aplicación ha sido eliminado.</p>
            <p>Si tiene alguna pregunta, por favor comuníquese con nosotros para obtener más información.</p>
            <p>Atentamente,</p>
            <p>El equipo de soporte</p>
            </body>
            </html>
            `;

            // Enviar el correo electrónico
            await transporter.sendMail({
                from: 'Prueba',
                to: product.owner,
                subject: 'Su producto ha sido eliminado',
                html: message
            });
        }

        res.status(200).send({ status: 200, payload: productsResult });
    } catch (error) {
        req.logger(req, 'error', `${error.message}`);
        res.status(500).send({ status: 'error', error });
    }
};

//======== { delete_Products / borrar productos } ========

//======== { updateProductStock / actualizar el stock del producto } ========
const updateProductStock = async (req, res) => {
    const { pid } = req.params;
    const { newStock } = req.body;
    try {
        // Actualizar el stock del producto
        await products.updateProductStock(pid, newStock);
        res.status(200).send({ status: 200 });
    } catch (error) {
        req.logger(req, 'error', `${error.message}`);
        res.status(500).send({ status: "error", error });
    }
};
//======== { updateProductStock / actualizar el stock del producto } ========

//======== { mockingproducts / crear productos con mocks } ========
let productsCreated = 0;

const mockingproducts = async (req, res) => {
    if (productsCreated >= 50) {
        req.logger(req, 'error', "Ya se han creado 50 productos");
        return res.status(400).send({ status: "error", message: "Ya se han creado 50 productos" });
    }
    try {
        for (let i = 0; i < 50; i++) {
            const product = generateProduct();
            await products.post_Products(product);
            productsCreated++;
        }
        res.status(200).send({ status: 200, message: "Se han creado 50 productos con éxito" });
    } catch (error) {
        req.logger(req, 'error', `${error.message}`);
        res.status(500).send({ status: "error", error });
    }
};
//======== { mockingproducts / crear productos con mocks } ========

//======== { deleteMockingProducts / borrar solo los productos creados por mocks } ========
const deleteMockingProducts = async (req, res) => {
    try {
        await products.deleteMockingProducts({ isMockingProduct: true });
        res.status(200).send({ status: 200, message: "Se han eliminado los productos creados por el método mockingproducts" });
    } catch (error) {
        req.logger(req, 'error', `${error.message}`);
        res.status(500).send({ status: "error", error });
    }
};
//======== { deleteMockingProducts / borrar solo los productos creados por mocks } ========

export { get_Products, getID_Products, post_Products, put_Products, delete_Products, mockingproducts, deleteMockingProducts };
