import { type NextFunction, type Request, type Response } from "express";
import { type PlaybackUseCase } from "../../application/playback.use-case.ts";

export class PlaybackController {
  private readonly playbackUseCase: PlaybackUseCase;

  constructor(playbackUseCase: PlaybackUseCase) {
    this.playbackUseCase = playbackUseCase;
  }

  getStream = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const tmdbId = Number(req.params.tmdbId);
      const streamInfo = await this.playbackUseCase.getStreamInfo(tmdbId);
      res.json(streamInfo);
    } catch (error) {
      next(error);
    }
  };
}
