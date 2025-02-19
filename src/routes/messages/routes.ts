import express from 'express';
import createService from './services';
import createController from './controllers';
import store from './store';
import { messageCustomFieldMiddleware } from './middleware';
import { contextLoggingMiddleware } from '@/middleware/middleware';
import { checkAuthenticated } from '@/utils';
import { Message } from '@/database/types/message';

const router = express.Router();
const serivce = createService(store);
const controller = createController(serivce);

router.use(contextLoggingMiddleware('[messages]'));
// router.use(checkAuthenticated);
router.use(checkAuthenticated);
router.use(messageCustomFieldMiddleware);

// type: object

/**
 * @swagger
 * components:
 *   schemas:
 *     Message:
 *       type: object
 *       required:
 *         - id
 *         - text
 *         - user
 *       properties:
 *         id:
 *           type: number
 *           description: The auto-generated id of the message
 *         message:
 *           type: string
 *           description: The text of the message
 *         user_name:
 *           type: string
 *           description: The username who created the message
 *         created_at:
 *           type: Date
 *           description: The date the message was created
 *       example:
 *         id: 1
 *         message: Hello World
 *         user_name: Adrian
 *         created_at: 2021-09-01T00:00:00.000Z
 */

/**
 * @swagger
 * /messages:
 *   get:
 *     summary: Get all messages
 *     description: Retrieve a list of all messages
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of messages
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Message'
 */
router.get('/', controller.getMessages);
router.get('/:id', controller.getMessageById);
router.post('/', ...controller.createMessage);

export default router;
