import app from '../../../index';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import createAuthService from '../../auth/service';
import userStore from '../../users/store';
import { db } from '../../../database/database';
import { RefreshTokenManager } from '../../../cache/helpers';

describe('POST /conversations', () => {
  const userIDs: number[] = [];
  const conversationIDs: number[] = [];

  afterEach(async () => {
    if (userIDs && userIDs.length > 0) {
      for (const userID of userIDs) {
        await db.deleteFrom('user').where('id', '=', userID).execute();
        const refreshTokenManager = await RefreshTokenManager.getInstance();
        refreshTokenManager.invalidateRefreshToken(userID);
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

  it('should not be able to create a conversation if not logged in', async () => {
    const response = await request(app)
      .post('/conversations')
      .send({ name: 'test-convo' });

    expect(response.statusCode).toBe(401);
  });

  it('should be able to create a conversation', async () => {
    const authService = createAuthService(userStore);

    const userResponse1 = await authService.signup(
      'test-convo-user-2',
      'password'
    );
    userIDs.push(userResponse1.id);

    const userResponse2 = await authService.signup(
      'test-convo-user-3',
      'password'
    );
    userIDs.push(userResponse2.id);

    const loginResponse = await request(app)
      .post('/auth/login')
      .send({ username: userResponse2.username, password: 'password' });

    const response = await request(app)
      .post('/conversations')
      .send({
        conversation: { name: 'test-user-3-convo-1' },
        user_ids: [userResponse1.id],
      })
      .set('Accept', 'application/json')
      .set('Authorization', `${loginResponse.body.token}`);
    conversationIDs.push(response.body.id);

    expect(response.statusCode).toBe(201);
    expect(response.body.name).toBe('test-user-3-convo-1');
    expect(response.body.id).toBeDefined();
  });

  it('should not be able to create a conversation with no user ids', async () => {
    const authService = createAuthService(userStore);

    const userResponse = await authService.signup(
      'test-convo-user-4',
      'password'
    );
    userIDs.push(userResponse.id);

    const loginResponse = await request(app)
      .post('/auth/login')
      .send({ username: userResponse.username, password: 'password' });

    const response = await request(app)
      .post('/conversations')
      .send({ conversation: { name: 'test-user-4-convo-1' } })
      .set('Accept', 'application/json')
      .set('Authorization', `${loginResponse.body.token}`);

    expect(response.statusCode).toBe(400);
  });

  it('should not be able to create a conversation with user id in own conversation', async () => {
    const authService = createAuthService(userStore);

    const userResponse = await authService.signup(
      'test-convo-user-5',
      'password'
    );
    userIDs.push(userResponse.id);

    const loginResponse = await request(app)
      .post('/auth/login')
      .send({ username: userResponse.username, password: 'password' });

    const response = await request(app)
      .post('/conversations')
      .send({
        conversation: { name: 'test-user-5-convo-1' },
        user_ids: [userResponse.id],
      })
      .set('Accept', 'application/json')
      .set('Authorization', `${loginResponse.body.token}`);

    expect(response.statusCode).toBe(400);
  });

  it('should not be able to create a conversation with more then 12 user ids', async () => {
    const authService = createAuthService(userStore);

    const userResponse = await authService.signup(
      'test-convo-user-6',
      'password'
    );
    userIDs.push(userResponse.id);

    const loginResponse = await request(app)
      .post('/auth/login')
      .send({ username: userResponse.username, password: 'password' });

    const response = await request(app)
      .post('/conversations')
      .send({
        conversation: { name: 'test-user-6-convo-1' },
        user_ids: Array.from({ length: 13 }, (_, i) => i + 1),
      })
      .set('Accept', 'application/json')
      .set('Authorization', `${loginResponse.body.token}`);

    expect(response.statusCode).toBe(400);
  });

  it('should not be able to create a conversation with invalid conversation name', async () => {
    const authService = createAuthService(userStore);

    const userResponse = await authService.signup(
      'test-convo-user-6',
      'password'
    );
    userIDs.push(userResponse.id);

    const loginResponse = await request(app)
      .post('/auth/login')
      .send({ username: userResponse.username, password: 'password' });

    const response = await request(app)
      .post('/conversations')
      .send({
        conversation: { name: '' },
        user_ids: [userResponse.id],
      })
      .set('Accept', 'application/json')
      .set('Authorization', `${loginResponse.body.token}`);

    expect(response.statusCode).toBe(400);
  });
});

describe('GET /conversations', () => {
  const userIDs: number[] = [];
  const conversationIDs: number[] = [];

  afterEach(async () => {
    if (userIDs && userIDs.length > 0) {
      for (const userID of userIDs) {
        await db.deleteFrom('user').where('id', '=', userID).execute();
        const refreshTokenManager = await RefreshTokenManager.getInstance();
        refreshTokenManager.invalidateRefreshToken(userID);
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

  it('should not be able to view conversations if not logged in', async () => {
    const response = await request(app).get('/conversations');
    expect(response.statusCode).toBe(401);
  });

  it('should be able to view conversations if logged in', async () => {
    const authService = createAuthService(userStore);
    const userResponse = await authService.signup(
      'test-convo-user-1',
      'password'
    );
    userIDs.push(userResponse.id);

    const loginResponse = await request(app)
      .post('/auth/login')
      .send({ username: 'test-convo-user-1', password: 'password' });

    const response = await request(app)
      .get('/conversations')
      .set('Accept', 'application/json')
      .set('Authorization', `${loginResponse.body.token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual([]);
  });

  it('should be able to only view own conversations', async () => {
    const authService = createAuthService(userStore);

    const useOne = await authService.signup(
      'test-convo-user-other',
      'password'
    );
    userIDs.push(useOne.id);

    const userTwo = await authService.signup('test-convo-user-3', 'password');
    userIDs.push(userTwo.id);

    const userTwoLogin = await authService.login(
      'test-convo-user-3',
      'password'
    );

    const convoOneAndTwo = await request(app)
      .post('/conversations')
      .send({
        conversation: { name: "convo between user's one and two" },
        user_ids: [useOne.id],
      })
      .set('Accept', 'application/json')
      .set('Authorization', `${userTwoLogin.token}`);
    conversationIDs.push(convoOneAndTwo.body.id);

    const userThree = await authService.signup('test-convo-user-4', 'password');
    userIDs.push(userThree.id);

    const userThreeLogin = await authService.login(
      'test-convo-user-4',
      'password'
    );

    const convoOneAndThree = await request(app)
      .post('/conversations')
      .send({
        conversation: { name: "convo between user's one and three" },
        user_ids: [useOne.id],
      })
      .set('Accept', 'application/json')
      .set('Authorization', `${userThreeLogin.token}`);
    conversationIDs.push(convoOneAndThree.body.id);

    const response = await request(app)
      .get(`/conversations`)
      .set('Accept', 'application/json')
      .set('Authorization', `${userThreeLogin.token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0].id).toBe(convoOneAndThree.body.id);
  });
});

describe('GET /conversations/{conversation_id}', () => {
  const userIDs: number[] = [];
  const conversationIDs: number[] = [];

  afterEach(async () => {
    if (userIDs && userIDs.length > 0) {
      for (const userID of userIDs) {
        await db.deleteFrom('user').where('id', '=', userID).execute();
        const refreshTokenManager = await RefreshTokenManager.getInstance();
        refreshTokenManager.invalidateRefreshToken(userID);
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

  it('should not be able to view conversation if not logged in', async () => {
    const response = await request(app).get('/conversations/1');
    expect(response.statusCode).toBe(401);
  });

  it('should be able to view conversation if logged in', async () => {
    const authService = createAuthService(userStore);

    const userResponse1 = await authService.signup(
      'test-convo-user-1',
      'password'
    );
    userIDs.push(userResponse1.id);

    const userResponse2 = await authService.signup(
      'test-convo-user-2',
      'password'
    );
    userIDs.push(userResponse2.id);

    const loginResponse = await request(app)
      .post('/auth/login')
      .send({ username: 'test-convo-user-2', password: 'password' });

    const createConvoResponse = await request(app)
      .post('/conversations')
      .send({
        conversation: { name: 'test-user-2-convo-1' },
        user_ids: [userResponse1.id],
      })
      .set('Accept', 'application/json')
      .set('Authorization', `${loginResponse.body.token}`);
    conversationIDs.push(createConvoResponse.body.id);

    const response = await request(app)
      .get(`/conversations/${createConvoResponse.body.id}`)
      .set('Accept', 'application/json')
      .set('Authorization', `${loginResponse.body.token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.id).toBe(createConvoResponse.body.id);
    expect(response.body.name).toBe('test-user-2-convo-1');
  });

  it('should get 403 if logged in but not in conversation', async () => {
    const authService = createAuthService(userStore);

    const userOne = await authService.signup('test-convo-user-1', 'password');
    userIDs.push(userOne.id);

    const userTwo = await authService.signup('test-convo-user-2', 'password');
    userIDs.push(userTwo.id);

    const userOneLogin = await request(app)
      .post('/auth/login')
      .send({ username: 'test-convo-user-1', password: 'password' });

    const convoOneAndTwo = await request(app)
      .post('/conversations')
      .send({
        conversation: { name: 'conversation between user one and user two' },
        user_ids: [userTwo.id],
      })
      .set('Accept', 'application/json')
      .set('Authorization', `${userOneLogin.body.token}`);
    conversationIDs.push(convoOneAndTwo.body.id);

    const userThree = await authService.signup('test-convo-user-3', 'password');
    userIDs.push(userThree.id);

    const userThreeLogin = await request(app)
      .post('/auth/login')
      .send({ username: 'test-convo-user-3', password: 'password' });

    const response = await request(app)
      .get(`/conversations/${convoOneAndTwo.body.id}`)
      .set('Accept', 'application/json')
      .set('Authorization', `${userThreeLogin.body.token}`);

    expect(response.statusCode).toBe(403);
  });

  it('should get 404 if logged in but conversation does not exist', async () => {
    const authService = createAuthService(userStore);
    const userResponse = await authService.signup(
      'test-convo-user-1',
      'password'
    );
    userIDs.push(userResponse.id);

    const loginResponse = await request(app)
      .post('/auth/login')
      .send({ username: 'test-convo-user-1', password: 'password' });

    const response = await request(app)
      .get('/conversations/1')
      .set('Accept', 'application/json')
      .set('Authorization', `${loginResponse.body.token}`);

    expect(response.statusCode).toBe(404);
  });
});

describe('PUT /conversations/{conversation_id}', () => {
  const userIDs: number[] = [];
  const conversationIDs: number[] = [];

  afterEach(async () => {
    if (userIDs && userIDs.length > 0) {
      for (const userID of userIDs) {
        await db.deleteFrom('user').where('id', '=', userID).execute();
        const refreshTokenManager = await RefreshTokenManager.getInstance();
        refreshTokenManager.invalidateRefreshToken(userID);
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

  it('should not be able to update conversation if not logged in', async () => {
    const response = await request(app)
      .put('/conversations/1')
      .send({ name: 'new-name' });

    expect(response.statusCode).toBe(401);
  });

  it('should be able to update conversation if logged in', async () => {
    const authService = createAuthService(userStore);

    const userOne = await authService.signup('test-convo-user-1', 'password');
    userIDs.push(userOne.id);

    const userTwo = await authService.signup('test-convo-user-2', 'password');
    userIDs.push(userTwo.id);

    const userTwoLogin = await request(app)
      .post('/auth/login')
      .send({ username: 'test-convo-user-2', password: 'password' });

    const convoResponse = await request(app)
      .post('/conversations')
      .send({
        conversation: { name: 'test-user-2-convo-1' },
        user_ids: [userOne.id],
      })
      .set('Accept', 'application/json')
      .set('Authorization', `${userTwoLogin.body.token}`);
    conversationIDs.push(convoResponse.body.id);

    const response = await request(app)
      .put(`/conversations/${convoResponse.body.id}`)
      .send({ name: 'new-name' })
      .set('Accept', 'application/json')
      .set('Authorization', `${userTwoLogin.body.token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.id).toBe(convoResponse.body.id);
    expect(response.body.name).toBe('new-name');
  });

  it('should get 403 if logged in but not in conversation', async () => {
    const authService = createAuthService(userStore);

    const userOne = await authService.signup('test-convo-user-1', 'password');
    userIDs.push(userOne.id);

    const userTwo = await authService.signup('test-convo-user-2', 'password');
    userIDs.push(userTwo.id);

    const userOneLogin = await request(app)
      .post('/auth/login')
      .send({ username: 'test-convo-user-1', password: 'password' });

    const convoOneAndTwo = await request(app)
      .post('/conversations')
      .send({
        conversation: { name: 'conversation between user one and user two' },
        user_ids: [userTwo.id],
      })
      .set('Accept', 'application/json')
      .set('Authorization', `${userOneLogin.body.token}`);
    conversationIDs.push(convoOneAndTwo.body.id);

    const userThree = await authService.signup('test-convo-user-3', 'password');
    userIDs.push(userThree.id);

    const userThreeLogin = await request(app)
      .post('/auth/login')
      .send({ username: 'test-convo-user-3', password: 'password' });

    const response = await request(app)
      .put(`/conversations/${convoOneAndTwo.body.id}`)
      .send({ name: 'new-name' })
      .set('Accept', 'application/json')
      .set('Authorization', `${userThreeLogin.body.token}`);

    expect(response.statusCode).toBe(403);
  });

  it('should get 404 if logged in but conversation does not exist', async () => {
    const authService = createAuthService(userStore);
    const userResponse = await authService.signup(
      'test-convo-user-1',
      'password'
    );
    userIDs.push(userResponse.id);

    const loginResponse = await request(app)
      .post('/auth/login')
      .send({ username: 'test-convo-user-1', password: 'password' });

    const response = await request(app)
      .put('/conversations/1')
      .send({ name: 'new-name' })
      .set('Accept', 'application/json')
      .set('Authorization', `${loginResponse.body.token}`);

    expect(response.statusCode).toBe(404);
  });

  it('should get 400 if logged in but invalid name', async () => {
    const authService = createAuthService(userStore);

    const userOne = await authService.signup('test-convo-user-1', 'password');
    userIDs.push(userOne.id);

    const userTwo = await authService.signup('test-convo-user-2', 'password');
    userIDs.push(userTwo.id);

    const userTwoLogin = await request(app)
      .post('/auth/login')
      .send({ username: 'test-convo-user-2', password: 'password' });

    const convoResponse = await request(app)
      .post('/conversations')
      .send({
        conversation: { name: 'test-user-2-convo-1' },
        user_ids: [userOne.id],
      })
      .set('Accept', 'application/json')
      .set('Authorization', `${userTwoLogin.body.token}`);
    conversationIDs.push(convoResponse.body.id);

    const response = await request(app)
      .put(`/conversations/${convoResponse.body.id}`)
      .send({ name: '' })
      .set('Accept', 'application/json')
      .set('Authorization', `${userTwoLogin.body.token}`);

    expect(response.statusCode).toBe(400);
  });
});

describe('DELETE /conversations/{conversation_id}', () => {
  const userIDs: number[] = [];
  const conversationIDs: number[] = [];

  afterEach(async () => {
    if (userIDs && userIDs.length > 0) {
      for (const userID of userIDs) {
        await db.deleteFrom('user').where('id', '=', userID).execute();
        const refreshTokenManager = await RefreshTokenManager.getInstance();
        refreshTokenManager.invalidateRefreshToken(userID);
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

  it('should not be able to delete conversation if not logged in', async () => {
    const response = await request(app).delete('/conversations/1');
    expect(response.statusCode).toBe(401);
  });

  it('should be able to delete conversation if logged in', async () => {
    const authService = createAuthService(userStore);

    const userOne = await authService.signup('test-convo-user-1', 'password');
    userIDs.push(userOne.id);

    const userTwo = await authService.signup('test-convo-user-2', 'password');
    userIDs.push(userTwo.id);

    const userTwoLogin = await request(app)
      .post('/auth/login')
      .send({ username: 'test-convo-user-2', password: 'password' });

    const convoResponse = await request(app)
      .post('/conversations')
      .send({
        conversation: { name: 'test-user-2-convo-1' },
        user_ids: [userOne.id],
      })
      .set('Accept', 'application/json')
      .set('Authorization', `${userTwoLogin.body.token}`);
    conversationIDs.push(convoResponse.body.id);

    const deleteResponse = await request(app)
      .delete(`/conversations/${convoResponse.body.id}`)
      .set('Accept', 'application/json')
      .set('Authorization', `${userTwoLogin.body.token}`);

    expect(deleteResponse.statusCode).toBe(200);
    expect(deleteResponse.body.id).toBe(convoResponse.body.id);
    expect(deleteResponse.body.name).toBe('test-user-2-convo-1');

    const getResponse = await request(app)
      .get(`/conversations/${convoResponse.body.id}`)
      .set('Accept', 'application/json')
      .set('Authorization', `${userTwoLogin.body.token}`);

    expect(getResponse.statusCode).toBe(404);
  });

  it('should get 403 if logged in but not in conversation', async () => {
    const authService = createAuthService(userStore);

    const userOne = await authService.signup('test-convo-user-1', 'password');
    userIDs.push(userOne.id);

    const userTwo = await authService.signup('test-convo-user-2', 'password');
    userIDs.push(userTwo.id);

    const userOneLogin = await request(app)
      .post('/auth/login')
      .send({ username: 'test-convo-user-1', password: 'password' });

    const convoOneAndTwo = await request(app)
      .post('/conversations')
      .send({
        conversation: { name: 'conversation between user one and user two' },
        user_ids: [userTwo.id],
      })
      .set('Accept', 'application/json')
      .set('Authorization', `${userOneLogin.body.token}`);
    conversationIDs.push(convoOneAndTwo.body.id);

    const userThree = await authService.signup('test-convo-user-3', 'password');
    userIDs.push(userThree.id);

    const userThreeLogin = await request(app)
      .post('/auth/login')
      .send({ username: 'test-convo-user-3', password: 'password' });

    const response = await request(app)
      .delete(`/conversations/${convoOneAndTwo.body.id}`)
      .set('Accept', 'application/json')
      .set('Authorization', `${userThreeLogin.body.token}`);

    expect(response.statusCode).toBe(403);
  });
});
