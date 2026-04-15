import request from 'supertest';
import app from '../../interfaces/app.js';
import { cleanupDatabase, disconnectDatabase } from '../helpers/db.js';

describe('POST /api/v1/auth/login', () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  afterAll(async () => {
    await cleanupDatabase();
    await disconnectDatabase();
  });

  it('should login an existing user', async () => {
    const registerPayload = {
      username: 'dodger_login_user',
      email: 'dodger_login_test@example.com',
      password: 'strong_password_123',
    };

    await request(app).post('/api/v1/auth/register').send(registerPayload);

    const response = await request(app).post('/api/v1/auth/login').send({
      email: registerPayload.email,
      password: registerPayload.password,
    });

    expect(response.status).toBe(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        username: registerPayload.username,
        email: registerPayload.email,
        token: expect.any(String),
        role: expect.any(String),
      })
    );
  });

  it('should return 401 for wrong password', async () => {
    const registerPayload = {
      username: 'dodger_login_user',
      email: 'dodger_login_test@example.com',
      password: 'strong_password_123',
    };

    await request(app).post('/api/v1/auth/register').send(registerPayload);

    const response = await request(app).post('/api/v1/auth/login').send({
      email: registerPayload.email,
      password: 'wrong_password',
    });

    expect(response.status).toBe(401);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: 'Invalid credentials',
      })
    );
  });

  it('should return 401 if user does not exist', async () => {
    const response = await request(app).post('/api/v1/auth/login').send({
      email: 'missing_user@example.com',
      password: 'some_password',
    });

    expect(response.status).toBe(401);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: 'User not found',
      })
    );
  });
});