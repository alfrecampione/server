import { PrismaClient } from '../generated/prisma/index.js';
import crypto from 'crypto';

const prisma = new PrismaClient();

const services = {
  page: {
    async login(email: string, password: string) {
      const user = await prisma.user.findUnique({ where: { email } });
      const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
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
      const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
      return prisma.user.create({
        data: { email, name, password: hashedPassword },
      });
    },
  },
  user: {
    async createUser(email: string, name: string, password: string) {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return null;
      }
      const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
      return prisma.user.create({
        data: { email, name, password: hashedPassword },
      });
    },
    async getUserByEmail(email: string) {
      return prisma.user.findUnique({ where: { email } });
    },
    async updateUser(email: string, name: string, password: string) {
      const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
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
};

export default services;