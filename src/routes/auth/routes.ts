import express from 'express';
import createService from './service';
import createController from './controllers';
import store from './store';
import { contextLoggingMiddleware } from '@/middleware/middleware';

const router = express.Router();
const service = createService(store);
const controller = createController(service);

router.use(contextLoggingMiddleware('[user]'));

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: Create a new user
 *     description: Create a new user with the given username and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created
 *       400:
 *         description: Bad request
 *       409:
 *         description: User already exists
 */
router.post('/signup', controller.signup);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login
 *     description: Login with the given username and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User logged in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 expiresIn:
 *                   type: string
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post('/login', controller.login);

export default router;
