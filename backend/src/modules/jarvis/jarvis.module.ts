import { Router, Request, Response } from 'express';

export const createJarvisRouter = (): Router => {
  const router = Router();

  router.get('/status', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      mode: 'stub',
      timestamp: new Date().toISOString()
    });
  });

  router.post('/chat', (req: Request, res: Response) => {
    const message = req.body?.message ?? '';

    res.json({
      reply: 'stub',
      receivedMessage: message
    });
  });

  return router;
};
