import { PrismaClient } from '../generated/prisma/index.js';
import crypto from 'crypto';
import sgMail from '@sendgrid/mail';

const prisma = new PrismaClient();

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

const services = {
  page: {
    async login(email: string, password: string) {
      const user = await prisma.user.findUnique({ where: { email } });
      const hashedPassword = crypto.createHash('sha512').update(password).digest('hex');
      if (user && user.password === hashedPassword) {
        return user;
      }
      return null;
    },
    async register(email: string, name: string, password: string) {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return null;
      }
      const hashedPassword = crypto.createHash('sha512').update(password).digest('hex');
      return prisma.user.create({
        data: { email, name, password: hashedPassword },
      });
    },
    async sendPasswordResetEmail(email: string): Promise<boolean> {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return false; // User not found
      }

      // Create the respective token
      const token = await services.token.createToken(user.id.toString());

      const baseUrl = process.env.APP_BASE_URL || 'http://localhost:8081';
      const resetLink = `${baseUrl}/reset-password?email=${encodeURIComponent(email)}&token=${token}`;
      const msg = {
        to: email,
        from: process.env.SENDGRID_API_KEY!,
        subject: 'Password Reset Request',
        text: `You requested a password reset. Click the link below to reset your password:\n\n${resetLink}`,
        html: `<p>You requested a password reset. Click the link below to reset your password:</p>
               <a href="${resetLink}">Reset Password</a>`,
      };

      try {
        await sgMail.send(msg);
        return true;
      } catch (error) {
        console.error('Error sending email:', error);
        return false;
      }
    },
    
  },
  user: {
    async getUserByEmail(email: string) {
      return prisma.user.findUnique({ where: { email } });
    },
    async createUser(email: string, name: string, password: string) {
      const existingUser = await services.user.getUserByEmail(email);
      if (existingUser) {
        return null;
      }
      const hashedPassword = crypto.createHash('sha512').update(password).digest('hex');
      return prisma.user.create({
        data: { email, name, password: hashedPassword },
      });
    },
    async updateUser(email: string, name: string, password: string) {
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
    async deleteUser(email: string) {
      return prisma.user.delete({ where: { email } });
    },
    async getAllUsers() {
      return prisma.user.findMany();
    },
  },
  token: {
    async verifyToken(token: string) {
      const tokenRecord = await prisma.passwordResetToken.findUnique({ where: { token } });
      if (!tokenRecord) {
        return null;
      }
      return tokenRecord;
    },
    async createToken(userId: string) {
      const existingToken = await prisma.passwordResetToken.findUnique({
        where: { userId: parseInt(userId, 10) },
      });
      if (existingToken) {
        return existingToken.token; // Return the existing token
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
    async deleteToken(token: string) {
      const tokenRecord = await services.token.verifyToken(token);
      if (!tokenRecord) {
        return null;
      }
      return prisma.passwordResetToken.delete({ where: { token } });
    },
  }
};

export default services;