import asyncHandler from 'express-async-handler';
import {
  Conversation,
  ConversationUpdate,
  NewConversation,
} from '@/database/types/conversation';
import { CustomError } from '@/errors';

export interface ConversationServiceInterface {
  createConversation: (
    conversation: NewConversation,
    userIds: number[]
  ) => Promise<Conversation>;
  getConversations: (userId: number) => Promise<Conversation[]>;
  findConversationById: (
    userID: number,
    convoID: number
  ) => Promise<Conversation | undefined>;
  updateConversation: (
    userID: number,
    convoID: number,
    updateWith: ConversationUpdate
  ) => Promise<Conversation | undefined>;
  deleteConversation: (
    userID: number,
    convoID: number
  ) => Promise<Conversation | undefined>;
}

class Controller {
  private service: ConversationServiceInterface;

  constructor(service: ConversationServiceInterface) {
    this.service = service;
  }

  public createConversation = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const conversation = req.body.conversation as NewConversation;
    const userIds = req.body.user_ids as number[];

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (!conversation || typeof conversation !== 'object') {
      res.status(400).json({ message: 'Invalid conversation' });
      return;
    }

    if (
      !conversation.name ||
      typeof conversation.name !== 'string' ||
      conversation.name.length < 1 ||
      conversation.name.length > 255
    ) {
      res.status(400).json({ message: 'Invalid conversation name' });
      return;
    }

    if (
      !userIds ||
      !Array.isArray(userIds) ||
      userIds.length < 1 ||
      userIds.length > 12
    ) {
      res.status(400).json({ message: 'Invalid userIds' });
      return;
    }

    if (userIds.includes(userId)) {
      res
        .status(400)
        .json({ message: 'User cannot be in their own conversation' });
      return;
    }

    const createdConversation = await this.service.createConversation(
      conversation,
      [userId, ...userIds]
    );

    res.status(201).json(createdConversation);
  });

  public getConversations = asyncHandler(async (req, res) => {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const conversations = await this.service.getConversations(userId);
    res.status(200).json(conversations);
  });

  public findConversationById = asyncHandler(async (req, res, next) => {
    const userID = req.user?.id;
    const convoID = parseInt(req.params.id);

    if (!userID) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (isNaN(convoID)) {
      res.status(400).json({ message: 'Invalid conversation_id' });
      return;
    }

    try {
      const conversation = await this.service.findConversationById(
        userID,
        convoID
      );

      if (!conversation) {
        res.status(404).json({ message: 'Conversation not found' });
        return;
      }

      res.status(200).json(conversation);
    } catch (error) {
      if (error instanceof CustomError) {
        res.status(error.status).json({ message: error.message });
        return;
      }
      next(error);
    }
  });

  public updateConversation = asyncHandler(async (req, res, next) => {
    const userID = req.user?.id;
    const convoID = parseInt(req.params.id);
    const updateWith = req.body as ConversationUpdate;

    if (!userID) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (isNaN(convoID)) {
      res.status(400).json({ message: 'Invalid conversation_id' });
      return;
    }

    if (!updateWith || typeof updateWith !== 'object') {
      res.status(400).json({ message: 'Invalid update' });
      return;
    }

    if (
      !updateWith.name ||
      typeof updateWith.name !== 'string' ||
      updateWith.name.length < 1 ||
      updateWith.name.length > 255
    ) {
      res.status(400).json({ message: 'Invalid name' });
      return;
    }

    try {
      const updatedConversation = await this.service.updateConversation(
        userID,
        convoID,
        updateWith
      );

      if (!updatedConversation) {
        res.status(404).json({ message: 'Conversation not found' });
        return;
      }

      res.status(200).json(updatedConversation);
    } catch (error) {
      if (error instanceof CustomError) {
        res.status(error.status).json({ message: error.message });
        return;
      }
      next(error);
    }
  });

  public deleteConversation = asyncHandler(async (req, res, next) => {
    const userID = req.user?.id;
    const convoID = parseInt(req.params.id);

    if (!userID) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (isNaN(convoID)) {
      res.status(400).json({ message: 'Invalid conversation id' });
      return;
    }

    try {
      const deletedConversation = await this.service.deleteConversation(
        userID,
        convoID
      );

      if (!deletedConversation) {
        res.status(404).json({ message: 'Conversation not found' });
        return;
      }

      res.status(200).json(deletedConversation);
    } catch (error) {
      if (error instanceof CustomError) {
        res.status(error.status).json({ message: error.message });
        return;
      }
      next(error);
    }
  });
}

const createController = (service: ConversationServiceInterface) => {
  return new Controller(service);
};

export default createController;
