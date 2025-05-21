import Sensible from '@fastify/sensible';
import services from './services.js';
export default async function (fastify) {
    await fastify.register(Sensible);
    fastify.route({
        method: 'POST',
        url: '/login',
        schema: {
            tags: ['Login'],
            description: 'Login user',
            body: {
                type: 'object',
                properties: {
                    email: { type: 'string' },
                    password: { type: 'string' },
                },
                required: ['email', 'password'],
            },
        },
        handler: async (request, reply) => {
            const { email, password } = request.body;
            const user = await services.page.login(email, password);
            if (user) {
                const token = fastify.jwt.sign({ email: user.email, id: user.id });
                return reply.send({ token });
            }
            else {
                return reply.status(401).send({ message: 'Invalid credentials' });
            }
        }
    });
    fastify.route({
        method: 'POST',
        url: '/register',
        schema: {
            tags: ['Register'],
            description: 'Register user',
            body: {
                type: 'object',
                properties: {
                    email: { type: 'string' },
                    name: { type: 'string' },
                    password: { type: 'string' },
                },
                required: ['email', 'name', 'password'],
            },
        },
        handler: async (request, reply) => {
            const { email, name, password } = request.body;
            const user = await services.page.register(email, name, password);
            if (user) {
                return reply.send(user);
            }
            else {
                return reply.status(401).send({ message: 'Email already used' });
            }
        }
    });
    fastify.route({
        method: 'POST',
        url: '/forgot-password',
        schema: {
            tags: ['Password Reset'],
            description: 'Request a password reset email',
            body: {
                type: 'object',
                properties: {
                    email: { type: 'string' },
                },
                required: ['email'],
            },
        },
        handler: async (request, reply) => {
            const { email } = request.body;
            const success = await services.page.sendPasswordResetEmail(email);
            if (success) {
                return reply.send({ message: 'Password reset email sent successfully' });
            }
            else {
                return reply.status(404).send({ message: 'User not found' });
            }
        },
    });
    fastify.route({
        method: 'POST',
        url: '/reset-password',
        schema: {
            tags: ['Password Reset'],
            description: 'Reset user password',
            body: {
                type: 'object',
                properties: {
                    email: { type: 'string' },
                    token: { type: 'string' },
                    newPassword: { type: 'string' },
                },
                required: ['email', 'token', 'newPassword'],
            },
        },
        handler: async (request, reply) => {
            const { email, token, newPassword } = request.body;
            const tokenData = await services.token.verifyToken(token);
            if (!tokenData) {
                return reply.status(401).send({ message: 'Invalid token' });
            }
            const success = await services.user.updateUser(email, token, newPassword);
            if (success) {
                await services.token.deleteToken(token);
                return reply.send({ message: 'Password reset successfully' });
            }
            else {
                return reply.status(401).send({ message: 'Invalid token or email' });
            }
        }
    });
    fastify.route({
        method: 'POST',
        url: '/users',
        schema: {
            tags: ['User'],
            description: 'Create user',
            body: {
                type: 'object',
                properties: {
                    email: { type: 'string' },
                    name: { type: 'string' },
                    password: { type: 'string' },
                },
                required: ['email', 'name', 'password'],
            }
        },
        handler: async (request, reply) => {
            const { email, name, password } = request.body;
            const user = await services.user.createUser(email, name, password);
            if (user) {
                return reply.send(user);
            }
            else {
                return reply.status(401).send({ message: 'Email already used' });
            }
        }
    });
    fastify.route({
        method: 'GET',
        url: '/users/:email',
        schema: {
            tags: ['User'],
            description: 'Get user by email',
            params: {
                type: 'object',
                properties: {
                    email: { type: 'string' },
                },
                required: ['email'],
            }
        },
        handler: async (request, reply) => {
            const { email } = request.params;
            const user = await services.user.getUserByEmail(email);
            if (user) {
                return reply.send(user);
            }
            else {
                return reply.status(404).send({ message: 'User not found' });
            }
        }
    });
    fastify.route({
        method: 'PUT',
        url: '/users',
        schema: {
            tags: ['User'],
            description: 'Change user',
            params: {
                type: 'object',
                properties: {
                    email: { type: 'string' },
                    name: { type: 'string' },
                    password: { type: 'string' },
                },
                required: ['email', 'name', 'password'],
            }
        },
        handler: async (request, reply) => {
            const { email, name, password } = request.body;
            const user = await services.user.updateUser(email, name, password);
            if (user) {
                return reply.send(user);
            }
            else {
                return reply.status(404).send({ message: 'User not found' });
            }
        }
    });
    fastify.route({
        method: 'DELETE',
        url: '/users/:email',
        schema: {
            tags: ['User'],
            description: 'Delete user',
            params: {
                type: 'object',
                properties: {
                    email: { type: 'string' },
                },
                required: ['email'],
            }
        },
        handler: async (request, reply) => {
            const { email } = request.params;
            const user = await services.user.deleteUser(email);
            if (user) {
                return reply.send(user);
            }
            else {
                return reply.status(404).send({ message: 'User not found' });
            }
        }
    });
    fastify.route({
        method: 'GET',
        url: '/users',
        schema: {
            tags: ['User'],
            description: 'Get all users',
        },
        handler: async (request, reply) => {
            const users = await services.user.getAllUsers();
            return reply.send(users);
        }
    });
    fastify.route({
        method: 'POST',
        url: '/tokens',
        schema: {
            tags: ['Token'],
            description: 'Create token',
            body: {
                type: 'object',
                properties: {
                    userId: { type: 'string' },
                },
                required: ['userId'],
            }
        },
        handler: async (request, reply) => {
            const { userId } = request.body;
            const createdToken = await services.token.createToken(userId);
            if (createdToken) {
                return reply.send(createdToken);
            }
            else {
                return reply.status(401).send({ message: 'Token already used' });
            }
        }
    });
    fastify.route({
        method: 'GET',
        url: '/tokens/:userId',
        schema: {
            tags: ['Token'],
            description: 'Get token by userId',
            params: {
                type: 'object',
                properties: {
                    userId: { type: 'string' },
                },
                required: ['userId'],
            }
        },
        handler: async (request, reply) => {
            const { userId } = request.params;
            const token = await services.token.verifyToken(userId);
            if (token) {
                return reply.send(token);
            }
            else {
                return reply.status(404).send({ message: 'Token not found' });
            }
        }
    });
    fastify.route({
        method: 'DELETE',
        url: '/tokens/:userId',
        schema: {
            tags: ['Token'],
            description: 'Delete token',
            params: {
                type: 'object',
                properties: {
                    userId: { type: 'string' },
                },
                required: ['userId'],
            }
        },
        handler: async (request, reply) => {
            const { userId } = request.params;
            const token = await services.token.deleteToken(userId);
            if (token) {
                return reply.send(token);
            }
            else {
                return reply.status(404).send({ message: 'Token not found' });
            }
        }
    });
}
//# sourceMappingURL=app.js.map