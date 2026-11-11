import { type NextFunction, type Request, type Response } from "express";
import {
  type TmdbTimeWindow,
  type TmdbTrendingMediaType,
  type TmdbUseCase,
} from "../../application/tmdb.use-case.ts";
import { type MediaType } from "../../domain/models/library-item.ts";

export class TmdbController {
  private readonly tmdbUseCase: TmdbUseCase;

  constructor(tmdbUseCase: TmdbUseCase) {
    this.tmdbUseCase = tmdbUseCase;
  }

  search = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const q = req.query.q as string | undefined;
      const page = Number(req.query.page) || 1;
      const language = (req.query.language as string) || "en-US";
      const data = await this.tmdbUseCase.searchContent(q, page, language);
      res.json(data);
    } catch (error) {
      next(error);
    }
  };

  trending = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const mediaType =
        (req.query.type as TmdbTrendingMediaType | undefined) || "all";
      const timeWindow = (req.query.window as TmdbTimeWindow | undefined) || "week";
      const language = (req.query.language as string) || "en-US";
      const data = await this.tmdbUseCase.getTrending(
        mediaType,
        timeWindow,
        language,
      );
      res.json(data);
    } catch (error) {
      next(error);
    }
  };

  popular = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const mediaType = (req.query.type as MediaType | undefined) || "movie";
      const page = Number(req.query.page) || 1;
      const region = (req.query.region as string) || "US";
      const language = (req.query.language as string) || "en-US";
      const data = await this.tmdbUseCase.getPopular(
        mediaType,
        page,
        region,
        language,
      );
      res.json(data);
    } catch (error) {
      next(error);
    }
  };

  topRated = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const mediaType = (req.query.type as MediaType | undefined) || "movie";
      const page = Number(req.query.page) || 1;
      const region = (req.query.region as string) || "US";
      const language = (req.query.language as string) || "en-US";
      const data = await this.tmdbUseCase.getTopRated(
        mediaType,
        page,
        region,
        language,
      );
      res.json(data);
    } catch (error) {
      next(error);
    }
  };

  movieDetails = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const id = Number(req.params.id);
      const language = (req.query.language as string) || "en-US";
      const data = await this.tmdbUseCase.getMovieDetails(id, language);
      res.json(data);
    } catch (error) {
      next(error);
    }
  };

  discover = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const genre = req.query.genre as string | undefined;
      const page = Number(req.query.page) || 1;
      const region = (req.query.region as string) || "US";
      const language = (req.query.language as string) || "en-US";
      const data = await this.tmdbUseCase.discoverMovies(
        genre,
        page,
        region,
        language,
      );
      res.json(data);
    } catch (error) {
      next(error);
    }
  };

  tvDetails = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const id = Number(req.params.id);
      const language = (req.query.language as string) || "en-US";
      const data = await this.tmdbUseCase.getTvDetails(id, language);
      res.json(data);
    } catch (error) {
      next(error);
    }
  };

  seasonDetails = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const id = Number(req.params.id);
      const season = Number(req.params.season);
      const language = (req.query.language as string) || "en-US";
      const data = await this.tmdbUseCase.getSeasonDetails(
        id,
        season,
        language,
      );
      res.json(data);
    } catch (error) {
      next(error);
    }
  };

  details = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const tmdbId = Number(req.params.tmdbId);
      const language = (req.query.language as string) || "en-US";
      const data = await this.tmdbUseCase.fetchTmdbDetails(tmdbId, language);
      res.json(data);
    } catch (error) {
      next(error);
    }
  };
}
