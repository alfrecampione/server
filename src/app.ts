import { type FastifyInstance } from 'fastify'
import Sensible from '@fastify/sensible'
import services from './services.js'
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';

export default async function (fastify: FastifyInstance): Promise<void> {
    await fastify.register(Sensible)

    fastify.get('/reset-password', async (request, reply) => {
        // Adjust the path if your HTML files are in a different directory
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        return reply.sendFile('reset-password.html', path.join(__dirname, '../public/pages'));
    });

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
                const jwtToken = jwt.sign({ email }, process.env.JWT_SECRET!);
                return reply.send({ jwtToken });
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
    
    // Create password reset token
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
          const { email } = request.body as { email: string };
          const success = await services.page.sendPasswordResetEmail(email);
          if (success) {
            return reply.send({ message: 'Password reset email sent successfully' });
          } else {
            return reply.status(404).send({ message: 'User not found' });
          }
        },
    });

    // Reset password
    fastify.route({
        method: 'POST',
        url: '/reset-password',
        schema: {
            tags: ['Password Reset'],
            description: 'Reset user password',
            body: {
                type: 'object',
                properties: {
                    jwt: { type: 'string' },
                    password: { type: 'string' },
                },
                required: ['jwt', 'password'],
            },
        },
        handler: async (request, reply) => {
            const { jwt: jwtToken, password } = request.body as { jwt: string, password: string };

            // Decode the JWT token
            const { email, token } = jwt.verify(jwtToken, process.env.JWT_SECRET!) as { email: string; token: string };

            // Verify token
            const tokenData = await services.token.verifyToken(token);
            if (!tokenData) {
                return reply.status(401).send({ message: 'Invalid token' });
            }

            const success = await services.user.updateUser(email, token, password);
            if (success) {
                // Delete token after successful password reset
                await services.token.deleteToken(token);
                return reply.send({ success: true, message: 'Password reset successfully' });
            } else {
                return reply.status(401).send({ message: 'Invalid token or email' });
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

    // TOKEN CRUD
    // Create token
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
            const { userId } = request.body as { userId: string; token: string };
            const createdToken = await services.token.createToken(userId);
            if (createdToken) {
                return reply.send(createdToken);
            } else {
                return reply.status(401).send({ message: 'Token already used' });
            }
        }
    });

    // Read token by userId
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
            const { userId } = request.params as { userId: string };
            const token = await services.token.verifyToken(userId);
            if (token) {
                return reply.send(token);
            } else {
                return reply.status(404).send({ message: 'Token not found' });
            }
        }
    });

    // Delete token
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
            const { userId } = request.params as { userId: string };
            const token = await services.token.deleteToken(userId);
            if (token) {
                return reply.send(token);
            } else {
                return reply.status(404).send({ message: 'Token not found' });
            }
        }
    });
}