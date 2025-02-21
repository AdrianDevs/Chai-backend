import express from 'express';
import authRouter from '@auth/routes';
import userRouter from '@users/routes';
import conversationRouter from '@conversations/routes';
import messageRouter from '@messages/routes';

const routes = express.Router();

/**
 * @swagger
 * components:
 *  schemas:
 *   Error:
 *    type: object
 *    properties:
 *     status:
 *      description: The status code of the error
 *      required: true
 *      type: number
 *     message:
 *      description: A message describing the error
 *      required: true
 *      type: string
 *     erros:
 *      description: An array of field errors
 *      required: false
 *      type: array
 *      items:
 *       type: object
 *       properties:
 *        field:
 *         type: string
 *         description: The field that caused the error
 *        message:
 *         type: string
 *         description: A message describing the field error
 *    example:
 *     status: <status_code>
 *     message: <error_message>
 *     errors:
 *     - field: <field_name>
 *       message: <error_message_for_field>
 */

/**
 * @swagger
 * /:
 *   get:
 *    summary: Hello World endpoint
 *    description: A simple endpoint that returns a message
 *    tags: [Hello World]
 *    responses:
 *     200:
 *      description: A message is returned
 */
routes.get('/', (req, res) => {
  res.json({
    message: 'Hello World',
  });
});

/**
 * @swagger
 * /health:
 *  get:
 *   summary: Health check endpoint
 *   description: Check the health of the API
 *   tags: [Health]
 *   responses:
 *    200:
 *     description: The API is healthy
 *     content:
 *      application/json:
 *       schema:
 *        type: object
 *        properties:
 *         status:
 *          type: string
 *          description: The status of the API
 *          example: UP
 */
routes.get('/health', (req, res) => {
  res.json({
    status: 'UP',
  });
});

routes.use('/auth', authRouter);
routes.use('/users', userRouter);
routes.use('/conversations', conversationRouter);
routes.use('/messages', messageRouter);

export default routes;
