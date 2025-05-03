import { describe, it, expect } from '@jest/globals';
import { likePost } from '../../../application/use-cases/post/likePost';

describe('likePost use-case', () => {
  it('should like a post', async () => {
    const result = await likePost({ userId: 1, postId: 1 });

    expect(result).toBeTruthy();
  });
});
