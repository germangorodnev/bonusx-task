import { Module } from '@nestjs/common';

import { FileStorageModule } from '../services/file-storage/file-storage.module';

import { FileUploadController } from './file-upload.controller';
import { FileSizeProvider } from './file-upload.providers';
import { FileUploadService } from './file-upload.service';

@Module({
  imports: [FileStorageModule],
  controllers: [FileUploadController],
  providers: [FileSizeProvider, FileUploadService],
})
export class FileUploadModule {}
