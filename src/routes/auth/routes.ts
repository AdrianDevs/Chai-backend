import express from 'express';
import createController from './controllers';
import createService from './service';
import store from '@users/store';
import { contextLoggingMiddleware } from '@/middleware/middleware';

const router = express.Router();
const service = createService(store);
const controller = createController(service);

router.use(contextLoggingMiddleware('[auth]'));

/**
 * @swagger
 * components:
 *   schemas:
 *     Token:
 *       type: object
 *       required:
 *         - token
 *         - expires
 *       properties:
 *         token:
 *           type: string
 *           description: The JWT token
 *         expires:
 *           type: string
 *           description: The expiration date of the token
 *       example:
 *         token: <jwt_token>
 *         expires: <expiration_date>
 */

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: Create a new user
 *     description: Create a new user with the given username and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *            type: object
 *            properties:
 *             username:
 *              type: string
 *             password:
 *              type: string
 *     responses:
 *       201:
 *        description: User created
 *        content:
 *         application/json:
 *          schema:
 *           $ref: '#/components/schemas/User'
 *       400:
 *        description: Bad request
 *        content:
 *         application/json:
 *          schema:
 *           $ref: '#/components/schemas/Error'
 *       409:
 *        description: User already exists
 *        content:
 *         application/json:
 *          schema:
 *           $ref: '#/components/schemas/Error'
 */
router.post('/signup', controller.signup);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login
 *     description: Login with the given username and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                type: string
 *               user:
 *                type: string
 *     responses:
 *       200:
 *         description: User logged in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   $ref: '#/components/schemas/Token'
 *                 expiresIn:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Bad request
 *         content:
 *          application/json:
 *           schema:
 *            $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *          application/json:
 *           schema:
 *            $ref: '#/components/schemas/Error'
 */
router.post('/login', controller.login);

export default router;
