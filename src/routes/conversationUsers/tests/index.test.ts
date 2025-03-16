import app from '../../../index';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { db } from '../../../database/database';
import createAuthService from '../../auth/service';
import userStore from '../../users/store';
import { CacheTokenManager } from '../../../cache/helpers';

describe('GET /conversations/:conversation_id/users', () => {
  const usernamePrefix = 'test-convo-user-user-';
  const userIDs: number[] = [];
  const conversationIDs: number[] = [];

  afterEach(async () => {
    if (userIDs && userIDs.length > 0) {
      for (const userID of userIDs) {
        await db.deleteFrom('user').where('id', '=', userID).execute();
        const refreshTokenManager = await CacheTokenManager.getInstance();
        refreshTokenManager.invalidateRefreshToken(userID);
        refreshTokenManager.invalidateWebSocketToken(userID);
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

  it('should get 400 if invalid conversation_id is provided', async () => {
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
      .get('/conversations/wrong/users')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${loginResponse.body.jwt}`);

    expect(response.status).toBe(400);
  });

  it('should get 401 if not logged in and try to get all users in a conversation', async () => {
    const response = await request(app).get('/conversations/1/users');
    expect(response.status).toBe(401);
  });

  it('should get 403 if user is not in conversation', async () => {
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
      .send({ username: userResponse2.username, password: 'password' });

    const convoResponse = await request(app)
      .post('/conversations')
      .send({
        conversation: { name: 'test-user-3-convo-1' },
        user_ids: [userResponse1.id],
      })
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${loginResponse1.body.jwt}`);
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
      .get(`/conversations/${convoResponse.body.id}/users`)
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${loginResponse3.body.jwt}`);

    expect(response.status).toBe(403);
  });

  it('should get 404 if conversation not found', async () => {
    const authService = createAuthService(userStore);

    const userResponse1 = await authService.signup(
      `${usernamePrefix}1`,
      'password'
    );
    userIDs.push(userResponse1.id);

    const loginResponse = await request(app)
      .post('/auth/login')
      .send({ username: userResponse1.username, password: 'password' });

    const response = await request(app)
      .get(`/conversations/1/users`)
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${loginResponse.body.jwt}`);

    expect(response.status).toBe(404);
  });

  it('should get 200 and return conversation users if user is in conversation and conversation exists', async () => {
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

    const loginResponse = await request(app)
      .post('/auth/login')
      .send({ username: userResponse2.username, password: 'password' });

    const convoResponse = await request(app)
      .post('/conversations')
      .send({
        conversation: { name: 'test-user-3-convo-1' },
        user_ids: [userResponse1.id],
      })
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${loginResponse.body.jwt}`);
    conversationIDs.push(convoResponse.body.id);

    const response = await request(app)
      .get(`/conversations/${convoResponse.body.id}/users`)
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${loginResponse.body.jwt}`);

    expect(response.status).toBe(200);
    expect(response.body.length).toBe(2);
    expect(response.body).toContainEqual({
      id: userResponse1.id,
      username: userResponse1.username,
    });
    expect(response.body).toContainEqual({
      id: userResponse2.id,
      username: userResponse2.username,
    });
  });
});

describe('POST /conversations/:id/users', () => {
  const usernamePrefix = 'test-convo-user-user-';
  const userIDs: number[] = [];
  const conversationIDs: number[] = [];

  afterEach(async () => {
    if (userIDs && userIDs.length > 0) {
      for (const userID of userIDs) {
        await db.deleteFrom('user').where('id', '=', userID).execute();
        const refreshTokenManager = await CacheTokenManager.getInstance();
        refreshTokenManager.invalidateRefreshToken(userID);
        refreshTokenManager.invalidateWebSocketToken(userID);
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

  it('should get 400 if invalid conversation_id is provided', async () => {
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
      .post('/conversations/wrong/users')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${loginResponse.body.jwt}`);

    expect(response.status).toBe(400);
  });

  it('should get 400 if invalid user_id is provided', async () => {
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
      .post('/conversations/1/users')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${loginResponse.body.jwt}`);

    expect(response.status).toBe(400);
  });

  it('should get 400 if user to be added is already in conversation', async () => {
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
        conversation: { name: 'convo-user-1-and-user-2' },
        user_ids: [userResponse2.id],
      })
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${loginResponse1.body.jwt}`);
    conversationIDs.push(convoResponse.body.id);

    const response = await request(app)
      .post(`/conversations/${convoResponse.body.id}/users`)
      .send({ user_id: userResponse2.id })
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${loginResponse1.body.jwt}`);

    expect(response.status).toBe(400);
  });

  it('should get 400 if user to be added is the same as the user making the request', async () => {
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
        conversation: { name: 'convo-user-1-and-user-2' },
        user_ids: [userResponse2.id],
      })
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${loginResponse1.body.jwt}`);
    conversationIDs.push(convoResponse.body.id);

    const response = await request(app)
      .post(`/conversations/${convoResponse.body.id}/users`)
      .send({ user_id: userResponse1.id })
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${loginResponse1.body.jwt}`);

    expect(response.status).toBe(400);
  });

  it('should get 401 if not logged in and try to add user to conversation', async () => {
    const response = await request(app).post('/conversations/1/users');
    expect(response.status).toBe(401);
  });

  it('should get 403 if user is not in conversation', async () => {
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
      .send({ username: userResponse2.username, password: 'password' });

    const convoResponse = await request(app)
      .post('/conversations')
      .send({
        conversation: { name: 'convo-user-1-and-user-2' },
        user_ids: [userResponse1.id],
      })
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${loginResponse1.body.jwt}`);
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
      .post(`/conversations/${convoResponse.body.id}/users`)
      .send({ user_id: userResponse3.id })
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${loginResponse3.body.jwt}`);

    expect(response.status).toBe(403);
  });

  it('should get 404 if conversation not found', async () => {
    const authService = createAuthService(userStore);

    const userResponse1 = await authService.signup(
      `${usernamePrefix}1`,
      'password'
    );
    userIDs.push(userResponse1.id);

    const loginResponse = await request(app)
      .post('/auth/login')
      .send({ username: userResponse1.username, password: 'password' });

    const response = await request(app)
      .post(`/conversations/1/users`)
      .send({ user_id: userResponse1.id })
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${loginResponse.body.jwt}`);

    expect(response.status).toBe(404);
  });

  it('should get 201 if user is in conversation, conversation exists, and successfully addes new user to the conversation', async () => {
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

    const loginResponse = await request(app)
      .post('/auth/login')
      .send({ username: userResponse2.username, password: 'password' });

    const convoResponse = await request(app)
      .post('/conversations')
      .send({
        conversation: { name: 'convo-user-1-and-user-2' },
        user_ids: [userResponse1.id],
      })
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${loginResponse.body.jwt}`);
    conversationIDs.push(convoResponse.body.id);

    const userResponse3 = await authService.signup(
      `${usernamePrefix}3`,
      'password'
    );
    userIDs.push(userResponse3.id);

    const response = await request(app)
      .post(`/conversations/${convoResponse.body.id}/users`)
      .send({ user_id: userResponse3.id })
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${loginResponse.body.jwt}`);

    expect(response.status).toBe(201);
    expect(response.body.user_id).toBe(userResponse3.id);

    const usersResponse = await request(app)
      .get(`/conversations/${convoResponse.body.id}/users`)
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${loginResponse.body.jwt}`);

    expect(usersResponse.status).toBe(200);
    expect(usersResponse.body.length).toBe(3);
    expect(usersResponse.body).toContainEqual({
      id: userResponse3.id,
      username: userResponse3.username,
    });

    const user1 = await db
      .selectFrom('conversation_user')
      .where('user_id', '=', userResponse1.id)
      .where('conversation_id', '=', convoResponse.body.id)
      .selectAll()
      .executeTakeFirst();

    expect(user1).not.toBeNull();
    if (user1) {
      expect(user1.last_read_message_id).toBeNull();
    }

    const user2 = await db
      .selectFrom('conversation_user')
      .where('user_id', '=', userResponse2.id)
      .where('conversation_id', '=', convoResponse.body.id)
      .selectAll()
      .executeTakeFirst();

    expect(user2).not.toBeNull();
    if (user2) {
      expect(user2.last_read_message_id).toBeNull();
    }

    const user3 = await db
      .selectFrom('conversation_user')
      .where('user_id', '=', userResponse3.id)
      .where('conversation_id', '=', convoResponse.body.id)
      .selectAll()
      .executeTakeFirst();

    expect(user3).not.toBeNull();
    if (user3) {
      expect(user3.last_read_message_id).toBeNull();
    }
  });
});

