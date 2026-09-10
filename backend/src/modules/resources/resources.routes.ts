import { Router } from 'express';
import { resourcesController } from './resources.controller';
import { authenticate, authenticateOptional } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import {
  createResourceSchema, updateResourceSchema, resourceQuerySchema,
  addModerationLogSchema, addExtractedContentSchema, addVideoMetadataSchema,
} from './resources.schema';

const router = Router();

// Public
router.get('/', validate(resourceQuerySchema, 'query'), resourcesController.list);
router.get('/:id', authenticateOptional, resourcesController.getById);

// Resource categories (tutor)
router.post('/:id/categories/:categoryId', authenticate, authorize('tutor'), resourcesController.addCategory);
router.delete('/:id/categories/:categoryId', authenticate, authorize('tutor'), resourcesController.removeCategory);

export default router;

import { resourceUpload } from '../../middleware/resourceUpload';

// Tutor resource routes — mounted at /tutor/resources
export const tutorResourceRouter = Router();
tutorResourceRouter.use(authenticate, authorize('tutor'));
tutorResourceRouter.get('/', validate(resourceQuerySchema, 'query'), resourcesController.listMine);
tutorResourceRouter.post('/', resourceUpload.single('file'), resourcesController.create);
tutorResourceRouter.get('/:id', resourcesController.getMineById);
tutorResourceRouter.patch('/:id', resourceUpload.single('file'), resourcesController.update);
tutorResourceRouter.put('/:id', resourceUpload.single('file'), resourcesController.update);
tutorResourceRouter.delete('/:id', resourcesController.remove);

// Moderation storage (no AI)
tutorResourceRouter.post('/:id/moderation-logs', validate(addModerationLogSchema), resourcesController.addModerationLog);
tutorResourceRouter.get('/:id/moderation-logs', resourcesController.getModerationLogs);

// Video metadata storage (no AI)
tutorResourceRouter.put('/:id/video-metadata', validate(addVideoMetadataSchema), resourcesController.upsertVideoMetadata);

// Extracted content storage (no AI)
tutorResourceRouter.post('/:id/extracted-content', validate(addExtractedContentSchema), resourcesController.addExtractedContent);
