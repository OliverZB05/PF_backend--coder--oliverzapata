import { Router } from 'express';
import { getProducts, getIDProducts, postProducts, putProducts, deleteProducts, mockingproducts, deleteMockingProducts } from '../../controllers/products.controller.js';

const router = Router();

//======== { Métodos GET } ========
router.get('/', getProducts);  
router.get('/:pid', getIDProducts); 
//======== { Métodos GET } ========

//======== { Otros métodos } ========
router.put('/:pid', putProducts); 
router.post('/', postProducts);  
router.delete('/deleteMockingProducts', deleteMockingProducts);
router.delete('/:pid', deleteProducts); 
router.post('/mockingproducts', mockingproducts);
//======== { Otros métodos } ========

export default router;