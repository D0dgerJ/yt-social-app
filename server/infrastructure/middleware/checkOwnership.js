export const checkOwnership = (getOwnerIdFn) => {
  return async (req, res, next) => {
    try {
      const ownerId = await getOwnerIdFn(req);

      if (!ownerId) {
        return res.status(404).json({ message: "Resource not found" });
      }

      if (ownerId !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({ message: "Forbidden: not the owner" });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};