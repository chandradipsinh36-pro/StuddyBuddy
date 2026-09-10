import { Router, Request, Response, NextFunction } from 'express';
import { playlistsService } from './playlists.service';
import { authenticate, authenticateOptional } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { sendSuccess } from '../../utils/response';
import { NotFoundError } from '../../utils/AppError';

const router = Router();

// ── Public Routes (mounted at /api/playlists) ─────────────────────────
router.get('/', authenticateOptional, (req: Request, res: Response, next: NextFunction) => {
  try {
    const list = playlistsService.list(req.query as any);
    sendSuccess(res, list);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', authenticateOptional, (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    const item = playlistsService.getById(id);
    if (!item) throw new NotFoundError('Playlist');
    sendSuccess(res, item);
  } catch (err) {
    next(err);
  }
});

// Tutor creation from /api/playlists
router.post('/', authenticate, (req: Request, res: Response, next: NextFunction) => {
  try {
    const tutor = {
      id: req.user!.userId,
      name: (req.user as any).name || 'Verified Tutor',
    };
    const created = playlistsService.create(tutor, req.body);
    sendSuccess(res, created, { statusCode: 201 });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', authenticate, (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    const updated = playlistsService.update(id, req.body);
    if (!updated) throw new NotFoundError('Playlist');
    sendSuccess(res, updated);
  } catch (err) {
    next(err);
  }
});

router.put('/:id/reorder', authenticate, (req: Request, res: Response, next: NextFunction) => {
  try {
    sendSuccess(res, { success: true });
  } catch (err) {
    next(err);
  }
});

router.post('/:playlistId/resources/:resourceId/complete', authenticate, (req: Request, res: Response, next: NextFunction) => {
  try {
    const pId = parseInt(req.params.playlistId, 10);
    const rId = parseInt(req.params.resourceId, 10);
    playlistsService.markResourceComplete(pId, rId);
    sendSuccess(res, { completed: true });
  } catch (err) {
    next(err);
  }
});

export default router;

// ── Tutor Routes (mounted at /api/tutor/playlists) ───────────────────
export const tutorPlaylistsRouter = Router();
tutorPlaylistsRouter.use(authenticate);

tutorPlaylistsRouter.get('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const tutorId = req.user?.userId;
    const list = playlistsService.listByTutor(tutorId);
    sendSuccess(res, list);
  } catch (err) {
    next(err);
  }
});
