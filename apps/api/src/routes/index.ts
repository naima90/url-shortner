// Mounts the /api sub-routers. The redirect route is mounted separately in
// app.ts at the root, so it is not included here.
import { Router } from 'express';
import { authRouter } from './auth.routes';
import { linksRouter } from './links.routes';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/links', linksRouter);
