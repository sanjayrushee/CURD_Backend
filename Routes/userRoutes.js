import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import express from 'express'
import { userModel } from '../Models/Schemas.js';
import configs from '../Config/dotenvconfig.js';
import { sendEmail,generateVerificationCode } from '../Services/email.js';

const router = express.Router();

// Login function
router.post('/login/',async (request, response) => {
    const { email, password } = request.body;

    try {
        const userDbDetails = await userModel.findOne({ email });

        if (userDbDetails) {
            const isPasswordCorrect = await bcrypt.compare(password, userDbDetails.password);

            if (isPasswordCorrect) {
                const payload = { email, username: userDbDetails.username, userId: userDbDetails._id };
                const jwtToken = jwt.sign(payload, configs.SECRET_KEY, { expiresIn: '10d' });
                console.log(jwtToken)
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
        const toEmail = email
        const subject = "You're All Set! Welcome to M15 Notes";
        const body = `
              <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Welcome to M15 Notes</title>
                </head>
                <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; color: #333;">
                    <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); padding: 20px;">
                        <h1 style="color: #4A90E2;">Welcome to M15 Notes, ${username}</h1>
                        <p style="line-height: 1.6;">Thank you for registering with us. We are excited to have you on board!</p>
                        <p style="line-height: 1.6;">Your registration is now complete, and you can start exploring all the features for organizing and managing your notes.</p>
                        <p style="line-height: 1.6;">If you have any questions or need assistance, feel free to reach out to our support team at <a href="mailto:mone5developer@gmail.com" style="color: #4A90E2; text-decoration: none;">mone5developer@gmail.com</a>.</p>
                        <div style="margin-top: 20px; border-top: 1px solid #dddddd; padding-top: 10px; font-size: 0.9em; color: #777;">
                            <p>Thank you,<br>M15 Notes Team</p>
                        </div>
                    </div>
                </body>
                </html>
                `;
        await sendEmail(toEmail, subject, body);
        response.status(201).json({ message: 'User created successfully and email sent' });

    } catch (error) {
        console.error('Error during registration and send email', error);
        response.status(500).json({ error: 'Internal server error' });
    }
});



router.post('/reset-password-request', async (request, response) => {
    const { email } = request.body;

    try {
        const user = await userModel.findOne({ email });
        if (!user) {
            return response.status(404).json({ error: 'User not found' });
        }
        const { username } = user;
        const verificationCode = generateVerificationCode();
        const subject = 'Password Reset Request';
        const body = `
            <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Password Reset Request</title>
                </head>
                <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; color: #333;">
                    <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); padding: 20px;">
                        <h1 style="color: #4A90E2;">Password Reset Request</h1>
                        <p style="line-height: 1.6;">Hello, ${username}</p>
                        <p style="line-height: 1.6;">You requested a password reset for your account. Please use the following verification code to reset your password:</p>
                        <h2 style="color: #4A90E2; text-align: center;">${verificationCode}</h2>
                        <p style="line-height: 1.6;">This code is valid for 15 minutes. If you did not request this, please ignore this email.</p>
                        <p style="line-height: 1.6;">If you have any questions or need assistance, feel free to reach out to our support team at <a href="mailto:mone5developer@gmail.com" style="color: #4A90E2; text-decoration: none;">mone5developer@gmail.com</a>.</p>
                        <div style="margin-top: 20px; border-top: 1px solid #dddddd; padding-top: 10px; font-size: 0.9em; color: #777;">
                            <p>Thank you,<br>Your Notes Team</p>
                        </div>
                    </div>
                </body>
                </html>
        `;
        await sendEmail(email, subject, body);

        user.resetCode = {
            code: verificationCode,
            expires: Date.now() + 25 * 60 * 1000, 
        };
        await user.save();

        response.status(200).json({ message: 'Verification code sent to your email' });
    } catch (error) {
        console.error('Error in password reset request:', error);
        response.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/check-verification-code', async (req, res) => {
    const { email, verificationCode } = req.body;

    try {
        const user = await userModel.findOne({ email });
        if (!user || user.resetCode.code !== verificationCode) {
            return res.status(400).json({ error: 'Invalid verification code' });
        }

        if (user.resetCode.expires < Date.now()) {
            return res.status(400).json({ error: 'Verification code has expired' });
        }

        res.status(200).json({ message: 'Verification code is valid' });
    } catch (error) {
        console.error('Error checking verification code:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


router.post('/change-password', async (request, response) => {
    const { email, newPassword } = request.body;

    try {
        const user = await userModel.findOne({ email });
        if (!user) {
            return response.status(404).json({ error: 'User not found' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.resetCode = undefined;
        await user.save();

        response.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Error changing password:', error);
        response.status(500).json({ error: 'Internal server error' });
    }
});


export default router;
