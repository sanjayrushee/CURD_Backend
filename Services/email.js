import nodemailer from 'nodemailer';
import configs from '../Config/dotenvconfig.js';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: configs.EMAIL_USERNAME, 
        pass: configs.EMAIL_PASSWORD, 
    },
});


export const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); 
}

export const sendVerificationEmail = async (toEmail, subject, body) => {
    const mailOptions = {
        from: configs.EMAIL_USERNAME,
        to: toEmail,
        subject: subject,
        text: body,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ' + info.response);
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Failed to send email');
    }
};

