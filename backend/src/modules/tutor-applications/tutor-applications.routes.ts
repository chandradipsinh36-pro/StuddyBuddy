import { Router } from 'express';
import { tutorApplicationsController } from './tutor-applications.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import {
  createApplicationSchema, updateApplicationSchema, addDocumentSchema,
} from './tutor-applications.schema';

const router = Router();

router.use(authenticate, authorize('tutor'));

router.post('/',                     validate(createApplicationSchema), tutorApplicationsController.create);
router.get('/me',                    tutorApplicationsController.getMine);
router.patch('/me',                  validate(updateApplicationSchema), tutorApplicationsController.updateMine);
router.post('/me/documents',         validate(addDocumentSchema), tutorApplicationsController.addDocument);
router.get('/me/documents',          tutorApplicationsController.listDocuments);
router.delete('/me/documents/:docId', tutorApplicationsController.deleteDocument);

export default router;
