import jwt from 'jsonwebtoken';
import configs from '../Config/dotenvconfig.js';

const authentication = (request, response, next) => {
    const authHeader = request.headers["authorization"];
    
    if (authHeader) {
        const jwtToken = authHeader.split(" ")[1];

        jwt.verify(jwtToken, configs.SECRET_KEY, (error, payload) => {
            if (error) {
                return response.status(401).json({ error: "Invalid JWT Token" });
            }
            request.username = payload.username;
            request.userId = payload.userId;
            next();
        });
    } else {
        return response.status(401).json({ error: "Authorization header missing" });
    }
};

export default authentication;
