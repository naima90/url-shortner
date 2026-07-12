// Tell TypeScript that our auth middleware adds a `user` property to the
// Express Request. Without this, `req.user` would be a type error.
import 'express';

declare global {
  namespace Express {
    interface UserPayload {
      id: string;
      email: string;
    }
    interface Request {
      // Present only after auth.middleware has run on a protected route.
      user?: UserPayload;
    }
  }
}

export {};
