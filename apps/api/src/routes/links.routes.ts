// Link routes. Every route here requires a logged-in user.
// Creation is rate-limited to slow link-spam abuse.
import { Router } from 'express';
import { createLinkSchema } from '@url-shortner/shared';
import { linksController } from '../controllers/links.controller';
import { validate } from '../middleware/validate.middleware';
import { requireAuth } from '../middleware/auth.middleware';
import { createLinkLimiter } from '../middleware/rateLimit.middleware';

export const linksRouter = Router();

// Apply auth to all routes in this router.
linksRouter.use(requireAuth);

linksRouter.post('/', createLinkLimiter, validate(createLinkSchema), linksController.create);
linksRouter.get('/', linksController.list);
linksRouter.get('/:id/analytics', linksController.analytics);
linksRouter.delete('/:id', linksController.remove);
