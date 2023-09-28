import passport from 'passport';
import { Router } from 'express';
import { getAllCarts, getIDCarts, postCarts, postProdsCarts, putCarts, putProdsCarts, deleteProdsOneCarts, deleteCarts, deleteProdsCarts, incrementQuantityCarts, decrementQuantityCarts, purchaseCart } from '../../controllers/carts.controller.js';
const router = Router();

//======== { Métodos GET } ========
router.get('/getAll', getAllCarts); 
router.get('/:cid', getIDCarts); 
//======== { Métodos GET } ========

//======== { Métodos POST } ========
router.post('/', postCarts); 

const isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ message: 'Error: El usuario no ha iniciado sesión' });
}

const isUserOrPremium = (req, res, next) => {
    if (req.user.role === 'user' || req.user.role === 'premium') {  
        return next();
    }
    res.status(403).json({ message: 'Error: Debes tener el rol user o premium para pasar productos al carrito' });
}
router.post('/:cid/product/:pid', passport.authenticate('jwt', { session: false }), isLoggedIn, isUserOrPremium, postProdsCarts); 
router.post('/:cid/purchase', purchaseCart); 
//======== { Métodos POST } ========

//======== { Métodos PUT } ========
router.put('/:cid', putCarts);
router.put('/:cid/product/:pid', putProdsCarts); 
//======== { Métodos PUT } ========

//======== { Métodos DELETE } ========
router.delete('/:cid/product/:pid', deleteProdsOneCarts); 
router.delete('/deleteCart/:cid', deleteCarts);
router.delete('/:cid', deleteProdsCarts);  
//======== { Métodos DELETE } ========

//======== { Métodos para incrementar cantidades } ========
router.post('/:cartId/product/:productId/increment', incrementQuantityCarts);
router.post('/:cartId/product/:productId/decrement', decrementQuantityCarts);
//======== { Métodos para incrementar cantidades } ========

export default router;