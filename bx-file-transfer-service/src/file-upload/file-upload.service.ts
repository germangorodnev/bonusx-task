import { createHash, randomUUID } from 'crypto';

import { Inject, Injectable } from '@nestjs/common';
import { Observable, firstValueFrom, from, map, of } from 'rxjs';

import { TopicForSubscriptionCollection } from '../configs/env';
import { HASH_ALGORITHM } from '../configs/file-upload';
import { FileStorageService } from '../services/file-storage/file-storage.service';
import { MqttClientService } from '../services/mqtt-client/mqtt-client.service';
import { formatTopic } from '../utils/format-topic';

import { QOS_LEVEL } from './file-upload.constants';
import { FileUploadStartDto } from './file-upload.dto';
import { UploadInfo } from './file-upload.interface';
import { FILE_SIZE_TOKEN } from './file-upload.providers';

@Injectable()
export class FileUploadService {
  protected uploadMap: Map<string, UploadInfo> = new Map();

  constructor(
    private fileStorageService: FileStorageService,
    private mqttClientService: MqttClientService,
    @Inject(FILE_SIZE_TOKEN) private maxFileSize: number,
  ) {}

  async uploadStart(data: FileUploadStartDto) {
    const uploadId = randomUUID();
    const key = data.filename;
    const s3UploadId = await this.fileStorageService.startMultipartUpload(key);

    const info = this.createUploadInfo(data, key, s3UploadId);

    this.uploadMap.set(uploadId, info);

    return {
      uploadId,
    };
  }

  async uploadPart(topic: string, payload: Buffer) {
    const { partNumber, uploadId } = this.extractUploadIdAndPart(topic);
    const responseTopic = formatTopic(TopicForSubscriptionCollection.fileUploadPartDone, uploadId, partNumber);

    const info = this.uploadMap.get(uploadId);
    if (!info) {
      return firstValueFrom(
        this.mqttClientService.emit(
          responseTopic,
          {
            success: false,
            error: `uploadId "${uploadId}" not found`,
          },
          QOS_LEVEL,
        ),
      );
    }

    const { key, s3UploadId } = info;

    try {
      // upload file part
      const uploadedPartInfo = await this.fileStorageService.uploadPart(key, partNumber, s3UploadId, payload);

      info.parts.push(uploadedPartInfo);

      const currentSize = await this.fileStorageService.getMultipartUploadSize(key, s3UploadId);

      if (currentSize > this.maxFileSize) {
        throw new Error(`File is too large. ${currentSize} > ${this.maxFileSize}`);
      }

      // update hash
      info.hash.update(payload);

      await firstValueFrom(
        this.mqttClientService.emit(
          responseTopic,
          {
            success: true,
          },
          QOS_LEVEL,
        ),
      );
    } catch (error: any) {
      await this.abortUpload(uploadId);

      await firstValueFrom(
        this.mqttClientService.emit(
          responseTopic,
          {
            success: false,
            error: error.message,
          },
          QOS_LEVEL,
        ),
      );
    }
  }

  async uploadEnd(topic: string): Promise<void> {
    const { info, uploadId } = this.extractUploadId(topic);

    // check hash
    const hashsum = info.hash.digest('hex');
    if (hashsum !== info.hashsum) {
      throw new Error(`Hashsum mismatch for uploadId="${uploadId}"`);
    }

    await this.fileStorageService.completeMultipartUpload(info.key, info.s3UploadId, info.parts);

    this.uploadMap.delete(uploadId);
  }

  protected async abortUpload(uploadId: string) {
    const info = this.uploadMap.get(uploadId);
    if (!info) return;

    await this.fileStorageService.abortMultipartUpload(info.key, info.s3UploadId);

    this.uploadMap.delete(uploadId);
  }

  protected createUploadInfo(
    { contentLength, filename, hashsum }: FileUploadStartDto,
    key: string,
    s3UploadId: string,
  ): UploadInfo {
    const hash = createHash(HASH_ALGORITHM);

    return {
      contentLength,
      filename,
      key,
      hash,
      hashsum,
      parts: [],
      s3UploadId,
    };
  }

  /**
   * Download the file in parts.
   *
   * Reads the file stream and pipes it to the client in base64.
   */
  async downloadFile(topic: string, chunkSize?: number): Promise<Observable<string>> {
    const filename = this.extractFilename(topic);

    const stream = await this.fileStorageService.getFileAsStream(filename, chunkSize);

    if (!stream) return of();

    return from(stream).pipe(
      map((chunk: Buffer) => {
        return chunk.toString('base64');
      }),
    );
  }

  protected extractUploadId(topic: string): {
    uploadId: string;
    info: UploadInfo;
  } {
    const uploadId = topic.split('/').at(2);
    if (!uploadId) {
      throw new Error('Cannot extract uploadId from topic');
    }

    const info = this.uploadMap.get(uploadId);
    if (!info) {
      throw new Error(`uploadId ${uploadId} not found`);
    }

    return { uploadId, info };
  }

  protected extractUploadIdAndPart(topic: string): {
    uploadId: string;
    partNumber: number;
  } {
    const parts = topic.split('/');
    const uploadId = parts.at(2);
    const partNumberStr = parts.at(4);

    if (!uploadId || !partNumberStr) {
      throw new Error('Cannot extract uploadId or part number from topic');
    }

    const partNumber = parseInt(partNumberStr);
    if (Number.isNaN(partNumber)) {
      throw new Error('Part number is not a number');
    }

    return {
      uploadId,
      partNumber,
    };
  }

  protected extractFilename(topic: string): string {
    const filename = topic.split('/').at(-1);

    if (!filename?.length) {
      throw new Error('Cannot extract filename from topic');
    }

    return filename;
  }
}
