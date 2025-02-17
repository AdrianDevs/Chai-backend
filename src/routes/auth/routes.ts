import express from 'express';
import createService from './service';
import createController from './controllers';
import store from './store';
import { contextLoggingMiddleware } from '@/middleware/middleware';

const router = express.Router();
const service = createService(store);
const controller = createController(service);

router.use(contextLoggingMiddleware('[user]'));

router.post('/signup', controller.signup);
router.post('/login', controller.login);

export default router;
