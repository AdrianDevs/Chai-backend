/* eslint-disable no-console */
import dotenv from 'dotenv';
import path from 'node:path';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUI from 'swagger-ui-express';
import {
  handleUnauthorizedError,
  handleUnknownError,
} from '@/middleware/middleware';
import routes from '@/routes';
import { jwtStrategy } from './config/passport';
import createService from './routes/auth/service';
import store from './routes/auth/store';
import passport from 'passport';
import apiOptions from './config/api';

console.log('Starting server');

dotenv.config({ path: process.env.ENV_FILE || '.env' });
console.log('Environment: ', process.env.NODE_ENV);

const app = express();
const port = process.env.PORT || 8080;

const corsOptions = {
  origin: process.env.CORS_ORIGIN,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

const service = createService(store);
const strategy = jwtStrategy(service);
passport.use(strategy);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));

const apiSpec = swaggerJsdoc(apiOptions);
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(apiSpec));

app.get('/api-spec', (req, res) => {
  // res.setHeader('Content-Type', 'application/json');
  // res.send('/api-docs.html');
  res.sendFile(path.join(__dirname, 'public', 'api-docs.html'));
});

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
