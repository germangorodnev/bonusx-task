import { Readable } from 'node:stream';

export interface IFileUploadClient {
  uploadFile(
    filename: string,
    contentLength: number,
    hashsum: string,
    contentsOrStream: Buffer | Readable,
  ): Promise<void>;
}

export interface FileUploadStartResult {
  uploadId: string;
}

export type FileUploadPartResult =
  | {
      success: true;
      error?: never;
    }
  | {
      success: false;
      error: string;
    };

export type FileUploadEndResult =
  | {
      success: true;
      error?: never;
    }
  | {
      success: false;
      error: string;
    };
