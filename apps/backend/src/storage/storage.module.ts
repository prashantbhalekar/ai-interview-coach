import { Module } from '@nestjs/common';
import { LocalStorageProvider } from './providers/local-storage.provider';
import { R2StorageProvider } from './providers/r2-storage.provider';
import { StorageService } from './storage.service';

@Module({
  providers: [StorageService, LocalStorageProvider, R2StorageProvider],
  exports: [StorageService],
})
export class StorageModule {}
