import express from 'express';
import createController from './controllers';
import createService from './service';
import store from './store';
import { contextLoggingMiddleware } from '@/middleware/middleware';
import { checkAuthenticated } from '@/utils';

const router = express.Router({ mergeParams: true });
const service = createService(store);
const controller = createController(service);

router.use(contextLoggingMiddleware('[conversation]'));
router.use(checkAuthenticated);

router.get('/', controller.getConversationUsers);
router.post('/', controller.addUserToConversation);
router.delete('/', controller.removeUserFromConversation);

export default router;
