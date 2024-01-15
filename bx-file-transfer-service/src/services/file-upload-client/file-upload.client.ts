import { createHash } from 'node:crypto';
import { Readable } from 'node:stream';

import { Injectable } from '@nestjs/common';
import { Observable, firstValueFrom, map } from 'rxjs';
import StreamToAsyncIterator from 'stream-to-async-iterator';

import { TopicForSubscriptionCollection } from '../../configs/env';
import { HASH_ALGORITHM } from '../../configs/file-upload';
import { FileUploadStartDto } from '../../file-upload/file-upload.dto';
import { formatTopic } from '../../utils/format-topic';
import { sleep } from '../../utils/sleep';
import { MqttClientService } from '../mqtt-client/mqtt-client.service';

import {
  FileUploadEndResult,
  FileUploadPartResult,
  FileUploadStartResult,
  IFileUploadClient,
} from './file-upload-client.interface';

@Injectable()
export class FileUploadClient implements IFileUploadClient {
  // upload 512KB chunks
  private readonly CHUNK_SIZE = 512 * 1024;

  constructor(private mqttClientService: MqttClientService) {}

  /**
   * Uploads given file using mqtt.
   *
   * @param filename name of the file
   * @param contentLength file length in bytes
   * @param hashsum hashsum of the file
   * @param contentsOrStream file contents or Readable
   */
  async uploadFile(filename: string, contentLength: number, hashsum: string, contentsOrStream: Buffer | Readable) {
    const uploadId = await this.startUpload({
      contentLength,
      filename,
      hashsum,
    });

    await this.uploadParts(uploadId, contentsOrStream);

    await this.endUpload(uploadId);
  }

  /**
   * Downloads given file using mqtt.
   * Returns Observable<Buffer> containing file chunks.
   */
  async downloadFile(filename: string): Promise<Observable<Buffer>> {
    const topic = formatTopic(TopicForSubscriptionCollection.fileDownload, filename);

    const download$ = this.mqttClientService
      .send(topic, {
        chunkSize: this.CHUNK_SIZE,
      })
      .pipe(map((chunk: string) => Buffer.from(chunk, 'base64')));

    return download$;
  }

  /**
   * Start upload operation and get the upload ID for consecutive operations.
   */
  protected async startUpload(payload: FileUploadStartDto): Promise<string> {
    const { uploadId } = await firstValueFrom(
      this.mqttClientService.send<FileUploadStartDto, FileUploadStartResult>(
        TopicForSubscriptionCollection.fileUploadStart,
        payload,
        1,
      ),
    );

    return uploadId;
  }

  /**
   * Upload given file contents or a stream to server.
   *
   * @param uploadId ID of upload operation.
   * @param contentsOrStream file contents or a stream.
   */
  protected async uploadParts(uploadId: string, contentsOrStream: Buffer | Readable) {
    let partNumber = 1;
    const hash = createHash(HASH_ALGORITHM);

    const uploadPart = async (payload: Buffer) => {
      const topicArgs = [uploadId, partNumber];
      const topic = formatTopic(TopicForSubscriptionCollection.fileUploadPart, ...topicArgs);
      const uploadDoneTopic = formatTopic(TopicForSubscriptionCollection.fileUploadPartDone, ...topicArgs);

      try {
        this.mqttClientService.mqttClient.subscribe(uploadDoneTopic);

        // initiate upload and wait for it to finish
        // either with timeout or successfully
        const [uploadResult] = await Promise.all([
          Promise.race([this.createUploadTimeout(5_000), this.waitForUploadDone(uploadDoneTopic)]),
          firstValueFrom(this.mqttClientService.emit<any>(topic, payload, 1)),
        ]);

        if (!uploadResult) {
          throw new Error('Upload timeout');
        }

        if (!uploadResult.success) {
          throw new Error(uploadResult.error);
        }
      } finally {
        this.mqttClientService.mqttClient.unsubscribe(uploadDoneTopic);
      }

      hash.update(payload);

      partNumber++;
    };

    if (contentsOrStream instanceof Buffer) {
      const buffer = contentsOrStream;

      for (let i = 0; i < buffer.length; i += this.CHUNK_SIZE) {
        const chunk = buffer.subarray(i, i + this.CHUNK_SIZE);

        await uploadPart(chunk);
      }

      return;
    }

    const iterator = new StreamToAsyncIterator<Buffer>(contentsOrStream, {
      size: this.CHUNK_SIZE,
    });

    for await (const chunk of iterator) {
      await uploadPart(chunk);
    }
  }

  /**
   * Finish upload sequence.
   *
   * @param uploadId ID of upload operation.
   */
  protected async endUpload(uploadId: string): Promise<void> {
    const topic = formatTopic(TopicForSubscriptionCollection.fileUploadEnd, uploadId);

    const result = await firstValueFrom(this.mqttClientService.send<unknown, FileUploadEndResult>(topic, {}));

    if (!result.success) {
      throw new Error(result.error);
    }
  }

  protected async createUploadTimeout(ms: number): Promise<void> {
    await sleep(ms);

    throw new Error('part upload timeout');
  }

  protected waitForUploadDone(uploadDoneTopic: string): Promise<FileUploadPartResult> {
    return new Promise<FileUploadPartResult>((resolve) => {
      const handler = (topic: string, payload) => {
        if (topic !== uploadDoneTopic) return;

        const data = JSON.parse(payload.toString()).data;

        this.mqttClientService.mqttClient.off('message', handler);

        resolve(data);
      };

      this.mqttClientService.mqttClient.on('message', handler);
    });
  }
}
