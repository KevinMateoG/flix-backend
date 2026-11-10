import { type NextFunction, type Request, type Response } from "express";
import { type CatalogUseCase } from "../../application/catalog.use-case.ts";
import { type UpdatePlayableContentInput } from "../../domain/models/playable-content.ts";

export class CatalogController {
  private readonly catalogUseCase: CatalogUseCase;

  constructor(catalogUseCase: CatalogUseCase) {
    this.catalogUseCase = catalogUseCase;
  }

  getMovies = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const region = req.query.region as string | undefined;
      const search = req.query.search as string | undefined;
      const page = req.query.page;
      const limit = req.query.limit;

      const result = await this.catalogUseCase.getMovies(
        {
          region,
          search,
          status: "active",
          page,
          limit,
        },
        "active",
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  getAdminMovies = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const region = req.query.region as string | undefined;
      const search = req.query.search as string | undefined;
      const status = req.query.status as string | undefined;
      const page = req.query.page;
      const limit = req.query.limit;

      const result = await this.catalogUseCase.getMovies(
        {
          region,
          search,
          status,
          page,
          limit,
        },
        "all",
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  getMovieById = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const tmdbId = Number(req.params.tmdbId);
      const movie = await this.catalogUseCase.getMovieByTmdbId(tmdbId);
      res.json(movie);
    } catch (error) {
      next(error);
    }
  };

  checkPlayable = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const tmdbId = Number(req.params.tmdbId);
      const region = (req.query.region as string) || "US";
      const result = await this.catalogUseCase.isTitlePlayable(tmdbId, region);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  createMovie = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const body = (req.body ?? {}) as Record<string, unknown>;
      const tmdbId = Number(body.tmdbId);
      const created = await this.catalogUseCase.createMovie({
        tmdbId,
        muxPlaybackId: body.muxPlaybackId as string,
        muxAssetId: (body.muxAssetId as string | null | undefined) ?? null,
        availableRegions: body.availableRegions as string[] | undefined,
      });
      res.status(201).json(created);
    } catch (error) {
      next(error);
    }
  };

  updateMovie = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const tmdbId = Number(req.params.tmdbId);
      const body = (req.body ?? {}) as UpdatePlayableContentInput;
      const updated = await this.catalogUseCase.updateMovie(tmdbId, body);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  };

  deleteMovie = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const tmdbId = Number(req.params.tmdbId);
      const result = await this.catalogUseCase.deleteMovie(tmdbId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}
