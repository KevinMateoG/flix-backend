import {
  type CreatePlayableContentInput,
  type PlayableContent,
  type UpdatePlayableContentInput,
} from "../models/playable-content.ts";
import { type EntityStatusFilter } from "../models/user.ts";

export interface PlayableContentRepository {
  findAll(
    region?: string,
    status?: EntityStatusFilter,
  ): Promise<PlayableContent[]>;
  findByTmdbId(
    tmdbId: number,
    includeInactive?: boolean,
  ): Promise<PlayableContent | null>;
  isPlayableInRegion(tmdbId: number, region: string): Promise<boolean>;
  create(input: CreatePlayableContentInput): Promise<PlayableContent>;
  update(
    tmdbId: number,
    input: UpdatePlayableContentInput,
  ): Promise<PlayableContent | null>;
  softDelete(tmdbId: number): Promise<boolean>;
}
