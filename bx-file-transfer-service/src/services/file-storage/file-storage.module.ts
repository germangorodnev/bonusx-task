import { Module } from '@nestjs/common';

import { FileStorageService } from './file-storage.service';
import { S3ClientProvider } from './s3-client.provider';

@Module({
  providers: [S3ClientProvider, FileStorageService],
  exports: [FileStorageService],
})
export class FileStorageModule {}
