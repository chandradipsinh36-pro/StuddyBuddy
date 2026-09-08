import { Router } from 'express';
import { usersController } from './users.controller';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { updateProfileSchema, changePasswordSchema } from './users.schema';

const router = Router();

router.use(authenticate);

router.get('/me',           usersController.getMe);
router.patch('/me',         validate(updateProfileSchema), usersController.updateMe);
router.patch('/me/password', validate(changePasswordSchema), usersController.changePassword);

export default router;
