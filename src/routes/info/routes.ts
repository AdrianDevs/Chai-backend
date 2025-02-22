import express from 'express';
import createController from './controllers';
import createService from './service';
import userStore from '../users/store';
import convoStore from '../conversation/store';
import convoMsgStore from '../conversationMessages/store';
import { contextLoggingMiddleware } from '@/middleware/middleware';

const routes = express.Router();
const service = createService(userStore, convoStore, convoMsgStore);
const controller = createController(service);

routes.use(contextLoggingMiddleware('[info]'));

routes.get('/', controller.getInfo);

export default routes;
