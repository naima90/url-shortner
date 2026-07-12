// The public redirect route. Mounted at the app root (not under /api) so short
// links look like http://localhost:4000/aX9kf2 rather than /api/redirect/....
import { Router } from 'express';
import { redirectController } from '../controllers/redirect.controller';

export const redirectRouter = Router();

// :code is the short code or custom alias.
redirectRouter.get('/:code', redirectController.redirect);
