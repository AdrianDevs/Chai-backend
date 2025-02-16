import express from 'express';
import createService from './service';
import createController from './controllers';
import store from './store';
import { contextLoggingMiddleware } from '@/middleware/middleware';

const router = express.Router();
const service = createService(store);
const controller = createController(service);

router.use(contextLoggingMiddleware('[user]'));

router.get('/signup', controller.showSignup);
router.post('/signup', ...controller.signup);
router.get('/login', controller.showLogin);
router.post('/login', controller.login);
router.get('/logout', controller.logout);

export default router;
