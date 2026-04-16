import { jest } from '@jest/globals';

export const mockIo = {
  to: jest.fn(() => ({
    emit: jest.fn(),
    except: jest.fn(() => ({
      emit: jest.fn(),
    })),
  })),
  emit: jest.fn(),
};

jest.unstable_mockModule('../../infrastructure/websocket/socket.js', () => ({
  getIO: () => mockIo,
}));