import { getEnvVar } from '../utils/get-env-var';

export enum EnvironmentNames {
  local = 'local',
  develop = 'develop',
  staging = 'staging',
  production = 'production',
}

export const APP_NAME = 'bx-file-transfer-service';
export const LOG_COLOR = process.env.LOG_COLOR === 'true' ? true : false;
export const ENV_NAME = getEnvVar('NODE_ENV') as EnvironmentNames;

export enum TopicForSubscriptionCollection {
  fileUploadStart = 'file/upload/start',
  fileUploadPart = 'file/upload/+/part/+',
  fileUploadPartDone = 'file/upload/+/part/+/done',
  fileUploadEnd = 'file/upload/+/end',
  fileDownload = 'file/download/+',
}

export const MQTT_HOST = getEnvVar('MQTT_HOST');
export const MQTT_PORT = getEnvVar('MQTT_PORT');
export const MQTT_PROTOCOL = getEnvVar('MQTT_PROTOCOL');
export const MQTT_URL = `${MQTT_PROTOCOL}://${MQTT_HOST}:${MQTT_PORT}`;

export const S3_BUCKET = getEnvVar('S3_BUCKET');
export const S3_REGION = process.env.S3_REGION;
export const S3_ENDPOINT = getEnvVar('S3_ENDPOINT');
export const S3_ACCESS_KEY = getEnvVar('S3_ACCESS_KEY');
export const S3_SECRET_KEY = getEnvVar('S3_SECRET_KEY');
