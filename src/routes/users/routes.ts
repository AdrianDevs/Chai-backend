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

// Public routes
router.get('/validate', controller.validateUsernameStatus);

// Protected routes
router.use(checkAuthenticated);
router.get('/search', controller.findUsersFromUsernames);
router.get('/:id', controller.findUserById);

export default router;
