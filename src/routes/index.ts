import express from 'express';
import authRouter from '@auth/routes';
import messageRouter from '@messages/routes';

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

routes.use('/auth', authRouter);
routes.use('/messages', messageRouter);

export default routes;
