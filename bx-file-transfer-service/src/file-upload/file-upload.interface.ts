import { Hash } from 'node:crypto';

import { CompletedPart } from '@aws-sdk/client-s3';
import { IPublishPacket } from 'mqtt';

export type MqttPacket = IPublishPacket;

export interface UploadInfo {
  /**
   * File key in S3.
   */
  key: string;
  /**
   * ID of multipart upload in S3.
   */
  s3UploadId: string;
  /**
   * Original file name.
   */
  filename: string;
  /**
   * File parts already uploaded to S3.
   */
  parts: CompletedPart[];
  /**
   * Total expected file size.
   */
  contentLength: number;
  /**
   * Hashsum of the file given by client.
   */
  hashsum: string;
  hash: Hash;
}
