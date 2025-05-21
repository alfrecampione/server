import { type FastifyInstance } from 'fastify'
import Sensible from '@fastify/sensible'
import services from './services.js'

export default async function (fastify: FastifyInstance): Promise<void> {
    await fastify.register(Sensible)

    // Login
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
            const { email, password } = request.body as { email: string; password: string };
            const user = await services.page.login(email, password);
            if (user) {
                const token = fastify.jwt.sign({ email: user.email, id: user.id });
                return reply.send({ token });
            } else {
                return reply.status(401).send({ message: 'Invalid credentials' });
            }
        }
    });

    // Register
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
                required: ['email', 'name' ,'password'],
            },
        },
        handler: async (request, reply) => {
            const { email, name , password } = request.body as { email: string; name: string; password: string };
            const user = await services.page.register(email, name ,password);
            if (user) {
                return reply.send(user);
            } else {
                return reply.status(401).send({ message: 'Email already used' });
            }
        }
    });

    // USER CRUD
    // Create user
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
            const { email, name, password } = request.body as { email: string; name: string; password: string };
            const user = await services.user.createUser(email, name, password);
            if (user) {
                return reply.send(user);
            } else {
                return reply.status(401).send({ message: 'Email already used' });
            }
        }
    })

    // Read user by email
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
            const { email } = request.params as { email: string };
            const user = await services.user.getUserByEmail(email);
            if (user) {
                return reply.send(user);
            } else {
                return reply.status(404).send({ message: 'User not found' });
            }
        }
    })

    // Update user
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
            const { email, name, password } = request.body as { email: string; name: string; password: string };
            const user = await services.user.updateUser(email, name, password);
            if (user) {
                return reply.send(user);
            } else {
                return reply.status(404).send({ message: 'User not found' });
            }
        }
    })

    // Delete user
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
            const { email } = request.params as { email: string };
            const user = await services.user.deleteUser(email);
            if (user) {
                return reply.send(user);
            } else {
                return reply.status(404).send({ message: 'User not found' });
            }
        }
    })


    // Get all users
    fastify.route({
        method: 'GET',
        url: '/users',
        schema: {
            tags: ['User'],
            description: 'Get all users',
        },
        handler: async (request,reply) => {
            const users = await services.user.getAllUsers();
            return reply.send(users);
        }
    });
}