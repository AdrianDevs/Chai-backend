import express from 'express';
import createController from './controllers';
import createService from './service';
import store from './store';
import { contextLoggingMiddleware } from '@/middleware/middleware';
import { checkAuthenticated } from '@/utils';

const router = express.Router();
const service = createService(store);
const controller = createController(service);

router.use(contextLoggingMiddleware('[conversation]'));
router.use(checkAuthenticated);

router.get('/', controller.getConversations);
router.get('/:id', controller.findConversationById);
router.post('/', controller.createConversation);
router.put('/:id', controller.updateConversation);
router.delete('/:id', controller.deleteConversation);

export default router;
