import mongoose from 'mongoose';

const productsCollection = 'products';

//========={ Esquema de products }=========
const productSchema = new mongoose.Schema({
title: {
    type: String,
    required: true
},
description: {
    type: String,
    required: true
},
price: {
    type: Number,
    required: true
},
thumbnail: {
    type: Array,
    default: []
},
stock: {
    type: Number,
    required: true
},
category: {
    type: String,
    required: true
},
status: {
    type: Boolean,
    default: true
},
code: {
    type: Boolean,
    default: true
},
isMockingProduct: {
    type: Boolean,
    default: true
},
owner: {
    type: String,
    default: 'admin'
}
});
//========={ Esquema de products }=========

// Aquí es donde registras tu esquema con Mongoose
mongoose.model('Product', productSchema);

// Y aquí es donde exportas el modelo para que pueda ser utilizado en otros archivos
export const productModel = mongoose.model('Product');
