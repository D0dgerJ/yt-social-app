import request from 'supertest';
import app from '../../interfaces/app.js';
import { cleanupDatabase, disconnectDatabase } from '../helpers/db.js';

describe('Protected routes auth guard', () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  afterAll(async () => {
    await cleanupDatabase();
    await disconnectDatabase();
  });

  it('should return 401 when no token is provided', async () => {
    const response = await request(app).get('/api/v1/users/profile');

    expect(response.status).toBe(401);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: 'Unauthorized',
        code: 'UNAUTHORIZED',
      })
    );
  });

  it('should return 401 when token is invalid', async () => {
    const response = await request(app)
      .get('/api/v1/users/profile')
      .set('Authorization', 'Bearer invalid_token');

    expect(response.status).toBe(401);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: 'Unauthorized',
        code: 'UNAUTHORIZED',
      })
    );
  });
});