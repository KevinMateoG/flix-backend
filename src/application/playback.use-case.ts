import { AppError } from "./errors/app.error.ts";
import { type StreamInfo } from "../domain/models/playable-content.ts";
import { type PlayableContentRepository } from "../domain/repository/playable-content.repository.ts";

export interface PlaybackStreamPort {
  getSignedPlaybackUrl(playbackId: string, expiresIn?: number): Promise<string>;
}

export class PlaybackUseCase {
  private readonly playableContentRepository: PlayableContentRepository;
  private readonly playbackStreamPort: PlaybackStreamPort;

  constructor(
    playableContentRepository: PlayableContentRepository,
    playbackStreamPort: PlaybackStreamPort,
  ) {
    this.playableContentRepository = playableContentRepository;
    this.playbackStreamPort = playbackStreamPort;
  }

  async getStreamInfo(tmdbId: number): Promise<StreamInfo> {
    if (isNaN(tmdbId)) {
      throw AppError.badRequest("tmdbId must be a number");
    }

    const content = await this.playableContentRepository.findByTmdbId(tmdbId);
    if (!content) {
      throw AppError.notFound("No playable content found for this tmdbId");
    }

    const streamUrl = content.muxPlaybackId
      ? await this.playbackStreamPort.getSignedPlaybackUrl(content.muxPlaybackId)
      : null;

    return {
      tmdbId: content.tmdbId,
      muxPlaybackId: content.muxPlaybackId,
      muxAssetId: content.muxAssetId,
      availableRegions: content.availableRegions,
      streamUrl,
    };
  }
}
