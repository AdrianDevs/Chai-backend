/* eslint-disable no-console */
import dotenv from 'dotenv';
import path from 'node:path';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import {
  handleUnauthorizedError,
  handleUnknownError,
} from '@/middleware/middleware';
import routes from '@/routes';
import cookieParser from 'cookie-parser';
import { jwtStrategy } from './auth/passport';
import passport from 'passport';
import setupWebSocket from './webSockets/setup';
import { Server } from 'ws';

console.log('[server]: Starting server');

dotenv.config({ path: process.env.ENV_FILE || '.env' });
console.log('[env]: Environment: ', process.env.ENV);
console.log('[env]: Node Environment: ', process.env.NODE_ENV);
console.log('[env]: cors-origin: ', process.env.CORS_ORIGIN);

const app = express();
const port = process.env.PORT || 8080;

const corsOptions = {
  origin: process.env.CORS_ORIGIN,
  optionsSuccessStatus: 200,
  credentials: true,
};
console.log('[cors]: corsOptions: ', corsOptions);
// app.options('*', cors(corsOptions)); // include before other routes
app.use(cors(corsOptions));

passport.use(jwtStrategy);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api-docs', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'api-docs.html'));
});

app.use(routes);

app.use(handleUnauthorizedError);
app.use(handleUnknownError);

if (process.env.ENV !== 'TEST') {
  const server = app.listen(port, () => {
    console.log(`[server]: Server is running on at http://localhost:${port}`);
  });
  // WebSocket setup
  console.log('[server]: Setup WebSocket');
  setupWebSocket(server as unknown as Server);
} else {
  console.log('[server]: Server started in test environment and not listening');
}

export default app;
