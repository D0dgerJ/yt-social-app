import { Request, Response, NextFunction } from "express";

export const checkOwnership =
  (getUserId: (req: Request) => Promise<number | undefined>) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ownerId = await getUserId(req);

      if (!ownerId) {
        res.status(404).json({ message: "Not found" });
        return;
      }

      if (req.user?.id !== ownerId) {
        res.status(403).json({ message: "Forbidden" });
        return;
      }

      next();
    } catch {
      res.status(500).json({ message: "Ownership check failed" });
    }
  };