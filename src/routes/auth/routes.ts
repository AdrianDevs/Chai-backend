import express from 'express';
import createController from './controllers';
import createService from './service';
import store from '@users/store';
import { contextLoggingMiddleware } from '@/middleware/middleware';
import { checkAuthenticated } from '@/auth/helpers';

const router = express.Router();
const service = createService(store);
const controller = createController(service);

router.use(contextLoggingMiddleware('[auth]'));

router.post('/signup', controller.signup);

router.post('/login', controller.login);

router.post('/refresh-token', controller.refreshToken);

router.use(checkAuthenticated);
router.post('/revoke-token', controller.revokeToken);

export default router;
