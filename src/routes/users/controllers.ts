import asyncHandler from 'express-async-handler';
import { User } from '@/database/types/user';
import { Request, Response } from 'express';

export interface UserServiceInterface {
  findUserById: (id: number) => Promise<User | undefined>;
  findUserByUsername: (username: string) => Promise<User | undefined>;
  findUsersByUsernames: (usernames: string[]) => Promise<User[]>;
  deleteUser: (id: number) => Promise<User | undefined>;
}

class Controller {
  private service: UserServiceInterface;

  constructor(service: UserServiceInterface) {
    this.service = service;
  }

  public findUserById = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);

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

  public validateUsernameStatus = asyncHandler(
    async (req: Request, res: Response) => {
      const username = req.query.username;

      if (!username || typeof username !== 'string') {
        res.status(400).json({ message: 'Invalid username' });
        return;
      }

      const user = await this.service.findUserByUsername(username);

      if (user) {
        res.status(200).json({ status: 'taken' });
        return;
      } else {
        res.status(200).json({ status: 'available' });
        return;
      }
    }
  );

  public findUsersFromUsernames = asyncHandler(
    async (req: Request, res: Response) => {
      const userId = req.user?.id;
      const usernamesQuery = req.query.usernames;

      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      if (!usernamesQuery) {
        res.status(400).json({ message: 'Invalid usernames' });
        return;
      }

      let usernames: string[] = [];
      if (typeof usernamesQuery === 'string') {
        usernames = [usernamesQuery];
      } else if (Array.isArray(usernamesQuery)) {
        usernames = usernamesQuery.map((username) => String(username));
      } else {
        res.status(400).json({ message: 'Invalid usernames' });
        return;
      }

      if (usernames.length === 0) {
        res.status(400).json({ message: 'No valid usernames provided' });
        return;
      }

      const users = await this.service.findUsersByUsernames(usernames);

      res.status(200).json(
        users.map((user) => {
          return { id: user.id, username: user.username };
        })
      );
    }
  );

  public deleteUser = asyncHandler(async (req: Request, res: Response) => {
    // const id = parseInt(req.params.id);

    // if (isNaN(id)) {
    //   res.status(400).json({ message: 'Invalid user_id' });
    //   return;
    // }

    // if (id !== req.user?.id) {
    //   res.status(403).json({ message: 'Forbidden' });
    //   return;
    // }

    if (!req.user?.id) {
      res.status(400).json({ message: 'Invalid user_id' });
      return;
    }

    const user = await this.service.deleteUser(req.user.id);

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.status(200).json({ message: 'User deleted' });
  });
}

const createController = (service: UserServiceInterface) => {
  return new Controller(service);
};

export default createController;
