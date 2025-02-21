import express from 'express';
import createController from './controllers';
import createService from './service';
import store from './store';
import { contextLoggingMiddleware } from '@/middleware/middleware';
import { checkAuthenticated } from '@/utils';

const router = express.Router();
const service = createService(store);
const controller = createController(service);

router.use(contextLoggingMiddleware('[user]'));
router.use(checkAuthenticated);

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - id
 *         - username
 *       properties:
 *         id:
 *           type: number
 *           description: The auto-generated id of the user
 *         username:
 *           type: string
 *           description: The username of the user
 *       example:
 *         id: 1
 *         username: Adrian
 */

/**
 * @swagger
 * /users/search:
 *  get:
 *   summary: Search user by username
 *   description: Search user by username
 *   tags: [Users]
 *   security:
 *   - bearerAuth: []
 *   parameters:
 *   - name: username
 *     in: query
 *     required: true
 *     schema:
 *      type: string
 *   responses:
 *    404:
 *     description: User not found
 *     content:
 *      application/json:
 *       schema:
 *        $ref: '#/components/schemas/Error'
 */
router.get('/search', controller.findUserByUsername);

/**
 * @swagger
 * /users/{user_id}:
 *  get:
 *   summary: Get user by ID
 *   description: Get user by ID
 *   tags: [Users]
 *   security:
 *   - bearerAuth: []
 *   parameters:
 *   - name: user_id
 *     in: path
 *     required: true
 *     schema:
 *      type: integer
 *   responses:
 *    200:
 *     description: User found
 *     content:
 *      application/json:
 *       schema:
 *        $ref: '#/components/schemas/User'
 *    400:
 *     description: Invalid user_id
 *     content:
 *      application/json:
 *       schema:
 *        $ref: '#/components/schemas/Error'
 *    403:
 *     description: Forbidden
 *     content:
 *      application/json:
 *       schema:
 *        $ref: '#/components/schemas/Error'
 *    404:
 *     description: User not found
 *     content:
 *      application/json:
 *       schema:
 *        $ref: '#/components/schemas/Error'
 */
router.get('/:user_id', controller.findUserById);

export default router;
