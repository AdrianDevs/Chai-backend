import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import WebSocket from 'ws';
import { TestWebSocketServer } from './helpers';
import TestUserManager from '../../tests/utils/testUserManager';
import TestConversationManager from '../../tests/utils/testConversationManager';
import { Message } from '../../database/types/message';

describe('WebSocket integration tests', () => {
  let testServer: TestWebSocketServer;
  const TEST_PORT = 3001;
  const usernamePrefix = 'test-websockets-user-';
  const conversationPrefix = 'test-websockets-convo-';
  let testUserManager: TestUserManager | null = null;
  let testConversationManager: TestConversationManager | null = null;

  beforeAll(async () => {
    testServer = new TestWebSocketServer(TEST_PORT);
    await testServer.start();
    testUserManager = new TestUserManager(usernamePrefix);
    testConversationManager = new TestConversationManager(conversationPrefix);
  });

  afterAll(async () => {
    // server.close();
    await testServer.stop();
    await testUserManager?.deleteUsers();
    await testConversationManager?.deleteConversations();
  });

  it('should connect to the WebSocket server with valid token', async () => {
    const user1 = await testUserManager?.createTestUser();
    const user2 = await testUserManager?.createTestUser();
    if (!user1 || !user2) {
      throw new Error('Failed to create test users');
    }
    const user1Tokens = await testUserManager?.loginUser(user1);
    if (!user1Tokens) {
      throw new Error('Failed to create test tokens');
    }

    const conversation = await testConversationManager?.createConversation([
      user1.id,
      user2.id,
    ]);
    if (!conversation) {
      throw new Error('Failed to create test conversation');
    }

    const baseUrl = testServer.getUrl();
    const url = `${baseUrl}/conversations/${conversation?.id}?userID=${user1.id}&token=${user1Tokens.webSocketToken}`;
    const ws = new WebSocket(url);

    return new Promise<void>((resolve, reject) => {
      ws.on('open', () => {
        expect(ws.readyState).toBe(WebSocket.OPEN);
        ws.close();
        resolve();
      });
      ws.on('error', (error) => {
        reject(error);
      });
    });
  });

  it('should reject connection with invalid token', async () => {
    const user1 = await testUserManager?.createTestUser();
    const user2 = await testUserManager?.createTestUser();
    if (!user1 || !user2) {
      throw new Error('Failed to create test users');
    }
    const user1Tokens = await testUserManager?.loginUser(user1);
    if (!user1Tokens) {
      throw new Error('Failed to create test tokens');
    }

    const conversation = await testConversationManager?.createConversation([
      user1.id,
      user2.id,
    ]);
    if (!conversation) {
      throw new Error('Failed to create test conversation');
    }

    const baseUrl = testServer.getUrl();
    const url = `${baseUrl}/conversations/${conversation?.id}?userID=${user1.id}&token=invalid`;
    const ws = new WebSocket(url);

    return new Promise<void>((resolve, reject) => {
      ws.on('error', (error) => {
        expect(error.message).toContain('401');
        resolve();
      });

      // If connection succeeds, test should fail
      ws.on('open', () => {
        reject(new Error('Connection should have failed'));
      });
    });
  });

  it('should handle authentication', async () => {
    const user1 = await testUserManager?.createTestUser();
    const user2 = await testUserManager?.createTestUser();
    if (!user1 || !user2) {
      throw new Error('Failed to create test users');
    }
    const user1Tokens = await testUserManager?.loginUser(user1);
    if (!user1Tokens) {
      throw new Error('Failed to create test tokens');
    }

    const conversation = await testConversationManager?.createConversation([
      user1.id,
      user2.id,
    ]);
    if (!conversation) {
      throw new Error('Failed to create test conversation');
    }

    const baseUrl = testServer.getUrl();
    const url = `${baseUrl}/conversations/${conversation?.id}?userID=${user1.id}&token=${user1Tokens.webSocketToken}`;
    const ws = new WebSocket(url);

    return new Promise<void>((resolve, reject) => {
      ws.on('open', () => {
        // Send auth message
        const authMessage = {
          type: 'authenticate' as const,
          token: user1Tokens.token,
          timestamp: Date.now(),
          message: 'websocket client connection request',
        };
        ws.send(JSON.stringify(authMessage));
      });

      ws.on('message', (message) => {
        const data = JSON.parse(message.toString());

        if (data.type === 'authenticate') {
          expect(data.content).toBe('authentication successful');
          expect(data.isValid).toBe(true);
          ws.close();
          resolve();
        }
      });

      ws.on('error', (error) => {
        // eslint-disable-next-line no-console
        console.error('WebSocket error:', error);
        reject(error);
      });
    });
  });

  it('should handle ping/pong mechanism', async () => {
    const user1 = await testUserManager?.createTestUser();
    const user2 = await testUserManager?.createTestUser();
    if (!user1 || !user2) {
      throw new Error('Failed to create test users');
    }
    const user1Tokens = await testUserManager?.loginUser(user1);
    if (!user1Tokens) {
      throw new Error('Failed to create test tokens');
    }

    const conversation = await testConversationManager?.createConversation([
      user1.id,
      user2.id,
    ]);
    if (!conversation) {
      throw new Error('Failed to create test conversation');
    }

    const baseUrl = testServer.getUrl();
    const url = `${baseUrl}/conversations/${conversation?.id}?userID=${user1.id}&token=${user1Tokens.webSocketToken}`;
    const ws = new WebSocket(url);

    return new Promise<void>((resolve, reject) => {
      let pingReceived = false;

      ws.on('open', () => {
        // Send auth message
        const authMessage = {
          type: 'authenticate' as const,
          token: user1Tokens.token,
          timestamp: Date.now(),
          message: 'websocket client connection request',
        };
        ws.send(JSON.stringify(authMessage));

        // Wait for a ping
        setTimeout(() => {
          if (!pingReceived) {
            reject(new Error('No ping received within timeout'));
          }
          ws.close();
          resolve();
        }, 3000); // Wait longer than ping interval
      });

      ws.on('ping', () => {
        pingReceived = true;
        ws.pong();
      });

      ws.on('error', (error) => {
        // eslint-disable-next-line no-console
        console.error('WebSocket error:', error);
        reject(error);
      });
    });
  });

  it('should handle well formed messages correctly', async () => {
    const user1 = await testUserManager?.createTestUser();
    const user2 = await testUserManager?.createTestUser();
    if (!user1 || !user2) {
      throw new Error('Failed to create test users');
    }
    const user1Tokens = await testUserManager?.loginUser(user1);
    if (!user1Tokens) {
      throw new Error('Failed to create test tokens');
    }

    const conversation = await testConversationManager?.createConversation([
      user1.id,
      user2.id,
    ]);
    if (!conversation) {
      throw new Error('Failed to create test conversation');
    }

    const baseUrl = testServer.getUrl();
    const url = `${baseUrl}/conversations/${conversation?.id}?userID=${user1.id}&token=${user1Tokens.webSocketToken}`;
    const ws = new WebSocket(url);

    return new Promise<void>((resolve, reject) => {
      let isAuthenticated = false;

      ws.on('open', () => {
        // Send auth message
        const authMessage = {
          type: 'authenticate' as const,
          token: user1Tokens.token,
          timestamp: Date.now(),
          message: 'websocket client connection request',
        };
        ws.send(JSON.stringify(authMessage));
      });

      ws.on('message', (message) => {
        const data = JSON.parse(message.toString());

        if (data.type === 'authenticate') {
          expect(data.content).toBe('authentication successful');
          expect(data.isValid).toBe(true);
          isAuthenticated = true;

          const _message: Message = {
            id: 1,
            created_at: new Date(),
            content: 'test message',
            user_id: user1.id,
            conversation_id: conversation.id,
          };

          const _data = {
            type: 'message' as const,
            message: _message,
            timestamp: Date.now(),
          };

          ws.send(JSON.stringify(_data));
        }

        if (data.type === 'message') {
          if (!isAuthenticated) {
            reject(new Error('Message received before authentication'));
          }
          expect(data.content.content).toBe('test message');
          expect(data.content.user_id).toBe(user1.id);
          expect(data.content.conversation_id).toBe(conversation.id);
          expect(data.isValid).toBe(true);
          ws.close();
          resolve();
        }
      });

      ws.on('ping', () => {
        ws.pong();
      });

      ws.on('error', (error) => {
        // eslint-disable-next-line no-console
        console.error('WebSocket error:', error);
        reject(error);
      });
    });
  });

  it('should handle malformed messages correctly', async () => {
    const user1 = await testUserManager?.createTestUser();
    const user2 = await testUserManager?.createTestUser();
    if (!user1 || !user2) {
      throw new Error('Failed to create test users');
    }
    const user1Tokens = await testUserManager?.loginUser(user1);
    if (!user1Tokens) {
      throw new Error('Failed to create test tokens');
    }

    const conversation = await testConversationManager?.createConversation([
      user1.id,
      user2.id,
    ]);
    if (!conversation) {
      throw new Error('Failed to create test conversation');
    }

    const baseUrl = testServer.getUrl();
    const url = `${baseUrl}/conversations/${conversation?.id}?userID=${user1.id}&token=${user1Tokens.webSocketToken}`;
    const ws = new WebSocket(url);

    return new Promise<void>((resolve, reject) => {
      let isAuthenticated = false;

      ws.on('open', () => {
        // Send auth message
        const authMessage = {
          type: 'authenticate' as const,
          token: user1Tokens.token,
          timestamp: Date.now(),
          message: 'websocket client connection request',
        };
        ws.send(JSON.stringify(authMessage));
      });

      ws.on('message', (message) => {
        const data = JSON.parse(message.toString());

        if (data.type === 'authenticate') {
          expect(data.content).toBe('authentication successful');
          expect(data.isValid).toBe(true);
          isAuthenticated = true;

          const _message: Message = {
            id: 1,
            created_at: new Date(),
            content: 'test message',
            user_id: user1.id,
            conversation_id: conversation.id,
          };

          const _data = {
            type: 'bad-type' as const,
            message: _message,
            timestamp: Date.now(),
          };

          ws.send(JSON.stringify(_data));
        }

        if (data.type === 'message') {
          if (!isAuthenticated) {
            reject(new Error('Message received before authentication'));
          }
          reject(
            new Error(
              'Should not a message response from a message with an invalid type'
            )
          );
          ws.close();
          resolve();
        }

        if (data.type === 'error') {
          if (!isAuthenticated) {
            reject(new Error('Error received before authentication'));
          }
          expect(data.content).toBe('unknown message type');
          expect(data.isValid).toBe(false);
          ws.close();
          resolve();
        }
      });

      ws.on('ping', () => {
        ws.pong();
      });

      ws.on('error', (error) => {
        // eslint-disable-next-line no-console
        console.error('WebSocket error:', error);
        reject(error);
      });
    });
  });

  it('should handle messages be sent before authentication', async () => {
    const user1 = await testUserManager?.createTestUser();
    const user2 = await testUserManager?.createTestUser();
    if (!user1 || !user2) {
      throw new Error('Failed to create test users');
    }
    const user1Tokens = await testUserManager?.loginUser(user1);
    if (!user1Tokens) {
      throw new Error('Failed to create test tokens');
    }

    const conversation = await testConversationManager?.createConversation([
      user1.id,
      user2.id,
    ]);
    if (!conversation) {
      throw new Error('Failed to create test conversation');
    }

    const baseUrl = testServer.getUrl();
    const url = `${baseUrl}/conversations/${conversation?.id}?userID=${user1.id}&token=${user1Tokens.webSocketToken}`;
    const ws = new WebSocket(url);

    return new Promise<void>((resolve, reject) => {
      const isAuthenticated = false;

      ws.on('open', () => {
        // Send auth message
        const _message: Message = {
          id: 1,
          created_at: new Date(),
          content: 'test message',
          user_id: user1.id,
          conversation_id: conversation.id,
        };

        const _data = {
          type: 'message' as const,
          message: _message,
          timestamp: Date.now(),
        };

        ws.send(JSON.stringify(_data));
      });

      ws.on('message', (message) => {
        const data = JSON.parse(message.toString());

        if (data.type === 'authenticate') {
          reject(new Error('Authentication should not be received'));
        }

        if (data.type === 'message') {
          if (!isAuthenticated) {
            reject(
              new Error('Message should not be received before authentication')
            );
          }
        }

        if (data.type === 'error') {
          if (isAuthenticated) {
            reject(new Error('Error received after authentication'));
          }
          expect(data.content).toBe('not authenticated');
          expect(data.isValid).toBe(false);
          ws.close();
          resolve();
        }
      });

      ws.on('ping', () => {
        ws.pong();
      });

      ws.on('error', (error) => {
        // eslint-disable-next-line no-console
        console.error('WebSocket error:', error);
        reject(error);
      });
    });
  });
});
