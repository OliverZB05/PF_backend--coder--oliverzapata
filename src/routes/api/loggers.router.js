import { Router } from 'express';
import { LogTests } from "../../service/logs.service.js";

const router = Router();

//======== { Método de logs } ========
router.get('/loggerTest', (req, res) => {
    LogTests(req, res, ['debug', 'http', 'info', 'warning', 'error', 'fatal']);
});
//======== { Método de logs } ========

export default router;