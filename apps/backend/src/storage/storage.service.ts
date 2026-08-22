import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { StorageObject, StorageUploadInput } from './interfaces/storage-provider.interface';
import { LocalStorageProvider } from './providers/local-storage.provider';
import { R2StorageProvider } from './providers/r2-storage.provider';

@Injectable()
export class StorageService {
  constructor(
    private readonly configService: ConfigService,
    private readonly localStorageProvider: LocalStorageProvider,
    private readonly r2StorageProvider: R2StorageProvider,
  ) {}

  upload(input: StorageUploadInput): Promise<StorageObject> {
    const driver = this.configService.get<'local' | 'r2'>('STORAGE_DRIVER', 'local');

    if (driver === 'r2') {
      return this.r2StorageProvider.upload(input);
    }

    return this.localStorageProvider.upload(input);
  }
}
