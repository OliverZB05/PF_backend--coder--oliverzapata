import mongoose from 'mongoose';

const cartsCollection = 'carts';

const cartSchema = new mongoose.Schema({
    ownerCart: String, 
    products: [
        {
            name: String,
            price: Number,
            stock: Number,
            IDprod: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },  // Indica que este campo hace referencia a la colección 'Product'
            quantity: {
                type: Number,
                default: 1
            }
        }
    ]
});

//========={ Esquema de carts }=========

const cartsModel = mongoose.model(cartsCollection, cartSchema);

export {cartsModel}