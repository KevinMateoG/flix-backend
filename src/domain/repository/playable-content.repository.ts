import { type PlayableContent } from "../models/playable-content.ts";

export interface PlayableContentRepository {
  findAll(region?: string): Promise<PlayableContent[]>;
  findByTmdbId(tmdbId: number): Promise<PlayableContent | null>;
  isPlayableInRegion(tmdbId: number, region: string): Promise<boolean>;
}
