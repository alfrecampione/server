import { PrismaClient } from '../generated/prisma/index.js';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
const prisma = new PrismaClient();
const mail = process.env.MAIL;
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: mail,
        pass: process.env.MAIL_PASSWORD,
    },
});
export async function sendEmail(to, subject, text) {
    const mailOptions = {
        from: mail,
        to,
        subject,
        text,
    };
    await transporter.sendMail(mailOptions);
}
const services = {
    page: {
        async login(email, password) {
            const user = await prisma.user.findUnique({ where: { email } });
            const hashedPassword = crypto.createHash('sha512').update(password).digest('hex');
            if (user && user.password === hashedPassword) {
                return user;
            }
            return null;
        },
        async register(email, name, password) {
            const existingUser = await prisma.user.findUnique({ where: { email } });
            if (existingUser) {
                return null;
            }
            const hashedPassword = crypto.createHash('sha512').update(password).digest('hex');
            return prisma.user.create({
                data: { email, name, password: hashedPassword },
            });
        },
        async sendPasswordResetEmail(email) {
            const user = await prisma.user.findUnique({ where: { email } });
            if (!user) {
                return false;
            }
            const token = await services.token.createToken(user.id.toString());
            const baseUrl = process.env.APP_BASE_URL || 'http://localhost:8081';
            const resetLink = `${baseUrl}/reset-password?email=${encodeURIComponent(email)}&token=${token}`;
            const subject = 'Password Reset Request';
            const text = `You requested a password reset. Click the link below to reset your password:\n\n${resetLink}`;
            try {
                await sendEmail(email, subject, text);
                return true;
            }
            catch (error) {
                console.error('Error sending email:', error);
                return false;
            }
        },
    },
    user: {
        async getUserByEmail(email) {
            return prisma.user.findUnique({ where: { email } });
        },
        async createUser(email, name, password) {
            const existingUser = await services.user.getUserByEmail(email);
            if (existingUser) {
                return null;
            }
            const hashedPassword = crypto.createHash('sha512').update(password).digest('hex');
            return prisma.user.create({
                data: { email, name, password: hashedPassword },
            });
        },
        async updateUser(email, name, password) {
            const existingUser = await services.user.getUserByEmail(email);
            if (existingUser) {
                return null;
            }
            const hashedPassword = crypto.createHash('sha512').update(password).digest('hex');
            return prisma.user.update({
                where: { email },
                data: { name, password: hashedPassword },
            });
        },
        async deleteUser(email) {
            return prisma.user.delete({ where: { email } });
        },
        async getAllUsers() {
            return prisma.user.findMany();
        },
    },
    token: {
        async verifyToken(token) {
            const tokenRecord = await prisma.passwordResetToken.findUnique({ where: { token } });
            if (!tokenRecord) {
                return null;
            }
            return tokenRecord;
        },
        async createToken(userId) {
            const existingToken = await prisma.passwordResetToken.findUnique({
                where: { userId: parseInt(userId, 10) },
            });
            if (existingToken) {
                return existingToken.token;
            }
            const token = crypto.randomBytes(32).toString('hex');
            await prisma.passwordResetToken.create({
                data: {
                    userId: parseInt(userId, 10),
                    token
                },
            });
            return token;
        },
        async deleteToken(token) {
            const tokenRecord = await services.token.verifyToken(token);
            if (!tokenRecord) {
                return null;
            }
            return prisma.passwordResetToken.delete({ where: { token } });
        },
    }
};
export default services;
//# sourceMappingURL=services.js.map