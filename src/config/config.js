import dotenv from 'dotenv';

dotenv.config();

export default{
    node_env: process.env.NODE_ENV,
    mongoUrl: process.env.MONGO_URL,
    adminEmail: process.env.ADMIN_EMAIL,
    adminPassword: process.env.ADMIN_PASSWORD,
    nodeTlsRejectUnauthorized: process.env.NODE_TLS_REJECT_UNAUTHORIZED
}