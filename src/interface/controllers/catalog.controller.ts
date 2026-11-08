import { type NextFunction, type Request, type Response } from "express";
import { type CatalogUseCase } from "../../application/catalog.use-case.ts";

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
      const movies = await this.catalogUseCase.getMovies(region);
      res.json(movies);
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
}
