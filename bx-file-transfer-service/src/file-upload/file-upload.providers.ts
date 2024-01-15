import { Provider } from '@nestjs/common';

import { FILE_SIZE_LIMIT } from './file-upload.constants';

export const FILE_SIZE_TOKEN = Symbol.for('FILE_SIZE_TOKEN');

export const FileSizeProvider: Provider = {
  provide: FILE_SIZE_TOKEN,
  useFactory: () => FILE_SIZE_LIMIT,
};
