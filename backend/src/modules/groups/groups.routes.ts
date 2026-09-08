import { Router } from 'express';
import { groupsService } from './groups.service';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import {
  createGroupSchema, updateGroupSchema, sendMessageSchema,
  reportMessageSchema, groupPaymentSchema, groupQuerySchema, messageQuerySchema,
} from './groups.schema';
import { reportLimiter, messageLimiter } from '../../middleware/rateLimiter';
import { sendSuccess, sendPaginated } from '../../utils/response';
import { Request, Response, NextFunction } from 'express';

const h = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);

const router = Router();

// All group routes require authentication
router.use(authenticate);

// Group CRUD
router.get('/', validate(groupQuerySchema, 'query'), h(async (req, res) => {
  const { groups, total, page, limit } = await groupsService.listGroups(req.query as any);
  sendPaginated(res, groups, { total, page, limit });
}));

router.post('/', validate(createGroupSchema), h(async (req, res) =>
  sendSuccess(res, await groupsService.createGroup(req.user!.userId, req.body), { statusCode: 201 })
));

router.get('/:groupId', h(async (req, res) =>
  sendSuccess(res, await groupsService.getGroupById(Number(req.params.groupId), req.user!.userId))
));

router.patch('/:groupId', validate(updateGroupSchema), h(async (req, res) =>
  sendSuccess(res, await groupsService.updateGroup(req.user!.userId, Number(req.params.groupId), req.body))
));

router.delete('/:groupId', h(async (req, res) => {
  await groupsService.deleteGroup(req.user!.userId, Number(req.params.groupId));
  res.status(204).end();
}));

// Membership
router.post('/:groupId/join', h(async (req, res) =>
  sendSuccess(res, await groupsService.joinGroup(req.user!.userId, Number(req.params.groupId)), { statusCode: 201 })
));

router.post('/:groupId/leave', h(async (req, res) => {
  await groupsService.leaveGroup(req.user!.userId, Number(req.params.groupId));
  sendSuccess(res, null, { message: 'Left group successfully' });
}));

router.get('/:groupId/members', h(async (req, res) =>
  sendSuccess(res, await groupsService.listMembers(Number(req.params.groupId), req.user!.userId))
));

router.delete('/:groupId/members/:userId', h(async (req, res) => {
  await groupsService.removeMember(req.user!.userId, Number(req.params.groupId), Number(req.params.userId));
  res.status(204).end();
}));

// Messages (REST fallback/history)
router.get('/:groupId/messages', validate(messageQuerySchema, 'query'), h(async (req, res) => {
  const { messages, total, page, limit } = await groupsService.listMessages(req.user!.userId, Number(req.params.groupId), req.query as any);
  sendPaginated(res, messages, { total, page, limit });
}));

router.post('/:groupId/messages', messageLimiter, validate(sendMessageSchema), h(async (req, res) =>
  sendSuccess(res, await groupsService.sendMessage(req.user!.userId, Number(req.params.groupId), req.body), { statusCode: 201 })
));

router.delete('/:groupId/messages/:messageId', h(async (req, res) => {
  await groupsService.deleteMessage(req.user!.userId, Number(req.params.groupId), Number(req.params.messageId));
  sendSuccess(res, null, { message: 'Message deleted' });
}));

// Reports
router.post('/:groupId/messages/:messageId/reports', reportLimiter, validate(reportMessageSchema), h(async (req, res) =>
  sendSuccess(res, await groupsService.reportMessage(req.user!.userId, Number(req.params.groupId), Number(req.params.messageId), req.body), { statusCode: 201 })
));

// Group payments
router.post('/:groupId/payments', validate(groupPaymentSchema), h(async (req, res) =>
  sendSuccess(res, await groupsService.createGroupPayment(req.user!.userId, Number(req.params.groupId), req.body), { statusCode: 201 })
));

router.get('/:groupId/payments', h(async (req, res) =>
  sendSuccess(res, await groupsService.listGroupPayments(req.user!.userId, Number(req.params.groupId)))
));

router.get('/:groupId/payments/me', h(async (req, res) =>
  sendSuccess(res, await groupsService.listMyGroupPayments(req.user!.userId, Number(req.params.groupId)))
));

export default router;
