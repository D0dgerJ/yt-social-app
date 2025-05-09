import { Request, Response } from 'express';
import * as storyController from '../../../interfaces/controllers/story.controller';
import * as storyUseCases from '../../../application/use-cases/story';

jest.mock('../../../application/use-cases/story');

const mockRes = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
  end: jest.fn(),
};

describe('Story Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a story', async () => {
    const mockReq = {
      user: { id: 1 },
      body: {
        mediaUrl: 'http://example.com/story.jpg',
        mediaType: 'image',
        expiresAt: new Date(),
      },
    } as unknown as Request;

    (storyUseCases.createStory as jest.Mock).mockResolvedValueOnce({ id: 1 });

    await storyController.create(mockReq, mockRes as unknown as Response);

    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith({ id: 1 });
  });

  it('should delete a story', async () => {
    const mockReq = { params: { id: '1' } } as unknown as Request;
    (storyUseCases.deleteStory as jest.Mock).mockResolvedValueOnce(undefined);

    await storyController.remove(mockReq, mockRes as unknown as Response);

    expect(mockRes.status).toHaveBeenCalledWith(204);
    expect(mockRes.end).toHaveBeenCalled();
  });

  it('should get stories by user', async () => {
    const mockReq = { params: { userId: '1' } } as unknown as Request;
    (storyUseCases.getUserStories as jest.Mock).mockResolvedValueOnce([{ id: 1 }]);

    await storyController.getByUser(mockReq, mockRes as unknown as Response);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith([{ id: 1 }]);
  });

  it('should get feed stories', async () => {
    const mockReq = { user: { id: 1 } } as unknown as Request;
    (storyUseCases.getFeedStories as jest.Mock).mockResolvedValueOnce([{ id: 2 }]);

    await storyController.getFeed(mockReq, mockRes as unknown as Response);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith([{ id: 2 }]);
  });

  it('should get friend stories', async () => {
    const mockReq = { user: { id: 1 } } as unknown as Request;
    (storyUseCases.getFriendStories as jest.Mock).mockResolvedValueOnce([{ id: 3 }]);

    await storyController.getStoriesOfFriends(mockReq, mockRes as unknown as Response);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith([{ id: 3 }]);
  });

  it('should mark a story as viewed', async () => {
    const mockReq = { user: { id: 1 }, params: { storyId: '5' } } as unknown as Request;
    (storyUseCases.viewStory as jest.Mock).mockResolvedValueOnce(undefined);

    await storyController.view(mockReq, mockRes as unknown as Response);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Story viewed' });
  });

  it('should get story by ID', async () => {
    const mockReq = { params: { storyId: '6' } } as unknown as Request;
    (storyUseCases.getStoryById as jest.Mock).mockResolvedValueOnce({ id: 6 });

    await storyController.getById(mockReq, mockRes as unknown as Response);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ id: 6 });
  });
});
