import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const userCollection = 'users';

//========={ Esquema de users }=========
const userSchema = new mongoose.Schema({
    firstName: {
        type: String
    },
    lastName: {
        type: String
    },
    age: String,
    email: {
        type: String,
        required: true
    },
    password: {
        type: String
    },
    role: {
        type: String,
        default: "user"
    },

    carts: {
        type: [
            {
                cart: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'carts'
                }
            }
        ],
        ref: 'carts'
    },
    documents: [{
        name: String,
        reference: String
    }],
    lastConnection: {
        type: Date,
        default: new Date()
    }
});
//========={ Esquema de users }=========

userSchema.plugin(mongoosePaginate);


userSchema.pre('find', function () {
    this.populate('carts.cart');
});

const userModel = mongoose.model(userCollection, userSchema);
export default userModel;