import { Router, Request, Response } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { sendSuccess } from '../../utils/response';

const router = Router();
router.use(authenticate);

// In-memory notification state or default notifications per user
router.get('/', (req: Request, res: Response) => {
  const user = req.user;
  const now = new Date().toISOString();
  const notifications = [
    {
      id: 1,
      userId: user?.userId,
      title: 'Welcome to StudyBuddy',
      message: 'Explore courses, resources, and study groups or start teaching today!',
      isRead: false,
      read: false,
      type: 'system',
      createdAt: now,
    },
  ];

  sendSuccess(res, notifications);
});

router.put('/:id/read', (_req: Request, res: Response) => {
  sendSuccess(res, { success: true });
});

router.put('/read-all', (_req: Request, res: Response) => {
  sendSuccess(res, { success: true });
});

export default router;
