import { Module } from '@nestjs/common';

import { FileUploadClient } from './file-upload.client';

@Module({
  providers: [FileUploadClient],
  exports: [FileUploadClient],
})
export class FileUploadClientModule {}
