import express, { type Request, type Response } from 'express';
import {
  search_content,
  get_movie_details,
  get_tv_details,
  get_season_details,
  get_trending,
  get_popular,
  get_top_rated,
  fetch_tmdb_details,
} from '../controllers/tmdb.controller.ts';

const tmdbRouter = express.Router();

tmdbRouter.get('/search', async (req: Request, res: Response) => {
  try {
    const q = req.query.q as string;
    const page = Number(req.query.page) || 1;
    const language = (req.query.language as string) || 'en-US';

    if (!q || q.trim().length < 2) {
      res.json({ results: [] });
      return;
    }

    const data = await search_content(q.trim(), page, language);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

tmdbRouter.get('/trending', async (req: Request, res: Response) => {
  try {
    const mediaType = (req.query.type as 'movie' | 'tv' | 'all') || 'all';
    const timeWindow = (req.query.window as 'day' | 'week') || 'week';
    const language = (req.query.language as string) || 'en-US';

    const data = await get_trending(mediaType, timeWindow, language);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

tmdbRouter.get('/popular', async (req: Request, res: Response) => {
  try {
    const mediaType = (req.query.type as 'movie' | 'tv') || 'movie';
    const page = Number(req.query.page) || 1;
    const region = (req.query.region as string) || 'US';
    const language = (req.query.language as string) || 'en-US';

    const data = await get_popular(mediaType, page, region, language);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

tmdbRouter.get('/top-rated', async (req: Request, res: Response) => {
  try {
    const mediaType = (req.query.type as 'movie' | 'tv') || 'movie';
    const page = Number(req.query.page) || 1;
    const region = (req.query.region as string) || 'US';
    const language = (req.query.language as string) || 'en-US';

    const data = await get_top_rated(mediaType, page, region, language);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

tmdbRouter.get('/movie/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const language = (req.query.language as string) || 'en-US';

    if (isNaN(id)) {
      res.status(400).json({ error: 'id must be a number' });
      return;
    }

    const data = await get_movie_details(id, language);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

tmdbRouter.get('/tv/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const language = (req.query.language as string) || 'en-US';

    if (isNaN(id)) {
      res.status(400).json({ error: 'id must be a number' });
      return;
    }

    const data = await get_tv_details(id, language);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

tmdbRouter.get('/tv/:id/season/:season', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const season = Number(req.params.season);
    const language = (req.query.language as string) || 'en-US';

    if (isNaN(id) || isNaN(season)) {
      res.status(400).json({ error: 'id and season must be numbers' });
      return;
    }

    const data = await get_season_details(id, season, language);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

tmdbRouter.get('/details/:tmdbId', async (req: Request, res: Response) => {
  try {
    const tmdbId = Number(req.params.tmdbId);
    const language = (req.query.language as string) || 'en-US';

    if (isNaN(tmdbId)) {
      res.status(400).json({ error: 'tmdbId must be a number' });
      return;
    }

    const data = await fetch_tmdb_details(tmdbId, language);
    if (!data) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default tmdbRouter;
