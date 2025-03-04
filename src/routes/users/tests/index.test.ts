import app from '../../../index';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import createAuthService from '../../auth/service';
import userStore from '../store';
import { db } from '../../../database/database';

describe('GET /users', () => {
  let userIDs: number[] = [];

  afterEach(async () => {
    if (userIDs && userIDs.length > 0) {
      for (const userID of userIDs) {
        await db.deleteFrom('user').where('id', '=', userID).execute();
      }
    }
  });

  it('should not be able to view user info if not logged in', async () => {
    const authService = createAuthService(userStore);
    const userResponse = await authService.signup('test-user-1', 'password');
    userIDs = [userResponse.id];
    const response = await request(app).get(`/users/${userIDs[0]}`);
    expect(response.statusCode).toBe(401);
  });

  it('should be able to view own user info if logged in', async () => {
    const authService = createAuthService(userStore);
    const userResponse = await authService.signup('test-user-2', 'password');
    userIDs = [userResponse.id];

    const loginResponse = await authService.login('test-user-2', 'password');

    const response = await request(app)
      .get(`/users/${userIDs[0]}`)
      .set('Accept', 'application/json')
      .set('Authorization', `${loginResponse.token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.id).toBe(userIDs[0]);
    expect(response.body.username).toBe('test-user-2');
  });

  it('should not be able to view other user info if logged in', async () => {
    const authService = createAuthService(userStore);
    let userResponse = await authService.signup('test-user-3', 'password');
    userIDs = [userResponse.id];
    userResponse = await authService.signup('test-user-4', 'password');
    userIDs.push(userResponse.id);

    const loginResponse = await authService.login('test-user-3', 'password');

    const response = await request(app)
      .get(`/users/${userIDs[1]}`)
      .set('Accept', 'application/json')
      .set('Authorization', `${loginResponse.token}`);

    expect(response.statusCode).toBe(403);
  });
});

describe('GET /users/search', () => {
  const usernamePrefix = 'test-user-search-user';
  let userIDs: number[];

  afterEach(async () => {
    if (userIDs && userIDs.length > 0) {
      for (const userID of userIDs) {
        await db.deleteFrom('user').where('id', '=', userID).execute();
      }
    }
  });

  it('should not be able to search for user if not logged in', async () => {
    const response = await request(app).get(
      `/users/search?username=test-user-5`
    );
    expect(response.statusCode).toBe(401);
  });

  it('should be able to search for a single user if logged in', async () => {
    const authService = createAuthService(userStore);
    const userResponse = await authService.signup(
      `${usernamePrefix}1`,
      'password'
    );
    userIDs = [userResponse.id];

    const loginResponse = await authService.login(
      userResponse.username,
      'password'
    );

    const response = await request(app)
      .get(`/users/search?usernames=${userResponse.username}`)
      .set('Accept', 'application/json')
      .set('Authorization', `${loginResponse.token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0].id).toBe(userResponse.id);
    expect(response.body[0].username).toBe(userResponse.username);
  });

  it('should be able to search for multiple users if logged in', async () => {
    const authService = createAuthService(userStore);
    const userResponse1 = await authService.signup(
      `${usernamePrefix}1`,
      'password'
    );
    const userResponse2 = await authService.signup(
      `${usernamePrefix}2`,
      'password'
    );
    userIDs = [userResponse1.id, userResponse2.id];

    const loginResponse = await authService.login(
      userResponse1.username,
      'password'
    );

    const response = await request(app)
      .get(
        `/users/search?usernames=${userResponse1.username}&usernames=${userResponse2.username}`
      )
      .set('Accept', 'application/json')
      .set('Authorization', `${loginResponse.token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(2);
    expect(response.body[0].id).toBe(userResponse1.id);
    expect(response.body[0].username).toBe(userResponse1.username);
    expect(response.body[1].id).toBe(userResponse2.id);
    expect(response.body[1].username).toBe(userResponse2.username);
  });
});

describe('GET /users/validate', () => {
  const usernamePrefix = 'test-user-validate-user';
  let userIDs: number[];

  afterEach(async () => {
    if (userIDs && userIDs.length > 0) {
      for (const userID of userIDs) {
        await db.deleteFrom('user').where('id', '=', userID).execute();
      }
    }
  });

  it('user name should be taken if in use', async () => {
    const authService = createAuthService(userStore);
    const userResponse = await authService.signup(
      `${usernamePrefix}1`,
      'password'
    );
    userIDs = [userResponse.id];

    const response = await request(app).get(
      `/users/validate?username=${userResponse.username}`
    );

    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe('taken');
  });

  it('user name should be available if not in use', async () => {
    const authService = createAuthService(userStore);

    const userResponse = await authService.signup(
      `${usernamePrefix}1`,
      'password'
    );
    userIDs = [userResponse.id];

    const response = await request(app).get(
      `/users/validate?username=${userResponse.username}1`
    );

    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe('available');
  });
});

describe('DELETE /users/:id', () => {
  const usernamePrefix = 'test-user-delete-user';
  let userIDs: number[];

  afterEach(async () => {
    if (userIDs && userIDs.length > 0) {
      for (const userID of userIDs) {
        await db.deleteFrom('user').where('id', '=', userID).execute();
      }
    }
  });

  it('should not be able to delete user if not logged in', async () => {
    const response = await request(app).delete(`/users/1`);
    expect(response.statusCode).toBe(401);
  });

  it('should not be able to delete user if not authorized', async () => {
    const authService = createAuthService(userStore);

    const userResponse1 = await authService.signup(
      `${usernamePrefix}1`,
      'password'
    );
    userIDs = [userResponse1.id];

    const userResponse2 = await authService.signup(
      `${usernamePrefix}2`,
      'password'
    );
    userIDs.push(userResponse2.id);

    const loginResponse = await authService.login(
      userResponse1.username,
      'password'
    );

    const response = await request(app)
      .delete(`/users/${userResponse2.id}`)
      .set('Accept', 'application/json')
      .set('Authorization', `${loginResponse.token}`);

    expect(response.statusCode).toBe(403);
  });

  it('should be able to delete user if authorized', async () => {
    const authService = createAuthService(userStore);
    const userResponse = await authService.signup(
      `${usernamePrefix}1`,
      'password'
    );
    userIDs = [userResponse.id];

    const loginResponse = await authService.login(
      userResponse.username,
      'password'
    );

    const response = await request(app)
      .delete(`/users/${userResponse.id}`)
      .set('Accept', 'application/json')
      .set('Authorization', `${loginResponse.token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('User deleted');
  });

  it('should be able to delete user if authorized and user has no conversations', async () => {
    const authService = createAuthService(userStore);
    const userResponse = await authService.signup(
      `${usernamePrefix}1`,
      'password'
    );
    userIDs = [userResponse.id];

    const loginResponse = await authService.login(
      userResponse.username,
      'password'
    );

    const response = await request(app)
      .delete(`/users/${userResponse.id}`)
      .set('Accept', 'application/json')
      .set('Authorization', `${loginResponse.token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('User deleted');
  });

  it('should be able to delete user if authorized and user should be removed from any conversations they ar in', async () => {
    const authService = createAuthService(userStore);
    const userResponse1 = await authService.signup(
      `${usernamePrefix}1`,
      'password'
    );
    userIDs = [userResponse1.id];

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

    const loginResponse1 = await authService.login(
      userResponse1.username,
      'password'
    );

    // Create a conversation with user 1, user 2 and user 3
    const conversationResponse = await request(app)
      .post('/conversations')
      .set('Accept', 'application/json')
      .set('Authorization', `${loginResponse1.token}`)
      .send({
        conversation: { name: 'Test Conversation' },
        user_ids: [userResponse2.id, userResponse3.id],
      });

    expect(conversationResponse.statusCode).toBe(201);
    expect(conversationResponse.body.id).toBeDefined();

    const conversationID = conversationResponse.body.id;

    const response = await request(app)
      .delete(`/users/${userResponse1.id}`)
      .set('Accept', 'application/json')
      .set('Authorization', `${loginResponse1.token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('User deleted');

    const loginResponse2 = await authService.login(
      userResponse2.username,
      'password'
    );

    const conversationUsersResponse = await request(app)
      .get(`/conversations/${conversationID}/users`)
      .set('Accept', 'application/json')
      .set('Authorization', `${loginResponse2.token}`);

    expect(conversationUsersResponse.statusCode).toBe(200);
    expect(conversationUsersResponse.body.length).toBe(2);
    expect(conversationUsersResponse.body[0].id).toBe(userResponse2.id);
    expect(conversationUsersResponse.body[1].id).toBe(userResponse3.id);
  });

  it('should be able to delete user if authorized and user should be removed from any conversations they are in, and if they are the only user in the conversation, the conversation should be deleted', async () => {
    const authService = createAuthService(userStore);
    const userResponse1 = await authService.signup(
      `${usernamePrefix}1`,
      'password'
    );
    userIDs = [userResponse1.id];

    const userResponse2 = await authService.signup(
      `${usernamePrefix}2`,
      'password'
    );
    userIDs.push(userResponse2.id);

    const loginResponse1 = await authService.login(
      userResponse1.username,
      'password'
    );

    const conversationResponse1 = await request(app)
      .post('/conversations')
      .set('Accept', 'application/json')
      .set('Authorization', `${loginResponse1.token}`)
      .send({
        conversation: { name: 'Test Conversation' },
        user_ids: [userResponse2.id],
      });

    expect(conversationResponse1.statusCode).toBe(201);
    expect(conversationResponse1.body.id).toBeDefined();

    const conversationID = conversationResponse1.body.id;

    // Check that the conversation was created
    const conversation = await db
      .selectFrom('conversation')
      .where('id', '=', conversationID)
      .selectAll()
      .executeTakeFirst();

    expect(conversation).toBeDefined();

    // Check that their are 2 conversation users
    const conversationUsers1 = await db
      .selectFrom('conversation_user')
      .where('conversation_id', '=', conversationID)
      .selectAll()
      .execute();

    expect(conversationUsers1.length).toBe(2);

    const deleteResponse1 = await request(app)
      .delete(`/users/${userResponse1.id}`)
      .set('Accept', 'application/json')
      .set('Authorization', `${loginResponse1.token}`);

    expect(deleteResponse1.statusCode).toBe(200);
    expect(deleteResponse1.body.message).toBe('User deleted');

    const loginResponse2 = await authService.login(
      userResponse2.username,
      'password'
    );

    // Check that the conversation still exists
    const conversationResponse2 = await request(app)
      .get(`/conversations/${conversationID}`)
      .set('Accept', 'application/json')
      .set('Authorization', `${loginResponse2.token}`);

    expect(conversationResponse2.statusCode).toBe(200);
    expect(conversationResponse2.body.id).toBe(conversationID);

    // Check that the conversation only has user 2 in it
    const conversationUsersResponse2 = await request(app)
      .get(`/conversations/${conversationID}/users`)
      .set('Accept', 'application/json')
      .set('Authorization', `${loginResponse2.token}`);

    expect(conversationUsersResponse2.statusCode).toBe(200);
    expect(conversationUsersResponse2.body.length).toBe(1);
    expect(conversationUsersResponse2.body[0].id).toBe(userResponse2.id);

    // Delete user 2
    const deleteResponse2 = await request(app)
      .delete(`/users/${userResponse2.id}`)
      .set('Accept', 'application/json')
      .set('Authorization', `${loginResponse2.token}`);

    expect(deleteResponse2.statusCode).toBe(200);
    expect(deleteResponse2.body.message).toBe('User deleted');

    // Check that the converation was deleted
    const conversations = await db
      .selectFrom('conversation')
      .where('id', '=', conversationID)
      .selectAll()
      .execute();

    expect(conversations.length).toBe(0);

    // Check that the conversation users were deleted
    const conversationUsers2 = await db
      .selectFrom('conversation_user')
      .where('conversation_id', '=', conversationID)
      .selectAll()
      .execute();

    expect(conversationUsers2.length).toBe(0);
  });
});
