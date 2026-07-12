// HTTP layer for the public redirect. This is what runs when someone visits a
// short link like http://localhost:4000/aX9kf2. It is unauthenticated and needs
// to be fast, so it does the minimum: look up the code, record the click, redirect.
import type { Request, Response, NextFunction } from 'express';
import { linkRepository } from '../repositories/link.repository';
import { analyticsService } from '../services/analytics.service';
import { NotFoundError } from '../errors/httpErrors';
import { logger } from '../lib/logger';

export const redirectController = {
  // GET /:code
  async redirect(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code } = req.params;
      const link = await linkRepository.findByCode(code);
      if (!link) {
        // Unknown code: 404. (An "expired link" case would also live here once
        // expiry is enforced; for now expiresAt is not checked.)
        throw new NotFoundError('That short link does not exist');
      }

      // Record the click. We await it so the write actually happens, but wrap it
      // so a failure to log analytics never stops the user from being redirected.
      try {
        await analyticsService.recordClick({
          linkId: link.id,
          referrer: req.get('referer') ?? null,
          userAgent: req.get('user-agent') ?? null,
          ip: req.ip ?? null,
        });
      } catch (analyticsErr) {
        logger.error({ err: analyticsErr, code }, 'Failed to record click');
      }

      // 302 (temporary) so we do not let browsers cache the redirect forever,
      // which would also let them skip the click count.
      res.redirect(302, link.originalUrl);
    } catch (err) {
      next(err);
    }
  },
};
