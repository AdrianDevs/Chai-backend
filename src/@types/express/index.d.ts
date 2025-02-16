import { ContextLog } from '@middleware';
export {};

declare global {
  namespace Express {
    interface Request {
      context: ContextLog;
      customMessageField2?: string;
    }
    interface User {
      id: number;
      username: string;
      password: string;
      created_at: Date;
    }
  }
}
