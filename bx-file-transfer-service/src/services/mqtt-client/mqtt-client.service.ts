import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { MqttRecord, MqttRecordBuilder, MqttRecordOptions } from '@nestjs/microservices';

import { MqttConfigSymbol } from '../../configs/mqtt';

import { MqttClientProxy } from './mqtt-client-proxy';
import { IMqttClientService } from './mqtt-client.interface';

@Injectable()
export class MqttClientService implements IMqttClientService, OnModuleInit {
  constructor(@Inject(MqttConfigSymbol) private readonly client: MqttClientProxy) {}

  onModuleInit() {
    return this.client.connect();
  }

  send<Message, Result = any>(
    channel: string,
    message: Message,
    qos?: MqttRecordOptions['qos'],
    properties?: MqttRecordOptions['properties'],
  ) {
    const record = this.buildRecord(message, qos, properties);

    return this.client.send<Result, MqttRecord<Message>>(channel, record);
  }

  emit<Message>(
    channel: string,
    message: Message,
    qos?: MqttRecordOptions['qos'],
    properties?: MqttRecordOptions['properties'],
  ) {
    const record = this.buildRecord(message, qos, properties);

    return this.client.emit<string, MqttRecord<Message>>(channel, record);
  }

  protected buildRecord<Message>(
    message: Message,
    qos?: MqttRecordOptions['qos'],
    properties?: MqttRecordOptions['properties'],
  ) {
    const builder = new MqttRecordBuilder<Message>(message).setRetain(false).setQoS(0);

    if (properties) {
      builder.setProperties(properties);
    }
    if (typeof qos !== 'undefined') {
      builder.setQoS(qos);
    }

    return builder.build();
  }

  get mqttClient() {
    return this.client.getClient();
  }
}
