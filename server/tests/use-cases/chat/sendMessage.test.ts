import { describe, it, expect } from '@jest/globals';
import { sendMessage } from '../../../application/use-cases/chat/sendMessage';

describe('sendMessage use-case', () => {
  it('should send a message to a conversation', async () => {
    const result = await sendMessage({
      conversationId: 1,
      senderId: 1,
      text: 'Hello!',
    });

    expect(result).toHaveProperty('id');
    expect(result.text).toBe('Hello!');
  });
});
