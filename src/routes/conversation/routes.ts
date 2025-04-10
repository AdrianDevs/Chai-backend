import express from 'express';
import createController from './controllers';
import createService from './service';
import convoStore from './store';
import userConvoStore from '../conversationUsers/store';
import { contextLoggingMiddleware } from '@/middleware/middleware';
import { checkAuthenticated } from '@/auth/helpers';

const router = express.Router();
const service = createService(convoStore, userConvoStore);
const controller = createController(service);

router.use(contextLoggingMiddleware('[conversation]'));
router.use(checkAuthenticated);

router.get('/', controller.getConversations);
router.get('/:id', controller.findConversationById);
router.post('/', controller.createConversation);
router.put('/:id', controller.updateConversation);
router.delete('/:id', controller.deleteConversation);

export default router;
