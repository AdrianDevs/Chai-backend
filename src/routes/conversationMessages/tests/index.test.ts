import app from '../../../index';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { db } from '../../../database/database';
import createAuthService from '../../auth/service';
import userStore from '../../users/store';

describe('GET /conversations/:conversation_id/messages', () => {
  const usernamePrefix = 'test-convo-msg-user-';
  const userIDs: number[] = [];
  const conversationIDs: number[] = [];

  afterEach(async () => {
    if (userIDs && userIDs.length > 0) {
      for (const userID of userIDs) {
        await db.deleteFrom('user').where('id', '=', userID).execute();
      }
    }
    if (conversationIDs && conversationIDs.length > 0) {
      for (const conversationID of conversationIDs) {
        await db
          .deleteFrom('conversation')
          .where('id', '=', conversationID)
          .returningAll()
          .executeTakeFirst();
      }
    }
  });

  it('should return 400 if invalid conversation_id is provided', async () => {
    const authService = createAuthService(userStore);

    const userResponse = await authService.signup(
      `${usernamePrefix}1`,
      'password'
    );
    userIDs.push(userResponse.id);

    const loginResponse = await request(app)
      .post('/auth/login')
      .send({ username: userResponse.username, password: 'password' });

    const response = await request(app)
      .get('/conversations/wrong/messages')
      .set('Accept', 'application/json')
      .set('Authorization', `${loginResponse.body.token}`);

    expect(response.status).toBe(400);
  });

  it('should return 401 if user is not authenticated', async () => {
    const response = await request(app).get('/conversations/1/messages');
    expect(response.status).toBe(401);
  });

  it('should return 403 if user is not part of the conversation', async () => {
    const authService = createAuthService(userStore);

    const userResponse1 = await authService.signup(
      `${usernamePrefix}1`,
      'password'
    );
    userIDs.push(userResponse1.id);

    const userResponse2 = await authService.signup(
      `${usernamePrefix}2`,
      'password'
    );
    userIDs.push(userResponse2.id);

    const loginResponse1 = await request(app)
      .post('/auth/login')
      .send({ username: userResponse1.username, password: 'password' });

    const convoResponse = await request(app)
      .post('/conversations')
      .send({
        conversation: { name: 'test-user-3-convo-1' },
        user_ids: [userResponse2.id],
      })
      .set('Accept', 'application/json')
      .set('Authorization', `${loginResponse1.body.token}`);
    conversationIDs.push(convoResponse.body.id);

    const userResponse3 = await authService.signup(
      `${usernamePrefix}3`,
      'password'
    );
    userIDs.push(userResponse3.id);

    const loginResponse3 = await request(app)
      .post('/auth/login')
      .send({ username: userResponse3.username, password: 'password' });

    const response = await request(app)
      .get(`/conversations/${convoResponse.body.id}/messages`)
      .set('Accept', 'application/json')
      .set('Authorization', `${loginResponse3.body.token}`);

    expect(response.status).toBe(403);
  });

  it('should return 404 if conversation does not exist', async () => {
    const authService = createAuthService(userStore);

    const userResponse = await authService.signup(
      `${usernamePrefix}1`,
      'password'
    );
    userIDs.push(userResponse.id);

    const loginResponse = await request(app)
      .post('/auth/login')
      .send({ username: userResponse.username, password: 'password' });

    const response = await request(app)
      .get('/conversations/1/messages')
      .set('Accept', 'application/json')
      .set('Authorization', `${loginResponse.body.token}`);

    expect(response.status).toBe(404);
  });

  it('should return 200 if user is part of the conversation', async () => {
    const authService = createAuthService(userStore);

    const userResponse1 = await authService.signup(
      `${usernamePrefix}1`,
      'password'
    );
    userIDs.push(userResponse1.id);

    const userResponse2 = await authService.signup(
      `${usernamePrefix}2`,
      'password'
    );
    userIDs.push(userResponse2.id);

    const loginResponse1 = await request(app)
      .post('/auth/login')
      .send({ username: userResponse1.username, password: 'password' });

    const convoCreateResponse = await request(app)
      .post('/conversations')
      .send({
        conversation: { name: 'test-user-3-convo-1' },
        user_ids: [userResponse2.id],
      })
      .set('Accept', 'application/json')
      .set('Authorization', `${loginResponse1.body.token}`);
    conversationIDs.push(convoCreateResponse.body.id);

    await request(app)
      .post(`/conversations/${convoCreateResponse.body.id}/messages`)
      .send({
        content: 'test message 1',
        user_id: userResponse1.id,
        conversation_id: convoCreateResponse.body.id,
      })
      .set('Accept', 'application/json')
      .set('Authorization', `${loginResponse1.body.token}`);

    const loginResponse2 = await request(app)
      .post('/auth/login')
      .send({ username: userResponse2.username, password: 'password' });

    await request(app)
      .post(`/conversations/${convoCreateResponse.body.id}/messages`)
      .send({
        content: 'test message 2',
        user_id: userResponse2.id,
        conversation_id: convoCreateResponse.body.id,
      })
      .set('Accept', 'application/json')
      .set('Authorization', `${loginResponse2.body.token}`);

    const response = await request(app)
      .get(`/conversations/${convoCreateResponse.body.id}/messages`)
      .set('Accept', 'application/json')
      .set('Authorization', `${loginResponse2.body.token}`);

    expect(response.status).toBe(200);
    expect(response.body.length).toBe(2);
    expect(response.body).toContainEqual(
      expect.objectContaining({
        content: 'test message 1',
        user_id: userResponse1.id,
        conversation_id: convoCreateResponse.body.id,
      })
    );
    expect(response.body).toContainEqual(
      expect.objectContaining({
        content: 'test message 2',
        user_id: userResponse2.id,
        conversation_id: convoCreateResponse.body.id,
      })
    );
  });

  it('users last read message should be updated when they post and view messages', async () => {
    const authService = createAuthService(userStore);

    const userResponse1 = await authService.signup(
      `${usernamePrefix}1`,
      'password'
    );
    userIDs.push(userResponse1.id);

    const userResponse2 = await authService.signup(
      `${usernamePrefix}2`,
      'password'
    );
    userIDs.push(userResponse2.id);

    const loginResponse1 = await request(app)
      .post('/auth/login')
      .send({ username: userResponse1.username, password: 'password' });

    const convoCreateResponse = await request(app)
      .post('/conversations')
      .send({
        conversation: { name: 'test-message-convo-1' },
        user_ids: [userResponse2.id],
      })
      .set('Accept', 'application/json')
      .set('Authorization', `${loginResponse1.body.token}`);
    conversationIDs.push(convoCreateResponse.body.id);

    let user1 = await db
      .selectFrom('conversation_user')
      .where('conversation_id', '=', convoCreateResponse.body.id)
      .where('user_id', '=', userResponse1.id)
      .selectAll()
      .executeTakeFirst();

    expect(user1).not.toBeNull();
    if (user1) {
      expect(user1.user_id).toBe(userResponse1.id);
      expect(user1.last_read_message_id).toBeNull();
    }

    let user2 = await db
      .selectFrom('conversation_user')
      .where('conversation_id', '=', convoCreateResponse.body.id)
      .where('user_id', '=', userResponse2.id)
      .selectAll()
      .executeTakeFirst();

    expect(user2).not.toBeNull();
    if (user2) {
      expect(user2.user_id).toBe(userResponse2.id);
      expect(user2.last_read_message_id).toBeNull();
    }

    const createMessageResponse1 = await request(app)
      .post(`/conversations/${convoCreateResponse.body.id}/messages`)
      .send({
        content: 'test message 1',
        user_id: userResponse1.id,
        conversation_id: convoCreateResponse.body.id,
      })
      .set('Accept', 'application/json')
      .set('Authorization', `${loginResponse1.body.token}`);

    user1 = await db
      .selectFrom('conversation_user')
      .where('conversation_id', '=', convoCreateResponse.body.id)
      .where('user_id', '=', userResponse1.id)
      .selectAll()
      .executeTakeFirst();

    expect(user1).not.toBeNull();
    if (user1) {
      expect(user1.user_id).toBe(userResponse1.id);
      expect(user1.last_read_message_id).toBe(createMessageResponse1.body.id);
    }

    user2 = await db
      .selectFrom('conversation_user')
      .where('conversation_id', '=', convoCreateResponse.body.id)
      .where('user_id', '=', userResponse2.id)
      .selectAll()
      .executeTakeFirst();

    expect(user2).not.toBeNull();
    if (user2) {
      expect(user2.user_id).toBe(userResponse2.id);
      expect(user2.last_read_message_id).toBeNull();
    }

    const loginResponse2 = await request(app)
      .post('/auth/login')
      .send({ username: userResponse2.username, password: 'password' });

    const readMessageResponse1 = await request(app)
      .get(`/conversations/${convoCreateResponse.body.id}/messages`)
      .set('Accept', 'application/json')
      .set('Authorization', `${loginResponse2.body.token}`);

    user2 = await db
      .selectFrom('conversation_user')
      .where('conversation_id', '=', convoCreateResponse.body.id)
      .where('user_id', '=', userResponse2.id)
      .selectAll()
      .executeTakeFirst();

    expect(user2).not.toBeNull();
    if (user2) {
      expect(user2.user_id).toBe(userResponse2.id);
      expect(user2.last_read_message_id).toBe(readMessageResponse1.body[0].id);
    }
  });
});

