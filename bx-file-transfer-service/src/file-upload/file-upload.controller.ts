import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, MessagePattern, MqttContext, Payload } from '@nestjs/microservices';
import { Observable } from 'rxjs';

import { TopicForSubscriptionCollection } from '../configs/env';

import { FileDownloadDto, FileUploadStartDto } from './file-upload.dto';
import { FileUploadService } from './file-upload.service';

@Controller()
export class FileUploadController {
  constructor(private service: FileUploadService) {}

  /**
   * Start file upload.
   * Generate upload ID and save metadata.
   * Using this ID client can start uploading file parts.
   */
  @MessagePattern(TopicForSubscriptionCollection.fileUploadStart)
  async fileUploadStart(@Payload() payload: FileUploadStartDto) {
    const metadata = this.service.uploadStart(payload);

    return metadata;
  }

  /**
   * Handler for file upload part.
   */
  @EventPattern(TopicForSubscriptionCollection.fileUploadPart)
  async fileUploadPart(@Ctx() context: MqttContext) {
    const topic = context.getTopic();
    const packet = context.getPacket();

    await this.service.uploadPart(topic, packet.payload as Buffer);
  }

  /**
   * Handler for file upload end.
   * Finishes multipart upload and saves the file to storage.
   */
  @MessagePattern(TopicForSubscriptionCollection.fileUploadEnd)
  async fileUploadEnd(@Ctx() context: MqttContext) {
    try {
      const topic = context.getTopic();

      await this.service.uploadEnd(topic);

      return {
        success: true,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Handles file download.
   * Dispatches file chunks to client in observable.
   */
  @MessagePattern(TopicForSubscriptionCollection.fileDownload)
  async fileDownload(
    @Payload() { chunkSize }: FileDownloadDto,
    @Ctx() context: MqttContext,
  ): Promise<Observable<string>> {
    const topic = context.getTopic();

    return await this.service.downloadFile(topic, chunkSize);
  }
}
