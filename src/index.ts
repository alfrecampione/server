import Fastify from 'fastify'
import App from './app.js'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import cors from '@fastify/cors';
import path from 'path';
import fastifyStatic from '@fastify/static';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

if (!process.env.JWT_SECRET) {
  throw new Error('Missing JWT_SECRET in environment variables');
}

async function start(): Promise<void> {
  const fastify = Fastify({
    logger: true,
  })

  fastify.register(cors, {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  });

  await fastify.register(swagger, {
    swagger: {
      info: {
        title: 'Fastify API',
        description: 'API documentation for Fastify application',
        version: '1.0.0',
      },
      consumes: ['application/json'],
      produces: ['application/json'],
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    staticCSP: true,
    transformStaticCSP: (header) => header,
  });


  // Register static file serving
  fastify.register(fastifyStatic, {
    root: path.join(__dirname, '../public/pages'),
    prefix: '/',
  });

  await fastify.register(App)

  await fastify.listen({
    host: '0.0.0.0',
    port: 8081,
  })
}

start().catch(err => {
  console.error(err)
  process.exit(1)
})