import express from 'express';
import createService from './services';
import createController from './controllers';
import store from './store';
import { checkAuthenticated, messageCustomFieldMiddleware } from './middleware';
import { contextLoggingMiddleware } from '@/middleware/middleware';

const router = express.Router();
const serivce = createService(store);
const controller = createController(serivce);

router.use(contextLoggingMiddleware('[messages]'));
router.use(checkAuthenticated);
router.use(messageCustomFieldMiddleware);

router.get('/', controller.getMessages);
router.get('/:id', controller.getMessageById);
router.post('/', ...controller.createMessage);

export default router;
