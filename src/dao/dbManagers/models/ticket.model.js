import mongoose from 'mongoose';
import userModel from "./users.model.js"

const ticketsCollection = 'tickets';

const ticketSchema = new mongoose.Schema({
    code: {
        type: String,
        unique: true,
        default: function() {
            // Generar un código único
            const timestamp = new Date().getTime().toString();
            const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            return `${timestamp}-${random}`;
        }
    },
    purchaseDatetime: {
        type: Date,
        default: Date.now
    },
    amount: Number,
    purchaser: {
        type: String,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    }
});

ticketSchema.pre('save', async function(next) {
    try {
        // Obtener la información del usuario asociado
        const user = await userModel.findById(this.user);
        if (user) {
            this.purchaser = user.email; // Asegurarse de que el modelo de usuario tenga un campo de correo electrónico
        }
        next();
    } catch (error) {
        next(error);
    }
});

// Modificar cómo se representan los documentos de Ticket cuando se convierten a JSON
ticketSchema.set('toJSON', {
    transform: (doc, ret, options) => {
        delete ret.user; // Eliminar el campo user del objeto resultante
        return ret;
    }
});

const ticketModel = mongoose.model(ticketsCollection, ticketSchema);

export default ticketModel;