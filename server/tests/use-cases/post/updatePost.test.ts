import { describe, it, expect } from '@jest/globals';
import { updatePost } from '../../../application/use-cases/post/updatePost';

describe('updatePost use-case', () => {
  it('should update a post', async () => {
    const result = await updatePost(1, { desc: 'Updated post text' });

    expect(result).toHaveProperty('desc', 'Updated post text');
  });
});
