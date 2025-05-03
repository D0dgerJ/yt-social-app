import { describe, it, expect } from '@jest/globals';
import { createChat } from '../../../application/use-cases/chat/createChat';

describe('createChat use-case', () => {
  it('should create a new chat', async () => {
    const result = await createChat({ senderId: 1, receiverId: 2 });

    expect(result).toHaveProperty('id');
  });
});
