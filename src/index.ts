import dotenv from 'dotenv';
import path from 'node:path';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import morgan from 'morgan';
import {
  currentUserMiddleware,
  handleUnauthorizedError,
  handleUnknownError,
} from '@/middleware/middleware';
import userRouter from '@users/routes';
import messageRouter from '@messages/routes';
import { links } from '@/data';
import { deserializeUser, localStrategy, serializeUser } from '@/utils';
import store from './users/store';
import createService from './users/service';

dotenv.config({ path: process.env.ENV_FILE || '.env' });
// eslint-disable-next-line no-console
console.log('Environment: ', process.env.NODE_ENV);

const app = express();
const port = process.env.PORT || 8080;

app.set('views', [
  path.join(__dirname, 'views'),
  path.join(__dirname, 'global/views'),
  path.join(__dirname, 'users/views'),
  path.join(__dirname, 'messages/views'),
]);
app.set('view engine', 'ejs');

const assetsPath = path.join(__dirname, 'public');
app.use(express.static(assetsPath));

//TODO: Look at https://github.com/expressjs/session for more cookie options
//TODO: Use a different cookie name
//TODO: Change secret to env variable
//TODO: Set maxAge for cookie
//TODO: Use a database to store session (consider using Redis)
//TODO: Use secure cookie in production
//TODO: Use sameSite cookie in production
//TODO: User a proxy in production
app.use(
  session({
    secret: 'cats',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true },
  })
);
app.use(passport.session());
passport.use(localStrategy(createService(store)));
passport.serializeUser(serializeUser);
passport.deserializeUser(deserializeUser);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(currentUserMiddleware);

app.get('/', (req, res) => {
  res.render('index', {
    links: links,
  });
});

app.get('/about', (req, res) => {
  res.render('about', {
    links: links,
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
  });
});

app.use('/user', userRouter);

app.use('/messages', messageRouter);

app.use(handleUnauthorizedError);
app.use(handleUnknownError);

if (process.env.NODE_ENV !== 'TEST') {
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`[server]: Server is running on at http://localhost:${port}`);
  });
} else {
  // eslint-disable-next-line no-console
  console.log('Server not started in test environment and not listening');
}

export default app;