describe('DELETE /conversations/:id/users', () => {
  const usernamePrefix = 'test-convo-user-user-';
  const userIDs: number[] = [];
  const conversationIDs: number[] = [];

  afterEach(async () => {
    if (userIDs && userIDs.length > 0) {
      for (const userID of userIDs) {
        await db.deleteFrom('user').where('id', '=', userID).execute();
        const refreshTokenManager = await CacheTokenManager.getInstance();
        refreshTokenManager.invalidateRefreshToken(userID);
        refreshTokenManager.invalidateWebSocketToken(userID);
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

  it('should get 400 if invalid conversation_id is provided', async () => {
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
      .delete(`/conversations/wrong/users/${userResponse.id}`)
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${loginResponse.body.jwt}`);

    expect(response.status).toBe(400);
  });

  it('should get 400 if invalid user_id is provided', async () => {
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
      .delete('/conversations/1/users/wrong')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${loginResponse.body.jwt}`);

    expect(response.status).toBe(400);
  });

  it('should get 400 if user to be removed is not in conversation', async () => {
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
        conversation: { name: 'convo-user-1-and-user-2' },
        user_ids: [userResponse2.id],
      })
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${loginResponse1.body.jwt}`);
    conversationIDs.push(convoResponse.body.id);

    const convoGetUsersResponse = await request(app)
      .get(`/conversations/${convoResponse.body.id}/users`)
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${loginResponse1.body.jwt}`);

    expect(convoGetUsersResponse.status).toBe(200);
    expect(convoGetUsersResponse.body.length).toBe(2);
    expect(convoGetUsersResponse.body).toContainEqual({
      id: userResponse1.id,
      username: userResponse1.username,
    });
    expect(convoGetUsersResponse.body).toContainEqual({
      id: userResponse2.id,
      username: userResponse2.username,
    });

    const userResponse3 = await authService.signup(
      `${usernamePrefix}3`,
      'password'
    );
    userIDs.push(userResponse3.id);

    const response = await request(app)
      .delete(
        `/conversations/${convoResponse.body.id}/users/${userResponse3.id}`
      )
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${loginResponse1.body.jwt}`);

    expect(response.status).toBe(400);
  });

  it('should get 401 if not logged in and try to remove user from conversation', async () => {
    const response = await request(app).delete('/conversations/1/users');
    expect(response.status).toBe(401);
  });

  it('should get 403 if user is not in conversation', async () => {
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
        conversation: { name: 'convo-user-1-and-user-2' },
        user_ids: [userResponse2.id],
      })
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${loginResponse1.body.jwt}`);
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
      .delete(
        `/conversations/${convoResponse.body.id}/users/${userResponse1.id}`
      )
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${loginResponse3.body.jwt}`);

    expect(response.status).toBe(403);
  });

  it('should get 404 if conversation not found', async () => {
    const authService = createAuthService(userStore);

    const userResponse1 = await authService.signup(
      `${usernamePrefix}1`,
      'password'
    );
    userIDs.push(userResponse1.id);

    const loginResponse = await request(app)
      .post('/auth/login')
      .send({ username: userResponse1.username, password: 'password' });

    const response = await request(app)
      .delete(`/conversations/1/users`)
      .send({ user_id: userResponse1.id })
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${loginResponse.body.jwt}`);

    expect(response.status).toBe(404);
  });

  it('should get 200 if user is removed successfully', async () => {
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

    const userResponse3 = await authService.signup(
      `${usernamePrefix}3`,
      'password'
    );
    userIDs.push(userResponse3.id);

    const loginResponse1 = await request(app)
      .post('/auth/login')
      .send({ username: userResponse1.username, password: 'password' });

    const convoResponse = await request(app)
      .post('/conversations')
      .send({
        conversation: { name: 'convo-user-1-and-user-2' },
        user_ids: [userResponse2.id, userResponse3.id],
      })
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${loginResponse1.body.jwt}`);
    conversationIDs.push(convoResponse.body.id);

    const convoGetUsersResponse1 = await request(app)
      .get(`/conversations/${convoResponse.body.id}/users`)
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${loginResponse1.body.jwt}`);

    expect(convoGetUsersResponse1.status).toBe(200);
    expect(convoGetUsersResponse1.body.length).toBe(3);
    expect(convoGetUsersResponse1.body).toContainEqual({
      id: userResponse1.id,
      username: userResponse1.username,
    });
    expect(convoGetUsersResponse1.body).toContainEqual({
      id: userResponse2.id,
      username: userResponse2.username,
    });
    expect(convoGetUsersResponse1.body).toContainEqual({
      id: userResponse3.id,
      username: userResponse3.username,
    });

    const response = await request(app)
      .delete(
        `/conversations/${convoResponse.body.id}/users/${userResponse3.id}`
      )
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${loginResponse1.body.jwt}`);

    expect(response.status).toBe(200);
    expect(response.body.user_id).toEqual(userResponse3.id);

    const convoGetUsersResponse2 = await request(app)
      .get(`/conversations/${convoResponse.body.id}/users`)
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${loginResponse1.body.jwt}`);

    expect(convoGetUsersResponse2.status).toBe(200);
    expect(convoGetUsersResponse2.body.length).toBe(2);
    expect(convoGetUsersResponse2.body).toContainEqual({
      id: userResponse1.id,
      username: userResponse1.username,
    });
    expect(convoGetUsersResponse2.body).toContainEqual({
      id: userResponse2.id,
      username: userResponse2.username,
    });
  });

  it("when a user is deleted from a conversation, the user should not appear in the conversation's users list", async () => {
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

    const userResponse3 = await authService.signup(
      `${usernamePrefix}3`,
      'password'
    );
    userIDs.push(userResponse3.id);

    const loginResponse1 = await request(app)
      .post('/auth/login')
      .send({ username: userResponse1.username, password: 'password' });

    const convoResponse = await request(app)
      .post('/conversations')
      .send({
        conversation: { name: 'test-convo' },
        user_ids: [userResponse2.id, userResponse3.id],
      })
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${loginResponse1.body.jwt}`);
    conversationIDs.push(convoResponse.body.id);

    const convoGetUsersResponse1 = await request(app)
      .get(`/conversations/${convoResponse.body.id}/users`)
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${loginResponse1.body.jwt}`);

    expect(convoGetUsersResponse1.status).toBe(200);
    expect(convoGetUsersResponse1.body.length).toBe(3);
    expect(convoGetUsersResponse1.body).toContainEqual({
      id: userResponse1.id,
      username: userResponse1.username,
    });
    expect(convoGetUsersResponse1.body).toContainEqual({
      id: userResponse2.id,
      username: userResponse2.username,
    });
    expect(convoGetUsersResponse1.body).toContainEqual({
      id: userResponse3.id,
      username: userResponse3.username,
    });

    const response = await request(app)
      .delete(
        `/conversations/${convoResponse.body.id}/users/${userResponse3.id}`
      )
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${loginResponse1.body.jwt}`);

    expect(response.status).toBe(200);
    expect(response.body.user_id).toEqual(userResponse3.id);

    const convoGetUsersResponse2 = await request(app)
      .get(`/conversations/${convoResponse.body.id}/users`)
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${loginResponse1.body.jwt}`);

    expect(convoGetUsersResponse2.status).toBe(200);
    expect(convoGetUsersResponse2.body.length).toBe(2);
    expect(convoGetUsersResponse2.body).toContainEqual({
      id: userResponse1.id,
      username: userResponse1.username,
    });
    expect(convoGetUsersResponse2.body).toContainEqual({
      id: userResponse2.id,
      username: userResponse2.username,
    });
    expect(convoGetUsersResponse2.body).not.toContainEqual({
      id: userResponse3.id,
      username: userResponse3.username,
    });
  });

  it('when a conversation is deleted, all users should be removed from the conversation', async () => {
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

    const userResponse3 = await authService.signup(
      `${usernamePrefix}3`,
      'password'
    );
    userIDs.push(userResponse3.id);

    const loginResponse1 = await request(app)
      .post('/auth/login')
      .send({ username: userResponse1.username, password: 'password' });

    const convoResponse = await request(app)
      .post('/conversations')
      .send({
        conversation: { name: 'test-convo' },
        user_ids: [userResponse2.id, userResponse3.id],
      })
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${loginResponse1.body.jwt}`);
    conversationIDs.push(convoResponse.body.id);

    const convoGetUsersResponse1 = await request(app)
      .get(`/conversations/${convoResponse.body.id}/users`)
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${loginResponse1.body.jwt}`);

    expect(convoGetUsersResponse1.status).toBe(200);
    expect(convoGetUsersResponse1.body.length).toBe(3);
    expect(convoGetUsersResponse1.body).toContainEqual({
      id: userResponse1.id,
      username: userResponse1.username,
    });
    expect(convoGetUsersResponse1.body).toContainEqual({
      id: userResponse2.id,
      username: userResponse2.username,
    });
    expect(convoGetUsersResponse1.body).toContainEqual({
      id: userResponse3.id,
      username: userResponse3.username,
    });

    const response = await request(app)
      .delete(`/conversations/${convoResponse.body.id}`)
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${loginResponse1.body.jwt}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toEqual(convoResponse.body.id);

    const convoGetUsersResponse2 = await request(app)
      .get(`/conversations/${convoResponse.body.id}/users`)
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${loginResponse1.body.jwt}`);

    expect(convoGetUsersResponse2.status).toBe(404);

    const user1 = await db
      .selectFrom('conversation_user')
      .where('user_id', '=', userResponse1.id)
      .where('conversation_id', '=', convoResponse.body.id)
      .selectAll()
      .executeTakeFirst();

    expect(user1).toBeUndefined();

    const user2 = await db
      .selectFrom('conversation_user')
      .where('user_id', '=', userResponse2.id)
      .where('conversation_id', '=', convoResponse.body.id)
      .selectAll()
      .executeTakeFirst();

    expect(user2).toBeUndefined();

    const user3 = await db
      .selectFrom('conversation_user')
      .where('user_id', '=', userResponse3.id)
      .where('conversation_id', '=', convoResponse.body.id)
      .selectAll()
      .executeTakeFirst();

    expect(user3).toBeUndefined();
  });
});
