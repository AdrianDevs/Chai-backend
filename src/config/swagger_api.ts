import dotenv from 'dotenv';

dotenv.config({ path: process.env.ENV_FILE || '.env' });

export default {
  definition: {
    openapi: '3.1.0',
    info: {
      title: 'Chai messenger API',
      version: '0.1.0',
      description:
        'This is a simple CRUD API application made with Express and documented with Swagger',
      license: {
        name: 'MIT',
        url: 'https://spdx.org/licenses/MIT.html',
      },
      contact: {
        name: 'Adrian',
        url: 'https://www.adrianvn.me',
        email: 'adriandvn@gmail.com',
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 8080}`,
      },
    ],
  },
  apis: [
    './src/routes/index.ts',
    './src/routes/auth/routes.ts',
    './src/routes/users/routes.ts',
    './src/routes/messages/routes.ts',
  ],
};
