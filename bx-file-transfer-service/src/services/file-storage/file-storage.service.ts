import { Readable } from 'stream';

import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CompletedPart,
  CreateMultipartUploadCommand,
  GetObjectCommand,
  ListPartsCommand,
  PutObjectCommand,
  S3Client,
  UploadPartCommand,
} from '@aws-sdk/client-s3';
import { Inject, Injectable } from '@nestjs/common';
import { WinstonLogger } from 'nest-winston';

import { S3_BUCKET } from '../../configs/env';
import { InjectLogger } from '../../utils/logging';

import { S3_CLIENT_TOKEN } from './s3-client.provider';

@Injectable()
export class FileStorageService {
  private bucket = S3_BUCKET;

  constructor(
    @Inject(S3_CLIENT_TOKEN) private s3Client: S3Client,
    @InjectLogger() private logger: WinstonLogger,
  ) {}

  async startMultipartUpload(key: string): Promise<string> {
    const { UploadId } = await this.s3Client.send(
      new CreateMultipartUploadCommand({
        Key: key,
        Bucket: this.bucket,
      }),
    );

    if (!UploadId) {
      throw new Error('Could not start multipart upload');
    }

    return UploadId;
  }

  async uploadPart(key: string, partNumber: number, uploadId: string, body: Buffer): Promise<CompletedPart> {
    const { ETag } = await this.s3Client.send(
      new UploadPartCommand({
        Bucket: this.bucket,
        Key: key,
        PartNumber: partNumber,
        Body: body,
        UploadId: uploadId,
      }),
    );

    if (!ETag) {
      await this.abortMultipartUpload(key, uploadId);

      throw new Error(`Could not upload part #${partNumber} for "${key}"`);
    }

    return {
      ETag,
      PartNumber: partNumber,
    };
  }

  async getMultipartUploadSize(key: string, uploadId: string): Promise<number> {
    const { Parts } = await this.s3Client.send(
      new ListPartsCommand({
        Bucket: this.bucket,
        Key: key,
        UploadId: uploadId,
      }),
    );

    if (!Parts) {
      throw new Error(`Could not get multipart upload size for "${key}"`);
    }

    return Parts.reduce((acc, part) => acc + (part.Size ?? 0), 0);
  }

  async abortMultipartUpload(key: string, uploadId: string) {
    try {
      await this.s3Client.send(
        new AbortMultipartUploadCommand({
          Bucket: this.bucket,
          Key: key,
          UploadId: uploadId,
        }),
      );
    } catch (error) {
      this.logger.error(error);
    }
  }

  async completeMultipartUpload(key: string, uploadId: string, parts: CompletedPart[]) {
    const { Key } = await this.s3Client.send(
      new CompleteMultipartUploadCommand({
        Bucket: this.bucket,
        Key: key,
        UploadId: uploadId,
        MultipartUpload: { Parts: parts },
      }),
    );

    return !!Key;
  }

  async uploadFile(key: string, file: Buffer) {
    await this.s3Client.send(
      new PutObjectCommand({
        Key: key,
        Bucket: this.bucket,
        Body: file,
      }),
    );
  }

  /**
   * Get the file as Readable.
   * Returns null if the file does not exist.
   */
  async getFileAsStream(key: string, chunkSize?: number): Promise<Readable | null> {
    const body = await this.getFile(key);
    if (!body) return null;

    return Readable.fromWeb(body.transformToWebStream() as any, {
      highWaterMark: chunkSize,
    });
  }

  protected async getFile(key: string) {
    try {
      const { Body } = await this.s3Client.send(
        new GetObjectCommand({
          Key: key,
          Bucket: this.bucket,
        }),
      );

      if (!Body) {
        throw new Error(`Error getting file "${key}"`);
      }

      return Body;
    } catch (error: any) {
      if (error.Code === 'NoSuchKey') {
        return null;
      }

      throw error;
    }
  }
}
