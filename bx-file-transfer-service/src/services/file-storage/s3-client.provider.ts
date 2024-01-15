import { S3Client } from '@aws-sdk/client-s3';
import { Provider } from '@nestjs/common';

import { S3_ACCESS_KEY, S3_ENDPOINT, S3_REGION, S3_SECRET_KEY } from '../../configs/env';

export const S3_CLIENT_TOKEN = Symbol.for('S3ClientToken');

export const S3ClientProvider: Provider = {
  provide: S3_CLIENT_TOKEN,
  useFactory: () => {
    const client = new S3Client({
      endpoint: S3_ENDPOINT,
      region: S3_REGION || S3_ENDPOINT,
      credentials: {
        accessKeyId: S3_ACCESS_KEY,
        secretAccessKey: S3_SECRET_KEY,
      },
      /**
       * Set to `true` for compatibility with s3-ninja.
       */
      forcePathStyle: true,
    });

    return client;
  },
};
