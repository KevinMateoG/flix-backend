import { type NextFunction, type Request, type Response } from "express";
import { type HistoryUseCase } from "../../application/history.use-case.ts";
import { type UpdateWatchHistoryInput } from "../../domain/models/watch-history.ts";
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

  getHistoryItemById = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const id = Number(req.params.id);
      const item = await this.historyUseCase.getHistoryItemById(req.userId, id);
      res.json(item);
    } catch (error) {
      next(error);
    }
  };

  updateHistoryItem = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const id = Number(req.params.id);
      const body = (req.body ?? {}) as UpdateWatchHistoryInput;
      const updated = await this.historyUseCase.updateHistoryItem(
        req.userId,
        id,
        body,
      );
      res.json(updated);
    } catch (error) {
      next(error);
    }
  };

  deleteHistoryItem = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const id = Number(req.params.id);
      const result = await this.historyUseCase.deleteHistoryItem(
        req.userId,
        id,
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}