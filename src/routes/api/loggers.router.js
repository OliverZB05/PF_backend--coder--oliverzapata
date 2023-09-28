import { Router } from 'express';
import { logTestsController } from '../../controllers/logs.controller.js';

const router = Router();

//======== { Método de logs } ========
router.get('/loggerTest', logTestsController);
//======== { Método de logs } ========

export default router;
