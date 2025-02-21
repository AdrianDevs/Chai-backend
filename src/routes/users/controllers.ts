import asyncHandler from 'express-async-handler';
import { User } from '@/database/types/user';
import { Request, Response } from 'express';

export interface UserServiceInterface {
  findUserById: (id: number) => Promise<User | undefined>;
  findUserByUsername: (username: string) => Promise<User | undefined>;
}

class Controller {
  private service: UserServiceInterface;

  constructor(service: UserServiceInterface) {
    this.service = service;
  }

  public findUserById = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.user_id);

    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid user_id' });
      return;
    }

    if (id !== req.user?.id) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const user = await this.service.findUserById(id);

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.status(200).json({ id: user.id, username: user.username });
  });

  public findUserByUsername = asyncHandler(
    async (req: Request, res: Response) => {
      const username = req.query.username;

      if (!username || typeof username !== 'string') {
        res.status(400).json({ message: 'Invalid username' });
        return;
      }

      const user = await this.service.findUserByUsername(username);

      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      res.status(200).json({ id: user.id, username: user.username });
    }
  );
}

const createController = (service: UserServiceInterface) => {
  return new Controller(service);
};

export default createController;
