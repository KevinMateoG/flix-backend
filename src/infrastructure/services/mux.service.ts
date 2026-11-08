import Mux from "@mux/mux-node";
import { type PlaybackStreamPort } from "../../application/playback.use-case.ts";

export const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID || "",
  tokenSecret: process.env.MUX_TOKEN_SECRET || "",
});

export class MuxService implements PlaybackStreamPort {
  async getSignedPlaybackUrl(
    playbackId: string,
    _expiresIn = 3600,
  ): Promise<string> {
    const domain = process.env.PUBLIC_MUX_PLAYBACK_DOMAIN || "stream.mux.com";
    return `https://${domain}/${playbackId}.m3u8`;
  }

  async createDirectUpload() {
    const upload = await mux.video.uploads.create({
      new_asset_settings: { playback_policy: ["public"], test: false },
      cors_origin: process.env.NEXT_PUBLIC_APP_URL || "*",
    });
    return upload;
  }
}

export const muxService = new MuxService();
