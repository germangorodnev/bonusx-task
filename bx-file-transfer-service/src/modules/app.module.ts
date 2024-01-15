import { Module } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';

import { FileUploadModule } from '../file-upload/file-upload.module';
import { globalValidationPipe } from '../utils/validation/validation-pipe';

import { GlobalModule } from './global.module';
import { MqttModule } from './mqtt.module';

@Module({
  imports: [MqttModule.forRoot({ isGlobal: true }), GlobalModule.forRoot({ isGlobal: true }), FileUploadModule],
  providers: [
    {
      provide: APP_PIPE,
      useValue: globalValidationPipe,
    },
  ],
})
export class AppModule {}
