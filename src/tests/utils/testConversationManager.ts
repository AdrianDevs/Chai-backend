import { db } from '../../database/database';
import convoStore from '../../routes/conversation/store';
import userConvoStore from '../../routes/conversationUsers/store';
import createConversationService from '../../routes/conversation/service';
import { ConversationServiceInterface } from '../../routes/conversation/controllers';
import { Conversation } from '../../database/types/conversation';

class TestConversationManager {
  private usernamePrefix: string;
  private convoService: ConversationServiceInterface;
  private conversationIDs: number[] = [];

  public constructor(usernamePrefix: string = 'test-convo-') {
    this.usernamePrefix = usernamePrefix;
    this.convoService = createConversationService(convoStore, userConvoStore);
  }

  public createConversation = async (
    userIds: number[],
    conversationName?: string
  ): Promise<Conversation> => {
    if (!conversationName) {
      conversationName = `${this.usernamePrefix}-${Math.random().toString(36).substring(2, 15)}`;
    }
    if (userIds.length === 0) {
      throw new Error('User IDs are required');
    }

    const conversation = await this.convoService.createConversation(
      { name: conversationName },
      userIds
    );
    this.conversationIDs.push(conversation.id);
    return conversation;
  };

  public deleteConversations = async () => {
    if (this.conversationIDs && this.conversationIDs.length > 0) {
      for (const conversationID of this.conversationIDs) {
        await db
          .deleteFrom('conversation')
          .where('id', '=', conversationID)
          .executeTakeFirst();
      }
    }
  };
}

export default TestConversationManager;
