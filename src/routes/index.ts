import express from 'express';
import authRouter from '@auth/routes';
import userRouter from '@users/routes';
import conversationRouter from '@/routes/conversation/routes';
import conversationUserRouter from '@/routes/conversationUsers/routes';
import conversationMessageRouter from '@/routes/conversationMessages/routes';
import infoRouter from '@/routes/info/routes';

const routes = express.Router();

routes.get('/', (req, res) => {
  res.json({
    message: 'Hello World',
  });
});

routes.get('/health', (req, res) => {
  res.json({
    status: 'UP',
  });
});

routes.use('/info', infoRouter);
routes.use('/auth', authRouter);
routes.use('/users', userRouter);
routes.use(
  '/conversations/:conversation_id/messages',
  conversationMessageRouter
);
routes.use('/conversations/:conversation_id/users', conversationUserRouter);
routes.use('/conversations', conversationRouter);

export default routes;
