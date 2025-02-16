import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import asyncHandler from 'express-async-handler';
import { links } from '@/data';
import { Message, MessageUpdate, NewMessage } from '@/database/types/message';
import { CustomError, ErrorType } from '@/errors';

export interface ServiceInterface {
  getMessages: () => Promise<Message[]>;
  findMessageById: (id: number) => Promise<Message | undefined>;
  findMessages: (criteria: Partial<Message>) => Promise<Message[]>;
  createMessage: (message: NewMessage) => Promise<Message>;
  updateMessage: (id: number, updateWith: MessageUpdate) => Promise<Message>;
  deleteMessage: (id: number) => Promise<Message | undefined>;
}

class Controller {
  private service: ServiceInterface;

  constructor(service: ServiceInterface) {
    this.service = service;
  }

  public getMessages = asyncHandler(async (req: Request, res: Response) => {
    const messages = await this.service.getMessages();
    res.render('messages', {
      links: links,
      messages: messages,
    });
  });

  public getMessageById = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const message = await this.service.findMessageById(id);
    if (message) {
      res.json(message);
    } else {
      throw new CustomError(
        `Message with id ${id} not found`,
        404,
        ErrorType.MESSAGE_NOT_FOUND
      );
    }
  });

  private static alphaErr =
    'must only contain letters and be between 3 and 10 characters';
  private static lengthErr = 'must be between 3 and 10 characters';

  private validateMessage = [
    body('user')
      .isAlpha()
      .withMessage(`Name ${Controller.alphaErr}`)
      .isLength({ min: 3, max: 10 })
      .withMessage(`Name ${Controller.lengthErr}`),
    body('text')
      .isLength({ min: 3, max: 10 })
      .withMessage(`Message ${Controller.lengthErr}`),
  ];

  public createMessage = [
    this.validateMessage,
    asyncHandler(async (req: Request, res: Response) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const messages = await this.service.getMessages();
        return res.status(400).render('messages', {
          links: links,
          messages: messages,
          errors: errors.array(),
        });
      }

      const { text } = req.body;
      const username = req.user?.username || 'unknown';
      await this.service.createMessage({ user_name: username, message: text });
      res.redirect('/messages');
    }),
  ];
}

const createController = (service: ServiceInterface) => {
  return new Controller(service);
};

export default createController;
