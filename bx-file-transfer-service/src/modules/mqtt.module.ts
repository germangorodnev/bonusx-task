import { DynamicModule, Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';

import mqttConfig from '../configs/mqtt';
import { MqttClientService } from '../services/mqtt-client/mqtt-client.service';

@Module({
  imports: [ClientsModule.register([mqttConfig])],
  providers: [MqttClientService],
  exports: [MqttClientService],
})
export class MqttModule {
  static forRoot(options?): DynamicModule {
    return {
      global: options.isGlobal || false,
      module: MqttModule,
    };
  }
}
