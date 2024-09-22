import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import express from 'express'
import { userModel } from '../Models/Schemas.js';
import configs from '../Config/dotenvconfig.js';

const router = express.Router();

// Login function
router.post('/login/',async (request, response) => {
    const { email, password } = request.body;

    try {
        const userDbDetails = await userModel.findOne({ email });

        if (userDbDetails) {
            const isPasswordCorrect = await bcrypt.compare(password, userDbDetails.password);

            if (isPasswordCorrect) {
                const payload = { email, userId: userDbDetails._id };
                const jwtToken = jwt.sign(payload, configs.SECRET_KEY, { expiresIn: '10d' });
                response.json({ jwtToken });
            } else {
                response.status(400).json({ error: 'Invalid password' });
            }
        } else {
            response.status(400).json({ error: 'Invalid user' });
        }
    } catch (error) {
        console.error('Error during login:', error);
        response.status(500).json({ error: 'Internal server error' });
    }
});

// Register function
router.post('/register', async (request, response) => {
    const { email, username, password } = request.body;

    try {
        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return response.status(400).json({ error: 'User already exists' });
        }

        if (password.length < 6) {
            return response.status(400).json({ error: 'Password is too short' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new userModel({
            email,
            username,
            password: hashedPassword,
        });
        await newUser.save();

        response.status(201).json({ message: 'User created successfully' });

    } catch (error) {
        console.error('Error during registration:', error);
        response.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
