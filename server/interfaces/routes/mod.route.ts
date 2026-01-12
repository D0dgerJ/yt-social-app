import { Router } from 'express';
import { authMiddleware } from '../../infrastructure/middleware/authMiddleware.ts';
import { requireModerator } from '../../infrastructure/middleware/requireRole.ts';

const router = Router();

/**
 * Контрольный эндпоинт для проверки ролей.
 * Доступ: MODERATOR+
 */
router.get('/ping', authMiddleware, requireModerator, (req, res) => {
  res.status(200).json({
    ok: true,
    message: 'mod pong',
    user: {
      id: req.user?.id,
      role: req.user?.role,
    },
  });
});

export default router;
