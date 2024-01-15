import { WinstonModule, utilities } from 'nest-winston';
import { format, transports } from 'winston';

import { APP_NAME, LOG_COLOR } from './env';

export const loggerConfig = {
  transports: [
    new transports.Console({
      format: format.combine(
        format.timestamp(),
        format.ms(),
        utilities.format.nestLike(APP_NAME, {
          colors: LOG_COLOR,
          prettyPrint: true,
        }),
      ),
    }),
  ],
};

export const logger = WinstonModule.createLogger(loggerConfig);
