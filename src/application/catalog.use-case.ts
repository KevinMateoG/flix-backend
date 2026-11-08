import { AppError } from "./errors/app.error.ts";
import { type PlayableContent } from "../domain/models/playable-content.ts";
import { type PlayableContentRepository } from "../domain/repository/playable-content.repository.ts";

export class CatalogUseCase {
  private readonly playableContentRepository: PlayableContentRepository;

  constructor(playableContentRepository: PlayableContentRepository) {
    this.playableContentRepository = playableContentRepository;
  }

  async getMovies(region?: string): Promise<PlayableContent[]> {
    return this.playableContentRepository.findAll(region);
  }

  async isTitlePlayable(
    tmdbId: number,
    region = "US",
  ): Promise<{ playable: boolean }> {
    if (isNaN(tmdbId)) {
      throw AppError.badRequest("tmdbId must be a number");
    }

    const playable = await this.playableContentRepository.isPlayableInRegion(
      tmdbId,
      region || "US",
    );
    return { playable };
  }
}
