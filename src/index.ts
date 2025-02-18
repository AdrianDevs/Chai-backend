/* eslint-disable no-console */
import dotenv from 'dotenv';
import path from 'node:path';
import express from 'express';
import morgan from 'morgan';
import {
  handleUnauthorizedError,
  handleUnknownError,
} from '@/middleware/middleware';
import routes from '@/routes';
import { jwtStrategy } from './config/passport';
import createService from './routes/auth/service';
import store from './routes/auth/store';
import passport from 'passport';

console.log('Starting server');

dotenv.config({ path: process.env.ENV_FILE || '.env' });
console.log('Environment: ', process.env.NODE_ENV);

const app = express();
const port = process.env.PORT || 8080;

const service = createService(store);
const strategy = jwtStrategy(service);
passport.use(strategy);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
// TODO setup CORS
app.use(express.static(path.join(__dirname, 'public')));

app.use(routes);

app.use(handleUnauthorizedError);
app.use(handleUnknownError);

if (process.env.NODE_ENV !== 'TEST') {
  app.listen(port, () => {
    console.log(`[server]: Server is running on at http://localhost:${port}`);
  });
} else {
  console.log('Server started in test environment and not listening');
}

export default app;
