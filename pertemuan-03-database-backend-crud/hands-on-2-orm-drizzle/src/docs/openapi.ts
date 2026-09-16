import swaggerJsdoc from 'swagger-jsdoc';

// Spec dibangun otomatis dari anotasi `@openapi` di file route.
export const openapiSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: { title: 'Review Kantin API', version: '1.0.0' },
    servers: [{ url: 'http://localhost:3000' }],
    tags: [{ name: 'Health' }, { name: 'Stalls' }],
    components: {
      schemas: {
        StallInput: {
          type: 'object',
          required: ['ownerId', 'name'],
          properties: {
            ownerId: { type: 'integer', example: 2 },
            name: { type: 'string', example: 'Warung Baru' },
            category: { type: 'string', example: 'Nasi' },
            location: { type: 'string', example: 'Kantin FK' },
            description: { type: 'string' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts', './src/index.ts'],
});
