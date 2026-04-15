import request from 'supertest';
import app from '../../interfaces/app.js';
import { cleanupDatabase, disconnectDatabase } from '../helpers/db.js';

describe('POST /api/v1/auth/register', () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  afterAll(async () => {
    await cleanupDatabase();
    await disconnectDatabase();
  });

  it('should register a new user', async () => {
    const response = await request(app).post('/api/v1/auth/register').send({
      username: 'dodger_test_user',
      email: 'dodger_register_test@example.com',
      password: 'strong_password_123',
    });

    expect(response.status).toBe(201);

    expect(response.body).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        username: 'dodger_test_user',
        email: 'dodger_register_test@example.com',
        token: expect.any(String),
        role: expect.any(String),
      })
    );
  });

  it('should return 400 if user with same email already exists', async () => {
    const payload = {
      username: 'dodger_test_user',
      email: 'dodger_register_test@example.com',
      password: 'strong_password_123',
    };

    await request(app).post('/api/v1/auth/register').send(payload);

    const secondResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        ...payload,
        username: 'another_username',
      });

    expect(secondResponse.status).toBe(400);
    expect(secondResponse.body).toEqual(
      expect.objectContaining({
        message: 'User already exists',
      })
    );
  });
});