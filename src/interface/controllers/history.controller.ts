import { type NextFunction, type Request, type Response } from "express";
import { type HistoryUseCase } from "../../application/history.use-case.ts";
import {
  toWatchProgressInput,
  type UpdateWatchProgressRequestDto,
} from "../../infrastructure/dtos/history.dto.ts";

export class HistoryController {
  private readonly historyUseCase: HistoryUseCase;

  constructor(historyUseCase: HistoryUseCase) {
    this.historyUseCase = historyUseCase;
  }

  updateProgress = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const body = (req.body ?? {}) as UpdateWatchProgressRequestDto;
      const result = await this.historyUseCase.updateWatchProgress(
        toWatchProgressInput(req.userId, body),
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  getContinueWatching = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const limit = Number(req.query.limit) || 10;
      const data = await this.historyUseCase.getContinueWatching(
        req.userId,
        limit,
      );
      res.json(data);
    } catch (error) {
      next(error);
    }
  };

  getSeasonProgress = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const tmdbId = Number(req.params.tmdbId);
      const seasonNumber = Number(req.params.seasonNumber);
      const data = await this.historyUseCase.getSeasonProgress(
        req.userId,
        tmdbId,
        seasonNumber,
      );
      res.json(data);
    } catch (error) {
      next(error);
    }
  };
}
