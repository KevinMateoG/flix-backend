import { type NextFunction, type Request, type Response } from "express";
import { type LibraryUseCase } from "../../application/library.use-case.ts";
import { type MediaType } from "../../domain/models/library-item.ts";
import {
  toLibraryItemResponseDto,
  type LibraryCheckQueryDto,
  type LibraryToggleRequestDto,
} from "../../infrastructure/dtos/library.dto.ts";

export class LibraryController {
  private readonly libraryUseCase: LibraryUseCase;

  constructor(libraryUseCase: LibraryUseCase) {
    this.libraryUseCase = libraryUseCase;
  }

  getMyList = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const items = await this.libraryUseCase.getMyList(req.userId);
      res.json(items.map(toLibraryItemResponseDto));
    } catch (error) {
      next(error);
    }
  };

  toggleMyList = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { tmdbId, mediaType } = (req.body ?? {}) as LibraryToggleRequestDto;
      const parsedTmdbId = tmdbId !== undefined && tmdbId !== "" ? Number(tmdbId) : NaN;
      const result = await this.libraryUseCase.toggleMyList(
        req.userId,
        parsedTmdbId,
        mediaType,
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  removeFromMyList = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const itemId = Number(req.params.itemId);
      const result = await this.libraryUseCase.removeFromMyList(
        req.userId,
        itemId,
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  checkMyList = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const query = req.query as LibraryCheckQueryDto;
      const tmdbId = Number(query.tmdbId);
      const mediaType = query.mediaType as MediaType | undefined;
      const result = await this.libraryUseCase.checkIfInMyList(
        req.userId,
        tmdbId,
        mediaType,
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  toggleDislike = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { tmdbId, mediaType } = (req.body ?? {}) as LibraryToggleRequestDto;
      const parsedTmdbId = tmdbId !== undefined && tmdbId !== "" ? Number(tmdbId) : NaN;
      const result = await this.libraryUseCase.toggleDislike(
        req.userId,
        parsedTmdbId,
        mediaType,
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  checkDisliked = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const query = req.query as LibraryCheckQueryDto;
      const tmdbId = Number(query.tmdbId);
      const mediaType = query.mediaType as MediaType | undefined;
      const result = await this.libraryUseCase.checkIfDisliked(
        req.userId,
        tmdbId,
        mediaType,
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}
