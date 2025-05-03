import { Request, Response, NextFunction } from "express";

export const checkOwnership =
  (getUserId: (req: Request) => Promise<number | undefined>) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ownerId = await getUserId(req);

      if (req.user?.id !== ownerId) {
        res.status(403).json({ message: "Forbidden: Not the owner." });
        return;
      }

      next();
    } catch (error: any) {
      res.status(500).json({ message: "Ownership check failed", error: error.message });
    }
  };
