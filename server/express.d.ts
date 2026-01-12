import { User } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: User['id'];
        role?: User['role'];
      };
    }
  }
}

export {};