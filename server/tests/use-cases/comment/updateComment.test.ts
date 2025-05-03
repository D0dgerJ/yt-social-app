import { describe, it, expect } from '@jest/globals';
import { updateComment } from '../../../application/use-cases/comment/updateComment';

describe('updateComment use-case', () => {
  it('should update comment text', async () => {
    const result = await updateComment(1, 'Updated comment text'); // ID заменить при необходимости

    expect(result).toHaveProperty('text', 'Updated comment text');
  });
});
