import * as commentController from '../../../interfaces/controllers/comment.controller';
import prisma from '../../../infrastructure/database/prismaClient';

import { createComment } from '../../../application/use-cases/comment/createComment';
import { updateComment } from '../../../application/use-cases/comment/updateComment';
import { deleteComment } from '../../../application/use-cases/comment/deleteComment';
import { getPostComments } from '../../../application/use-cases/comment/getPostComments';
import { Request, Response } from 'express';

jest.mock('../../../application/use-cases/comment/createComment');
jest.mock('../../../application/use-cases/comment/updateComment');
jest.mock('../../../application/use-cases/comment/deleteComment');
jest.mock('../../../application/use-cases/comment/getPostComments');
jest.mock('../../../infrastructure/database/prismaClient', () => ({
  comment: {
    findMany: jest.fn(),
  },
}));

const mockRes = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
  send: jest.fn(),
} as unknown as Response;

describe('Comment Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a comment', async () => {
    const mockReq = {
      user: { id: 1 },
      body: {
        postId: 5,
        content: 'Nice post',
        images: [],
        videos: [],
        files: [],
      },
    } as unknown as Request;

    (createComment as jest.Mock).mockResolvedValue({ id: 10, content: 'Nice post' });

    await commentController.create(mockReq, mockRes);

    expect(createComment).toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith({ id: 10, content: 'Nice post' });
  });

  it('should update a comment', async () => {
    const mockReq = {
      body: {
        commentId: 10,
        content: 'Updated comment',
      },
    } as Request;

    (updateComment as jest.Mock).mockResolvedValue({ id: 10, content: 'Updated comment' });

    await commentController.update(mockReq, mockRes);

    expect(updateComment).toHaveBeenCalledWith({ commentId: 10, content: 'Updated comment' });
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ id: 10, content: 'Updated comment' });
  });

  it('should delete a comment', async () => {
    const mockReq = {
      body: {
        commentId: 10,
      },
    } as Request;

    await commentController.remove(mockReq, mockRes);

    expect(deleteComment).toHaveBeenCalledWith(10);
    expect(mockRes.status).toHaveBeenCalledWith(204);
    expect(mockRes.send).toHaveBeenCalled();
  });

  it('should get comments with getPostComments use case', async () => {
    const mockReq = {
      params: {
        postId: '5',
      },
    } as unknown as Request;

    (getPostComments as jest.Mock).mockResolvedValue([{ id: 1 }]);

    await commentController.getComments(mockReq, mockRes);

    expect(getPostComments).toHaveBeenCalledWith(5);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith([{ id: 1 }]);
  });

  it('should get comments directly from prisma in getByPost', async () => {
    const mockReq = {
      params: {
        postId: '8',
      },
    } as unknown as Request;

    (prisma.comment.findMany as jest.Mock).mockResolvedValue([{ id: 1 }]);

    await commentController.getByPost(mockReq, mockRes);

    expect(prisma.comment.findMany).toHaveBeenCalledWith({
      where: { postId: 8 },
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
          },
        },
      },
    });

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith([{ id: 1 }]);
  });
});
