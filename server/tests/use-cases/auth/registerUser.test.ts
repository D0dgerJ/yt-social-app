import { describe, it, expect } from '@jest/globals';
import { registerUser } from '../../../application/use-cases/auth/registerUser';

describe('registerUser use-case', () => {
  it('should register a new user', async () => {
    const result = await registerUser({
      username: 'newuser',
      email: 'newuser@example.com',
      password: '123456',
    });

    expect(result).toHaveProperty('id');
    expect(result.username).toBe('newuser');
  });
});
