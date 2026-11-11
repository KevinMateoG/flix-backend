export interface AvatarFileInput {
  key: string;
  body: Buffer;
  contentType: string;
}

export interface StoredAvatar {
  path: string;
  url: string;
}

export interface AvatarStorage {
  upload(file: AvatarFileInput): Promise<StoredAvatar>;
  remove(path: string): Promise<void>;
}
