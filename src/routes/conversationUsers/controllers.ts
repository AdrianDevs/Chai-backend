import asyncHandler from 'express-async-handler';
import { ConversationUser } from '@/database/types/conversation';
import { CustomError } from '@/errors';

export interface ConversationUserServiceInterface {
  conversationExists: (id: number) => Promise<boolean>;
  isUserInConversation: (userID: number, convoID: number) => Promise<boolean>;
  findUsersInConversation: (
    userID: number,
    convoID: number
  ) => Promise<{ id: number; username: string }[] | undefined>;
  addUserToConversation: (
    userID: number,
    convoID: number,
    userToAddID: number
  ) => Promise<ConversationUser | undefined>;
  removeUserFromConversation: (
    userID: number,
    convoID: number,
    userToRemoveID: number
  ) => Promise<ConversationUser | undefined>;
}

class Controller {
  private service: ConversationUserServiceInterface;

  constructor(service: ConversationUserServiceInterface) {
    this.service = service;
  }

  public getConversationUsers = asyncHandler(async (req, res) => {
    const userID = req.user?.id;
    const convoID = parseInt(req.params.conversation_id);

    if (!userID) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (!convoID || isNaN(convoID)) {
      res.status(400).json({ message: 'Invalid request' });
      return;
    }

    try {
      const result = await this.service.findUsersInConversation(
        userID,
        convoID
      );
      if (!result) {
        res
          .status(500)
          .json({ message: 'Failed to find users in conversation' });
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

  public addUserToConversation = asyncHandler(async (req, res) => {
    const userID = req.user?.id;
    const convoID = parseInt(req.params.conversation_id);
    const userToAddID = parseInt(req.body.user_id);

    if (!userID) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (!convoID || isNaN(convoID) || !userToAddID || isNaN(userToAddID)) {
      res.status(400).json({ message: 'Invalid request' });
      return;
    }

    try {
      const result = await this.service.addUserToConversation(
        userID,
        convoID,
        userToAddID
      );
      if (!result) {
        res.status(500).json({ message: 'Failed to add user to conversation' });
        return;
      }
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof CustomError) {
        res.status(error.status).json({ message: error.message });
        return;
      }
      return;
    }
  });

  public removeUserFromConversation = asyncHandler(async (req, res) => {
    const userID = req.user?.id;
    const convoID = parseInt(req.params.conversation_id);
    const userToRemoveID = parseInt(req.body.user_id);

    if (!userID) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (
      !convoID ||
      isNaN(convoID) ||
      !userToRemoveID ||
      isNaN(userToRemoveID)
    ) {
      res.status(400).json({ message: 'Invalid request' });
      return;
    }

    try {
      const result = await this.service.removeUserFromConversation(
        userID,
        convoID,
        userToRemoveID
      );
      if (!result) {
        res
          .status(500)
          .json({ message: 'Failed to remove user from conversation' });
        return;
      }
    } catch (error) {
      if (error instanceof CustomError) {
        res.status(error.status).json({ message: error.message });
        return;
      }
      return;
    }
  });
}

const createController = (service: ConversationUserServiceInterface) => {
  return new Controller(service);
};

export default createController;
