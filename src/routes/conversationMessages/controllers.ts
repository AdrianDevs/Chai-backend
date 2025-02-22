import asyncHandler from 'express-async-handler';
import { Message, NewMessage } from '@/database/types/message';
import { CustomError } from '@/errors';

export interface ConversationMessageServiceInterface {
  findMessagesInConversation: (
    reqUserId: number,
    convoID: number,
    limit: number,
    offset: number
  ) => Promise<Message[] | undefined>;
  addMessageToConversation: (
    reqUserId: number,
    convoID: number,
    message: NewMessage
  ) => Promise<Message | undefined>;
}

class Controller {
  private service: ConversationMessageServiceInterface;

  constructor(service: ConversationMessageServiceInterface) {
    this.service = service;
  }

  public getConversationMessages = asyncHandler(async (req, res) => {
    const userID = req.user?.id;
    const convoID = parseInt(req.params.conversation_id);
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;

    if (!userID) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (!convoID || isNaN(convoID)) {
      res.status(400).json({ message: 'Invalid request' });
      return;
    }

    try {
      const result = await this.service.findMessagesInConversation(
        userID,
        convoID,
        limit,
        offset
      );
      if (!result) {
        res
          .status(500)
          .json({ message: 'Failed to find messages in conversation' });
        return;
      }
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof CustomError) {
        res.status(error.status).json({ message: error.message });
        return;
      }
      return;
    }
  });

  public addMessageToConversation = asyncHandler(async (req, res) => {
    const userID = req.user?.id;
    const convoID = parseInt(req.params.conversation_id);
    const message = req.body as NewMessage;

    if (!userID) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (!convoID || isNaN(convoID)) {
      res.status(400).json({ message: 'Invalid request' });
      return;
    }

    if (
      !message.content ||
      !message.user_id ||
      !message.conversation_id ||
      message.content.length < 1 ||
      message.content.length > 255
    ) {
      res.status(400).json({ message: 'Invalid message' });
      return;
    }

    try {
      const result = await this.service.addMessageToConversation(
        userID,
        convoID,
        message
      );
      if (!result) {
        res
          .status(500)
          .json({ message: 'Failed to add message to conversation' });
        return;
      }
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof CustomError) {
        res.status(error.status).json({ message: error.message });
        return;
      }
      return;
    }
  });
}

const createController = (service: ConversationMessageServiceInterface) => {
  return new Controller(service);
};

export default createController;
