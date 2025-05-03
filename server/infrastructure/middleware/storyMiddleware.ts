import { Request, Response, NextFunction } from "express";

export const validateStoryInput = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { mediaUrl, mediaType, expiresAt } = req.body;

  if (!mediaUrl || !mediaType || !expiresAt) {
    res.status(400).json({ message: "Missing required story fields." });
    return;
  }

  next();
};
