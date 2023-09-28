import { logTests } from '../service/logs.service.js';

const logTestsController = async (req, res) => {
    const levels = ['debug', 'http', 'info', 'warning', 'error', 'fatal'];
    await logTests(req, res, levels);
    res.send('Prueba de logs completada');
}

export { logTestsController };
