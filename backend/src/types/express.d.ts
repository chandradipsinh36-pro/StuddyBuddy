// Express namespace augmentation for req.user
// This file MUST NOT have any import/export statements at the top level
// (otherwise it becomes a module and the global augmentation won't work)

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        email: string;
        role: string;
        iat?: number;
        exp?: number;
      };
    }
  }
}

export {}; // Make this a module without affecting the global augmentation
