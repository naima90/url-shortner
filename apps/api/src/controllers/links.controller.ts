// HTTP layer for links. All routes here are protected, so req.user is always set.
import type { Request, Response, NextFunction } from 'express';
import type { LinkListDto } from '@url-shortner/shared';
import { linkService } from '../services/link.service';
import { analyticsService } from '../services/analytics.service';

export const linksController = {
  // POST /api/links  create a short link
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { originalUrl, customAlias } = req.body;
      const link = await linkService.create(req.user!.id, originalUrl, customAlias);
      res.status(201).json({ link, shortUrl: `${linkService.publicBaseUrl}/${link.code}` });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/links  list the current user's links
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const links = await linkService.listForUser(req.user!.id);
      const body: LinkListDto = { links };
      res.status(200).json(body);
    } catch (err) {
      next(err);
    }
  },

  // GET /api/links/:id/analytics  per-link analytics
  async analytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await analyticsService.getForLink(req.user!.id, req.params.id);
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  },

  // DELETE /api/links/:id
  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await linkService.delete(req.user!.id, req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
};
