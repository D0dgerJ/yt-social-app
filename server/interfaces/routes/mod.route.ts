import { Router } from 'express';
import { ModerationActionType, ModerationTargetType } from '@prisma/client';
import { logModerationAction } from '../../application/services/moderation/logModerationAction.ts';
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

router.post('/log-test', authMiddleware, requireModerator, async (req, res) => {
  const entry = await logModerationAction({
    actorId: req.user?.id ?? null,
    actionType: ModerationActionType.NOTE,
    targetType: ModerationTargetType.OTHER,
    targetId: 'mod.log-test',
    reason: 'Step 3 smoke test',
    metadata: {
      ip: req.ip,
      ua: req.get('user-agent'),
    },
  });

  res.status(201).json({ ok: true, entry });
});

export default router;
