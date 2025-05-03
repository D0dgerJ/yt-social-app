import { describe, it, expect } from '@jest/globals';
import { deleteMessage } from '../../../application/use-cases/chat/deleteMessage';

describe('deleteMessage use-case', () => {
  it('should delete a message by ID', async () => {
    const result = await deleteMessage(1); // заменить на актуальный ID

    expect(result).toBeTruthy();
  });
});
