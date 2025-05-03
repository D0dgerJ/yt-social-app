import { describe, it, expect } from '@jest/globals';
import { savePost } from '../../../application/use-cases/post/savePost';

describe('savePost use-case', () => {
  it('should save a post', async () => {
    const result = await savePost({ userId: 1, postId: 1 });

    expect(result).toBeTruthy();
  });
});
