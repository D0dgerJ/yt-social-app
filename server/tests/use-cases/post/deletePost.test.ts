import { describe, it, expect } from '@jest/globals';
import { deletePost } from '../../../application/use-cases/post/deletePost';

describe('deletePost use-case', () => {
  it('should delete a post by ID', async () => {
    const result = await deletePost(1); // ID заменить при необходимости

    expect(result).toBeTruthy();
  });
});
