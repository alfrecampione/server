import { PrismaClient } from '../generated/prisma/index.js';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

const mail = process.env.EMAIL_USER;
const password = process.env.MAIL_PASSWORD;

if (!mail || !password) {
  throw new Error('EMAIL_USER o MAIL_PASSWORD no están definidos en las variables de entorno');
}

export const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: mail,
    pass: password,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Error verificando conexión con Gmail SMTP:', error);
  } else {
    console.log('✅ Conexión SMTP lista. Puedes enviar correos con Gmail.');
  }
});

export async function sendEmail(to: string, subject: string, text: string) {
  const mailOptions = {
    from: mail,
    to,
    subject,
    text,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Correo enviado:', info.messageId);
  } catch (error) {
    console.error('❌ Error al enviar el correo:', error);
    throw error;
  }
}

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
      const baseUrlFromEnv = process.env.APP_BASE_URL || 'http://localhost';
      
      const port = process.env.PORT || '80';

      let baseUrl: string;

      try {
        const url = new URL(baseUrlFromEnv);
        url.port = port;
        baseUrl = url.toString().replace(/\/$/, '');
      } catch {
        baseUrl = `${baseUrlFromEnv}:${port}`;
      }

      const jwtToken = jwt.sign({ email, token }, process.env.JWT_SECRET!);

      const resetLink = `${baseUrl}/reset-password?jwt=${jwtToken}`;
      const subject = 'Password Reset Request';
      const text = `You requested a password reset. Click the link below to reset your password:\n\n${resetLink}`;
    
      try {
        await sendEmail(email, subject, text);
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
      console.log(email,name,password)
      const existingUser = await services.user.getUserByEmail(email);
      if (!existingUser) {
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
      console.log(tokenRecord)
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