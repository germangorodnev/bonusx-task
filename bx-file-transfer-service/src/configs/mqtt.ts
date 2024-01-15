import { ClientProviderOptions, MqttOptions, Transport } from '@nestjs/microservices';

import { MqttClientProxy } from '../services/mqtt-client/mqtt-client-proxy';

import { MQTT_URL } from './env';

export const MqttConfigSymbol = Symbol.for('mqttConfig');

export const mqttConfig: ClientProviderOptions & MqttOptions = {
  name: MqttConfigSymbol,
  transport: Transport.MQTT,
  options: {
    url: MQTT_URL,
  },
  customClass: MqttClientProxy,
};

export default mqttConfig;
