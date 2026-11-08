import { type PlayableContent } from "../domain/models/playable-content.ts";
import { type PlayableContentRepository } from "../domain/repository/playable-content.repository.ts";
import {
  requireNonEmptyString,
  requirePositiveInteger,
} from "./errors/validation.ts";

export class CatalogUseCase {
  private readonly playableContentRepository: PlayableContentRepository;

  constructor(playableContentRepository: PlayableContentRepository) {
    this.playableContentRepository = playableContentRepository;
  }

  async getMovies(region?: string): Promise<PlayableContent[]> {
    let resolvedRegion: string | undefined;
    if (region !== undefined) {
      resolvedRegion = requireNonEmptyString(region, "region");
    }

    return this.playableContentRepository.findAll(resolvedRegion);
  }

  async isTitlePlayable(
    tmdbId: number,
    region = "US",
  ): Promise<{ playable: boolean }> {
    requirePositiveInteger(tmdbId, "tmdbId");
    const resolvedRegion =
      region === undefined ? "US" : requireNonEmptyString(region, "region");

    const playable = await this.playableContentRepository.isPlayableInRegion(
      tmdbId,
      resolvedRegion,
    );
    return { playable };
  }
}
