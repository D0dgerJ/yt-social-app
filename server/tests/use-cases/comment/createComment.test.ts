import { describe, it, expect } from '@jest/globals';
import { createComment } from '../../../application/use-cases/notification/createComment';

describe('createComment use-case', () => {
  it('should create a comment', async () => {
    const result = await createComment({
      userId: 1,
      postId: 1,
      text: 'This is a comment',
    });

    expect(result).toHaveProperty('id');
    expect(result.text).toBe('This is a comment');
  });
});
