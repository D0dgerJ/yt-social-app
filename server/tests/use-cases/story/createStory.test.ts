import { describe, it, expect } from '@jest/globals';
import { createStory } from '../../../application/use-cases/story/createStory';

describe('createStory use-case', () => {
  it('should create a story', async () => {
    const result = await createStory({
      userId: 1,
      img: 'https://example.com/test.jpg',
    });

    expect(result).toHaveProperty('id');
  });
});
