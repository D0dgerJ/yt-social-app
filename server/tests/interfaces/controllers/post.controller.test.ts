import { Request, Response } from 'express';
import * as postController from '../../../interfaces/controllers/post.controller';
import * as postUseCases from '../../../application/use-cases/post';

jest.mock('../../../application/use-cases/post');

const mockRes = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
  send: jest.fn(),
};

describe('Post Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a post', async () => {
    const mockReq = {
      body: {
        userId: 1,
        desc: 'Test post',
        images: [],
        videos: [],
        files: [],
      },
    } as unknown as Request;

    (postUseCases.createPost as jest.Mock).mockResolvedValueOnce({ id: 1 });

    await postController.create(mockReq, mockRes as unknown as Response);

    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith({ id: 1 });
  });

  it('should update a post', async () => {
    const mockReq = {
      params: { id: '2' },
      body: {
        userId: 1,
        desc: 'Updated desc',
        images: [],
        videos: [],
        files: [],
      },
    } as unknown as Request;

    (postUseCases.updatePost as jest.Mock).mockResolvedValueOnce({ id: 2 });

    await postController.update(mockReq, mockRes as unknown as Response);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ id: 2 });
  });

  it('should delete a post', async () => {
    const mockReq = { body: { postId: 3 } } as unknown as Request;
    (postUseCases.deletePost as jest.Mock).mockResolvedValueOnce(undefined);

    await postController.remove(mockReq, mockRes as unknown as Response);

    expect(mockRes.status).toHaveBeenCalledWith(204);
    expect(mockRes.send).toHaveBeenCalled();
  });

  it('should toggle like', async () => {
    const mockReq = { user: { id: 1 }, body: { postId: 4 } } as unknown as Request;
    (postUseCases.toggleLike as jest.Mock).mockResolvedValueOnce({ liked: true });

    await postController.like(mockReq, mockRes as unknown as Response);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ liked: true });
  });

  it('should save a post', async () => {
    const mockReq = { user: { id: 1 }, body: { postId: 5 } } as unknown as Request;
    (postUseCases.savePost as jest.Mock).mockResolvedValueOnce({ saved: true });

    await postController.save(mockReq, mockRes as unknown as Response);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ saved: true });
  });

  it('should get user posts', async () => {
    const mockReq = { params: { userId: '1' } } as unknown as Request;
    (postUseCases.getUserPosts as jest.Mock).mockResolvedValueOnce([{ id: 1 }]);

    await postController.getUser(mockReq, mockRes as unknown as Response);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith([{ id: 1 }]);
  });

  it('should get feed posts', async () => {
    const mockReq = { user: { id: 1 } } as unknown as Request;
    (postUseCases.getFeedPosts as jest.Mock).mockResolvedValueOnce([{ id: 2 }]);

    await postController.getFeed(mockReq, mockRes as unknown as Response);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith([{ id: 2 }]);
  });

  it('should get post by ID', async () => {
    const mockReq = { params: { id: '3' } } as unknown as Request;
    (postUseCases.getPostById as jest.Mock).mockResolvedValueOnce({ id: 3 });

    await postController.getById(mockReq, mockRes as unknown as Response);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ id: 3 });
  });

  it('should unsave a post', async () => {
    const mockReq = { user: { id: 1 }, body: { postId: 6 } } as unknown as Request;
    (postUseCases.unsavePost as jest.Mock).mockResolvedValueOnce({ unsaved: true });

    await postController.unsave(mockReq, mockRes as unknown as Response);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ unsaved: true });
  });
});
