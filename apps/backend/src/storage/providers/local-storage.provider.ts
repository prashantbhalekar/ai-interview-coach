import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type {
  StorageObject,
  StorageProvider,
  StorageUploadInput,
} from '../interfaces/storage-provider.interface';

@Injectable()
export class LocalStorageProvider implements StorageProvider {
  constructor(private readonly configService: ConfigService) {}

  async upload(input: StorageUploadInput): Promise<StorageObject> {
    const basePath = this.configService.get<string>('STORAGE_LOCAL_BASE_PATH', '.storage');
    const absolutePath = join(process.cwd(), basePath, input.key);

    await mkdir(dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, input.body);

    return {
      key: input.key,
      bucket: 'local-storage',
      url: `local://${input.key}`,
      sizeBytes: input.body.byteLength,
    };
  }
}
