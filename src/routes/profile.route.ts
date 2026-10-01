import express, { type Request, type Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.ts';
import {
  get_profile,
  update_profile_region,
  update_profile_settings,
} from '../controllers/profile.controller.ts';

const profileRouter = express.Router();

profileRouter.use(authMiddleware);

profileRouter.get('/me', async (req: Request, res: Response) => {
  try {
    const profile = await get_profile(req.userId);
    if (!profile) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }
    res.json(profile);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

profileRouter.patch('/region', async (req: Request, res: Response) => {
  try {
    const { region } = req.body;
    if (!region || typeof region !== 'string') {
      res.status(400).json({ error: 'region is required and must be a string' });
      return;
    }

    const updated = await update_profile_region(req.userId, region);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

profileRouter.patch('/settings', async (req: Request, res: Response) => {
  try {
    const { language, maturityRating, isKids } = req.body;

    const updated = await update_profile_settings(req.userId, {
      language,
      maturityRating,
      isKids,
    });

    if (!updated) {
      res.status(400).json({ error: 'No valid fields to update' });
      return;
    }

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default profileRouter;
