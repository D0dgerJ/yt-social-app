import { register, login } from '../../../interfaces/controllers/auth.controller';
import { registerUser } from '../../../application/use-cases/auth/registerUser';
import { loginUser } from '../../../application/use-cases/auth/loginUser';

jest.mock('../../../application/use-cases/auth/registerUser');
jest.mock('../../../application/use-cases/auth/loginUser');

describe('Auth Controller', () => {
  const mockReq = {} as any;
  const mockRes = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should return token on success', async () => {
      (registerUser as jest.Mock).mockResolvedValue('test-token');
      mockReq.body = { username: 'user', email: 'user@example.com', password: 'pass123' };

      await register(mockReq, mockRes);

      expect(registerUser).toHaveBeenCalledWith(mockReq.body);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({ token: 'test-token' });
    });

    it('should handle error', async () => {
      (registerUser as jest.Mock).mockRejectedValue(new Error('Registration failed'));

      await register(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Registration failed' });
    });
  });

  describe('login', () => {
    it('should return token on success', async () => {
      (loginUser as jest.Mock).mockResolvedValue('token-123');
      mockReq.body = { email: 'user@example.com', password: 'pass123' };

      await login(mockReq, mockRes);

      expect(loginUser).toHaveBeenCalledWith(mockReq.body);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ token: 'token-123' });
    });

    it('should handle login error', async () => {
      (loginUser as jest.Mock).mockRejectedValue(new Error('Invalid credentials'));

      await login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
    });
  });
});
