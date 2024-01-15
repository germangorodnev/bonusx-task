import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';

import mqttConfig from '../../configs/mqtt';

import { MqttClientService } from './mqtt-client.service';

@Module({
  imports: [ClientsModule.register([mqttConfig])],
  providers: [MqttClientService],
  exports: [MqttClientService],
})
export class MqttClientModule {}
