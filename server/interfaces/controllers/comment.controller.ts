import { Request, Response } from "express";
import { createComment } from "../../application/use-cases/comment/createComment.ts";
import { deleteComment } from "../../application/use-cases/comment/deleteComment.ts";
import { updateComment } from "../../application/use-cases/comment/updateComment.ts";
import { getPostComments } from "../../application/use-cases/comment/getPostComments.ts";
import prisma from "../../infrastructure/database/prismaClient.ts";

export const create = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { postId, content, files = [], images = [], videos = [] } = req.body;
    const comment = await createComment({ userId, postId, content, files, images, videos });
    res.status(201).json(comment);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const { commentId, content } = req.body;
    const updated = await updateComment({ commentId, content });
    res.status(200).json(updated);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const { commentId } = req.body;
    await deleteComment(commentId);
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getComments = async (req: Request, res: Response) => {
  try {
    const postId = Number(req.params.postId);
    const comments = await getPostComments(postId);
    res.status(200).json(comments);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getByPost = async (req: Request, res: Response) => {
  try {
    const postId = Number(req.params.postId);
    const comments = await prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: "asc" },
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

    res.status(200).json(comments);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
