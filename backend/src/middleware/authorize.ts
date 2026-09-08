import { Request, Response, NextFunction } from 'express';
import { AuthorizationError, AuthenticationError } from '../utils/AppError';

/**
 * Role-based authorization middleware.
 * Must be used AFTER authenticate().
 *
 * Usage:
 *   router.get('/route', authenticate, authorize('tutor'), handler)
 *   router.get('/route', authenticate, authorize('student', 'tutor'), handler)
 */
export function authorize(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AuthenticationError());
    }

    if (roles.length > 0 && !roles.includes(req.user.role)) {
      return next(
        new AuthorizationError(
          `This action requires one of the following roles: ${roles.join(', ')}`
        )
      );
    }

    next();
  };
}
