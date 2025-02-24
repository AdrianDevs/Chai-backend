import asyncHandler from 'express-async-handler';
import { CustomError } from '@/errors';

import { Info } from './types';

export interface InfoServiceInterface {
  findInfo: () => Promise<Info>;
}

class Controller {
  private service: InfoServiceInterface;

  constructor(service: InfoServiceInterface) {
    this.service = service;
  }

  public getInfo = asyncHandler(async (req, res) => {
    try {
      const result = await this.service.findInfo();
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof CustomError) {
        res.status(error.status).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: 'Failed to find info' });
    }
  });
}

const createController = (service: InfoServiceInterface) => {
  return new Controller(service);
};

export default createController;
