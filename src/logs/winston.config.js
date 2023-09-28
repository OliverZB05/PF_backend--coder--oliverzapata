import winston from 'winston';
import {__dirname} from '../utils.js';
import path from 'path';

const levels = {
    levels: {
        debug: 0,
        http: 1,
        info: 2,
        warning: 3,
        error: 4,
        fatal: 5
    }
};

const colors = {
    debug: 'blue',
    http: 'magenta',
    info: 'green',
    warning: 'yellow',
    error: 'red',
    fatal: 'red'
};

winston.addColors(colors);

const developmentLogger = winston.createLogger({
    levels: levels.levels,
    transports: [
        new winston.transports.Console({
            level: 'debug',
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        })
    ]
});

const productionLogger = winston.createLogger({
    levels: levels.levels,
    transports: [
        new winston.transports.Console({
            level: 'info',
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        }),
        new winston.transports.File({
            level: 'error',
            filename: path.join(__dirname, 'errors.log')
        })
    ]
});

export { developmentLogger, productionLogger };