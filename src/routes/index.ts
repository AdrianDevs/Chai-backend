import express from 'express';
import authRouter from '@auth/routes';
import messageRouter from '@messages/routes';

const routes = express.Router();

/**
 * @swagger
 * /:
 *   get:
 *     summary: Hello World endpoint
 *     description: A simple endpoint that returns a message
 *     responses:
 *       200:
 *         description: A message is returned
 */
routes.get('/', (req, res) => {
  res.json({
    message: 'Hello World',
  });
});

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Check the health of the API
 *     responses:
 *       200:
 *         description: The API is healthy
 */
routes.get('/health', (req, res) => {
  res.json({
    status: 'UP',
  });
});

routes.use('/auth', authRouter);
routes.use('/messages', messageRouter);

export default routes;
