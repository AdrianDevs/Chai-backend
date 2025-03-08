import express from 'express';
import createController from './controllers';
import createService from './service';
import convoStore from '../conversation/store';
import convoUserStore from '../conversationUsers/store';
import convoMsgStore from './store';
import { contextLoggingMiddleware } from '@/middleware/middleware';
import { checkAuthenticated } from '@/auth/helpers';

const router = express.Router({ mergeParams: true });
const service = createService(convoStore, convoUserStore, convoMsgStore);
const controller = createController(service);

router.use(contextLoggingMiddleware('[conversation]'));
router.use(checkAuthenticated);

router.get('/', controller.getConversationMessages);
router.post('/', controller.addMessageToConversation);

export default router;
