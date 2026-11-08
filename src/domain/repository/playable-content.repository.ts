import {
  type CreatePlayableContentInput,
  type PlayableContent,
  type UpdatePlayableContentInput,
} from "../models/playable-content.ts";

export interface PlayableContentRepository {
  findAll(region?: string): Promise<PlayableContent[]>;
  findByTmdbId(tmdbId: number): Promise<PlayableContent | null>;
  isPlayableInRegion(tmdbId: number, region: string): Promise<boolean>;
  create(input: CreatePlayableContentInput): Promise<PlayableContent>;
  update(
    tmdbId: number,
    input: UpdatePlayableContentInput,
  ): Promise<PlayableContent | null>;
  softDelete(tmdbId: number): Promise<boolean>;
}