import mongoose from "mongoose";
import config from '../../config/config.js';
import { developmentLogger, productionLogger } from '../../logs/winston.config.js';

const URI = config.mongoUrl;

try{
    await mongoose.connect(URI);
    if (process.env.NODE_ENV === 'development') {
        developmentLogger.log('info', '***Conectado a BDD***');
    } else {
        productionLogger.log('info', '***Conectado a BDD***');
    }
} catch {
    if (process.env.NODE_ENV === 'development') {
        developmentLogger.log('error', error);
    } else {
        productionLogger.log('error', error);
    }
}