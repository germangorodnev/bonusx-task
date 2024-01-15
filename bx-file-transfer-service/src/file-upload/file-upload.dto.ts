import { IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

import { FILE_SIZE_LIMIT } from './file-upload.constants';

export class FileUploadStartDto {
  @IsString()
  @IsNotEmpty()
  filename!: string;

  @IsInt()
  @Min(1)
  @Max(FILE_SIZE_LIMIT)
  contentLength!: number;

  @IsString()
  @IsNotEmpty()
  hashsum!: string;
}

export class FileDownloadDto {
  @IsInt()
  @Min(1)
  chunkSize!: number;
}
