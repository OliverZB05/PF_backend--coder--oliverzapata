import { logMessage } from '../repositories/logs.repository.js';

const logTests = async (req, res, levels) => {
    levels.forEach(level => {
        logMessage(req, level, `mensaje de ${level}`);
    });
}

export { logTests };
