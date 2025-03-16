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

router.post('/refresh-tokens', controller.refreshTokens);

router.use(checkAuthenticated);

router.post('/revoke-tokens', controller.revokeTokens);

router.get('/token/ws', controller.getWsToken);

export default router;
