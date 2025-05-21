import { PrismaClient } from '../generated/prisma/index.js';
import bcrypt from 'bcrypt';
const prisma = new PrismaClient();
const salt = 10;
const services = {
    page: {
        async login(email, password) {
            const user = await prisma.user.findUnique({ where: { email } });
            if (user && (await bcrypt.compare(password, user.password))) {
                return user;
            }
            return null;
        },
        async register(email, name, password) {
            const existingUser = await prisma.user.findUnique({ where: { email } });
            if (existingUser) {
                return null;
            }
            const hashedPassword = await bcrypt.hash(password, salt);
            return prisma.user.create({
                data: { email, name, password: hashedPassword },
            });
        },
    },
    user: {
        async createUser(email, name, password) {
            const existingUser = await prisma.user.findUnique({ where: { email } });
            if (existingUser) {
                return null;
            }
            const hashedPassword = await bcrypt.hash(password, salt);
            return prisma.user.create({
                data: { email, name, password: hashedPassword },
            });
        },
        async getUserByEmail(email) {
            return prisma.user.findUnique({ where: { email } });
        },
        async updateUser(email, name, password) {
            const hashedPassword = await bcrypt.hash(password, salt);
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
};
export default services;
//# sourceMappingURL=services.js.map