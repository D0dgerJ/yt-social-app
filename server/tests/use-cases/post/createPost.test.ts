import { describe, it, expect } from '@jest/globals';
import { createPost } from '../../../application/use-cases/post/createPost';

describe('createPost use-case', () => {
  it('should create a post', async () => {
    const result = await createPost({
      userId: 1,
      desc: 'Test post content',
    });

    expect(result).toHaveProperty('id');
    expect(result.desc).toBe('Test post content');
  });
});
