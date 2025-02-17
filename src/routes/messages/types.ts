declare module 'express' {
  interface Request {
    customMessageField?: string;
  }
}