describe('POST /conversations/:conversation_id/messages', () => {
  const usernamePrefix = 'test-convo-msg-user-';
  const userIDs: number[] = [];
  const conversationIDs: number[] = [];

  afterEach(async () => {
    if (userIDs && userIDs.length > 0) {
      for (const userID of userIDs) {
        await db.deleteFrom('user').where('id', '=', userID).execute();
      }
    }
    if (conversationIDs && conversationIDs.length > 0) {
      for (const conversationID of conversationIDs) {
        await db
          .deleteFrom('conversation')
          .where('id', '=', conversationID)
          .returningAll()
          .executeTakeFirst();
      }
    }
  });

  it('should return 400 if invalid conversation_id is provided', async () => {
    const authService = createAuthService(userStore);

    const userResponse = await authService.signup(
      `${usernamePrefix}1`,
      'password'
    );
    userIDs.push(userResponse.id);

    const loginResponse = await request(app)
      .post('/auth/login')
      .send({ username: userResponse.username, password: 'password' });

    const response = await request(app)
      .post('/conversations/wrong/messages')
      .send({ content: 'test message', user_id: userResponse.id })
      .set('Accept', 'application/json')
      .set('Authorization', `${loginResponse.body.token}`);

    expect(response.status).toBe(400);
  });

  it('should return 400 if invalid message content is provided', async () => {
    const authService = createAuthService(userStore);

    const userResponse1 = await authService.signup(
      `${usernamePrefix}1`,
      'password'
    );
    userIDs.push(userResponse1.id);

    const userResponse2 = await authService.signup(
      `${usernamePrefix}2`,
      'password'
    );
    userIDs.push(userResponse2.id);

    const loginResponse1 = await request(app)
      .post('/auth/login')
      .send({ username: userResponse1.username, password: 'password' });

    const convoCreateResponse = await request(app)
      .post('/conversations')
      .send({
        conversation: { name: 'test-user-3-convo-1' },
        user_ids: [userResponse2.id],
      })
      .set('Accept', 'application/json')
      .set('Authorization', `${loginResponse1.body.token}`);
    conversationIDs.push(convoCreateResponse.body.id);

    const response1 = await request(app)
      .post(`/conversations/${convoCreateResponse.body.id}/messages`)
      .send({ content: '', user_id: userResponse1.id })
      .set('Accept', 'application/json')
      .set('Authorization', `${loginResponse1.body.token}`);

    expect(response1.status).toBe(400);
    expect(response1.body.message).toBe('Invalid message');

    const response2 = await request(app)
      .post(`/conversations/${convoCreateResponse.body.id}/messages`)
      .send({ content: 'a'.repeat(256), user_id: userResponse1.id })
      .set('Accept', 'application/json')
      .set('Authorization', `${loginResponse1.body.token}`);

    expect(response2.status).toBe(400);
    expect(response2.body.message).toBe('Invalid message');
  });

  // it('should return 400 if conversation_id in params does not match conversation_id in body', async () => {
  //   const authService = createAuthService(userStore);

  //   const userResponse1 = await authService.signup(
  //     `${usernamePrefix}1`,
  //     'password'
  //   );
  //   userIDs.push(userResponse1.id);

  //   const userResponse2 = await authService.signup(
  //     `${usernamePrefix}2`,
  //     'password'
  //   );
  //   userIDs.push(userResponse2.id);

  //   const loginResponse1 = await request(app)
  //     .post('/auth/login')
  //     .send({ username: userResponse1.username, password: 'password' });

  //   const convoCreateResponse = await request(app)
  //     .post('/conversations')
  //     .send({
  //       conversation: { name: 'test-user-3-convo-1' },
  //       user_ids: [userResponse2.id],
  //     })
  //     .set('Accept', 'application/json')
  //     .set('Authorization', `${loginResponse1.body.token}`);
  //   conversationIDs.push(convoCreateResponse.body.id);

  //   const response = await request(app)
  //     .post(`/conversations/${convoCreateResponse.body.id}/messages`)
  //     .send({
  //       content: 'test message',
  //       user_id: userResponse1.id,
  //       conversation_id: convoCreateResponse.body.id + 1,
  //     })
  //     .set('Accept', 'application/json')
  //     .set('Authorization', `${loginResponse1.body.token}`);

  //   expect(response.status).toBe(400);
  // });

  it('should return 401 if user is not authenticated', async () => {
    const response = await request(app).post('/conversations/1/messages');
    expect(response.status).toBe(401);
  });

  it('should return 403 if user is not part of the conversation', async () => {
    const authService = createAuthService(userStore);

    const userResponse1 = await authService.signup(
      `${usernamePrefix}1`,
      'password'
    );
    userIDs.push(userResponse1.id);

    const userResponse2 = await authService.signup(
      `${usernamePrefix}2`,
      'password'
    );
    userIDs.push(userResponse2.id);

    const loginResponse1 = await request(app)
      .post('/auth/login')
      .send({ username: userResponse1.username, password: 'password' });

    const convoCreateResponse = await request(app)
      .post('/conversations')
      .send({
        conversation: { name: 'test-user-3-convo-1' },
        user_ids: [userResponse2.id],
      })
      .set('Accept', 'application/json')
      .set('Authorization', `${loginResponse1.body.token}`);
    conversationIDs.push(convoCreateResponse.body.id);

    const userResponse3 = await authService.signup(
      `${usernamePrefix}3`,
      'password'
    );
    userIDs.push(userResponse3.id);

    const loginResponse3 = await request(app)
      .post('/auth/login')
      .send({ username: userResponse3.username, password: 'password' });

    const response = await request(app)
      .post(`/conversations/${convoCreateResponse.body.id}/messages`)
      .send({
        content: 'test message',
        user_id: userResponse3.id,
        conversation_id: convoCreateResponse.body.id,
      })
      .set('Accept', 'application/json')
      .set('Authorization', `${loginResponse3.body.token}`);

    expect(response.status).toBe(403);
  });

  // it('should return 403 if user is not the author of the message', async () => {
  //   const authService = createAuthService(userStore);

  //   const userResponse1 = await authService.signup(
  //     `${usernamePrefix}1`,
  //     'password'
  //   );
  //   userIDs.push(userResponse1.id);

  //   const userResponse2 = await authService.signup(
  //     `${usernamePrefix}2`,
  //     'password'
  //   );
  //   userIDs.push(userResponse2.id);

  //   const loginResponse1 = await request(app)
  //     .post('/auth/login')
  //     .send({ username: userResponse1.username, password: 'password' });

  //   const convoCreateResponse = await request(app)
  //     .post('/conversations')
  //     .send({
  //       conversation: { name: 'test-user-3-convo-1' },
  //       user_ids: [userResponse2.id],
  //     })
  //     .set('Accept', 'application/json')
  //     .set('Authorization', `${loginResponse1.body.token}`);
  //   conversationIDs.push(convoCreateResponse.body.id);

  //   const loginResponse2 = await request(app)
  //     .post('/auth/login')
  //     .send({ username: userResponse2.username, password: 'password' });

  //   const response = await request(app)
  //     .post(`/conversations/${convoCreateResponse.body.id}/messages`)
  //     .send({
  //       content: 'test message',
  //       user_id: userResponse1.id,
  //       conversation_id: convoCreateResponse.body.id,
  //     })
  //     .set('Accept', 'application/json')
  //     .set('Authorization', `${loginResponse2.body.token}`);

  //   expect(response.status).toBe(403);
  // });

  it('should return 404 if conversation not found', async () => {
    const authService = createAuthService(userStore);

    const userResponse1 = await authService.signup(
      `${usernamePrefix}1`,
      'password'
    );
    userIDs.push(userResponse1.id);

    const userResponse2 = await authService.signup(
      `${usernamePrefix}2`,
      'password'
    );
    userIDs.push(userResponse2.id);

    const loginResponse1 = await request(app)
      .post('/auth/login')
      .send({ username: userResponse1.username, password: 'password' });

    const convoCreateResponse = await request(app)
      .post('/conversations')
      .send({
        conversation: { name: 'test-user-3-convo-1' },
        user_ids: [userResponse2.id],
      })
      .set('Accept', 'application/json')
      .set('Authorization', `${loginResponse1.body.token}`);
    conversationIDs.push(convoCreateResponse.body.id);

    const response = await request(app)
      .post('/conversations/1/messages')
      .send({
        content: 'test message',
        user_id: userResponse1.id,
        conversation_id: convoCreateResponse.body.id,
      })
      .set('Accept', 'application/json')
      .set('Authorization', `${loginResponse1.body.token}`);

    expect(response.status).toBe(404);
  });

  it('should return 201 if message is added to conversation', async () => {
    const authService = createAuthService(userStore);

    const userResponse1 = await authService.signup(
      `${usernamePrefix}1`,
      'password'
    );
    userIDs.push(userResponse1.id);

    const userResponse2 = await authService.signup(
      `${usernamePrefix}2`,
      'password'
    );
    userIDs.push(userResponse2.id);

    const loginResponse1 = await request(app)
      .post('/auth/login')
      .send({ username: userResponse1.username, password: 'password' });

    const convoCreateResponse = await request(app)
      .post('/conversations')
      .send({
        conversation: { name: 'test-user-3-convo-1' },
        user_ids: [userResponse2.id],
      })
      .set('Accept', 'application/json')
      .set('Authorization', `${loginResponse1.body.token}`);
    conversationIDs.push(convoCreateResponse.body.id);

    const msgAddedResponse1 = await request(app)
      .post(`/conversations/${convoCreateResponse.body.id}/messages`)
      .send({
        content: 'test message 1',
        user_id: userResponse1.id,
        conversation_id: convoCreateResponse.body.id,
      })
      .set('Accept', 'application/json')
      .set('Authorization', `${loginResponse1.body.token}`);

    expect(msgAddedResponse1.status).toBe(201);
    expect(msgAddedResponse1.body).toMatchObject({
      content: 'test message 1',
      user_id: userResponse1.id,
      conversation_id: convoCreateResponse.body.id,
    });

    const loginResponse2 = await request(app)
      .post('/auth/login')
      .send({ username: userResponse2.username, password: 'password' });

    const msgAddedResponse2 = await request(app)
      .post(`/conversations/${convoCreateResponse.body.id}/messages`)
      .send({
        content: 'test message 2',
        user_id: userResponse2.id,
        conversation_id: convoCreateResponse.body.id,
      })
      .set('Accept', 'application/json')
      .set('Authorization', `${loginResponse2.body.token}`);

    expect(msgAddedResponse2.status).toBe(201);
    expect(msgAddedResponse2.body).toMatchObject({
      content: 'test message 2',
      user_id: userResponse2.id,
      conversation_id: convoCreateResponse.body.id,
    });

    const response = await request(app)
      .get(`/conversations/${convoCreateResponse.body.id}/messages`)
      .set('Accept', 'application/json')
      .set('Authorization', `${loginResponse2.body.token}`);

    expect(response.status).toBe(200);
    expect(response.body.length).toBe(2);
    expect(response.body).toContainEqual(
      expect.objectContaining({
        content: 'test message 1',
        user_id: userResponse1.id,
        conversation_id: convoCreateResponse.body.id,
      })
    );
    expect(response.body).toContainEqual(
      expect.objectContaining({
        content: 'test message 2',
        user_id: userResponse2.id,
        conversation_id: convoCreateResponse.body.id,
      })
    );
  });

  it('when a conversation is deleted, all messages in the conversation should be deleted', async () => {
    const authService = createAuthService(userStore);

    const userResponse1 = await authService.signup(
      `${usernamePrefix}1`,
      'password'
    );
    userIDs.push(userResponse1.id);

    const userResponse2 = await authService.signup(
      `${usernamePrefix}2`,
      'password'
    );
    userIDs.push(userResponse2.id);

    const loginResponse1 = await request(app)
      .post('/auth/login')
      .send({ username: userResponse1.username, password: 'password' });

    const convoCreateResponse = await request(app)
      .post('/conversations')
      .send({
        conversation: { name: 'test-convo' },
        user_ids: [userResponse2.id],
      })
      .set('Accept', 'application/json')
      .set('Authorization', `${loginResponse1.body.token}`);
    conversationIDs.push(convoCreateResponse.body.id);

    await request(app)
      .post(`/conversations/${convoCreateResponse.body.id}/messages`)
      .send({
        content: 'test message 1',
        user_id: userResponse1.id,
        conversation_id: convoCreateResponse.body.id,
      })
      .set('Accept', 'application/json')
      .set('Authorization', `${loginResponse1.body.token}`);

    const loginResponse2 = await request(app)
      .post('/auth/login')
      .send({ username: userResponse2.username, password: 'password' });

    await request(app)
      .post(`/conversations/${convoCreateResponse.body.id}/messages`)
      .send({
        content: 'test message 2',
        user_id: userResponse2.id,
        conversation_id: convoCreateResponse.body.id,
      })
      .set('Accept', 'application/json')
      .set('Authorization', `${loginResponse2.body.token}`);

    const checkMessagesResponse1 = await request(app)
      .get(`/conversations/${convoCreateResponse.body.id}/messages`)
      .set('Accept', 'application/json')
      .set('Authorization', `${loginResponse2.body.token}`);

    expect(checkMessagesResponse1.status).toBe(200);
    expect(checkMessagesResponse1.body.length).toBe(2);
    expect(checkMessagesResponse1.body).toContainEqual(
      expect.objectContaining({
        content: 'test message 1',
        user_id: userResponse1.id,
        conversation_id: convoCreateResponse.body.id,
      })
    );
    expect(checkMessagesResponse1.body).toContainEqual(
      expect.objectContaining({
        content: 'test message 2',
        user_id: userResponse2.id,
        conversation_id: convoCreateResponse.body.id,
      })
    );

    const response1 = await request(app)
      .delete(`/conversations/${convoCreateResponse.body.id}`)
      .set('Accept', 'application/json')
      .set('Authorization', `${loginResponse1.body.token}`);

    expect(response1.status).toBe(200);

    const checkMessagesResponse2 = await request(app)
      .get(`/conversations/${convoCreateResponse.body.id}/messages`)
      .set('Accept', 'application/json')
      .set('Authorization', `${loginResponse2.body.token}`);

    expect(checkMessagesResponse2.status).toBe(404);

    const messages = await db
      .selectFrom('message')
      .where('conversation_id', '=', convoCreateResponse.body.id)
      .execute();

    expect(messages.length).toBe(0);
  });
});
