import { Router } from 'express';
import { categoryService } from './categories.service';
import { sendSuccess } from '../../utils/response';
import { Request, Response, NextFunction } from 'express';

const router = Router();

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try { sendSuccess(res, await categoryService.list()); } catch (err) { next(err); }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try { sendSuccess(res, await categoryService.getById(Number(req.params.id))); } catch (err) { next(err); }
});

export default router;
