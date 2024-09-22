import dotenv from 'dotenv';

dotenv.config();

const configs = {
    PORT: process.env.PORT || 8000,
    MONGO_URI: process.env.MONGO_URI,
    SECRET_KEY: process.env.SECRET_KEY || 'default_secret_key',
    EMAIL_USERNAME: process.env.EMAIL_USERNAME,
    EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
};

export default configs;