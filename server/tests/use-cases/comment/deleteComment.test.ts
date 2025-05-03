import { describe, it, expect } from '@jest/globals';
import { deleteComment } from '../../../application/use-cases/comment/deleteComment';

describe('deleteComment use-case', () => {
  it('should delete a comment by ID', async () => {
    const result = await deleteComment(1); // ID комментария

    expect(result).toBeTruthy();
  });
});
