import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import {
  type AvatarFileInput,
  type AvatarStorage,
  type StoredAvatar,
} from "../../domain/storage/avatar-storage.ts";

export class S3AvatarStorage implements AvatarStorage {
  private readonly client: S3Client;

  constructor() {
    this.client = new S3Client({
      endpoint: process.env.AWS_ENDPOINT_URL_S3,
      region: process.env.AWS_REGION || "us-east-1",
      // Neon Object Storage only supports path-style addressing.
      forcePathStyle: true,
      requestChecksumCalculation: "WHEN_REQUIRED",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      },
    });
  }

  private get bucket(): string {
    return process.env.AVATARS_BUCKET || "avatars";
  }

  async upload(file: AvatarFileInput): Promise<StoredAvatar> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: file.key,
        Body: file.body,
        ContentType: file.contentType,
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );

    return { path: file.key, url: `${this.publicBaseUrl}/${file.key}` };
  }

  /**
   * Public URL prefix. Defaults to the Neon path-style object URL
   * (`<endpoint>/<bucket>`), which works when the bucket is `public_read`.
   */
  private get publicBaseUrl(): string {
    const override = process.env.AVATARS_PUBLIC_BASE_URL;
    const base =
      override ||
      `${(process.env.AWS_ENDPOINT_URL_S3 || "").replace(/\/+$/, "")}/${this.bucket}`;
    return base.replace(/\/+$/, "");
  }

  async remove(path: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: path }),
    );
  }
}

export const avatarStorage = new S3AvatarStorage();
