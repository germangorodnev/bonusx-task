import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';

import { loggerConfig } from '../configs/logger';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    WinstonModule.forRoot(loggerConfig),
  ],
  exports: [WinstonModule, ConfigModule],
})
export class GlobalModule {
  static forRoot(options?): DynamicModule {
    return {
      global: options.isGlobal || false,
      module: GlobalModule,
    };
  }
}
