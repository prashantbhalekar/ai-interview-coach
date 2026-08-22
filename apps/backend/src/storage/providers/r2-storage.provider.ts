import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  StorageObject,
  StorageProvider,
  StorageUploadInput,
} from '../interfaces/storage-provider.interface';

@Injectable()
export class R2StorageProvider implements StorageProvider {
  private client: S3Client | null = null;

  constructor(private readonly configService: ConfigService) {}

  async upload(input: StorageUploadInput): Promise<StorageObject> {
    const bucket = this.configService.get<string>('R2_BUCKET');
    const accountId = this.configService.get<string>('R2_ACCOUNT_ID');
    const accessKeyId = this.configService.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('R2_SECRET_ACCESS_KEY');

    if (!bucket || !accountId || !accessKeyId || !secretAccessKey) {
      throw new InternalServerErrorException(
        'R2 configuration is incomplete. Set R2_BUCKET, R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY.',
      );
    }

    const client = this.getClient(accountId, accessKeyId, secretAccessKey);

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: input.key,
        Body: input.body,
        ContentType: input.contentType,
      }),
    );

    return {
      key: input.key,
      bucket,
      url: `r2://${bucket}/${input.key}`,
      sizeBytes: input.body.byteLength,
    };
  }

  private getClient(accountId: string, accessKeyId: string, secretAccessKey: string): S3Client {
    if (this.client) {
      return this.client;
    }

    const bucket = this.configService.get<string>('R2_BUCKET');
    const endpoint =
      this.configService.get<string>('R2_ENDPOINT') ??
      `https://${accountId}.r2.cloudflarestorage.com`;

    this.client = new S3Client({
      region: 'auto',
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    if (!bucket) {
      throw new InternalServerErrorException('R2 bucket is not configured');
    }

    return this.client;
  }
}
