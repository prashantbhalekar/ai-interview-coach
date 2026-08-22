export interface StorageUploadInput {
  key: string;
  body: Buffer;
  contentType: string;
}

export interface StorageObject {
  key: string;
  bucket: string;
  url: string;
  sizeBytes: number;
}

export interface StorageProvider {
  upload(input: StorageUploadInput): Promise<StorageObject>;
}
