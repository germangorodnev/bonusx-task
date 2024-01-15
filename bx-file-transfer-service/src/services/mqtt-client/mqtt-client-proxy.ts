import { ClientMqtt, MqttRecord, MqttRecordOptions, ReadPacket } from '@nestjs/microservices';

/**
 * Custom client proxy to support binary data transfer
 * for dispatched events payloads.
 * Also exposes mqttClient instance for testing purposes.
 *
 * @see https://github.com/nestjs/nest/issues/4823
 */
export class MqttClientProxy extends ClientMqtt {
  public getClient() {
    return this.mqttClient;
  }

  protected dispatchEvent(packet: ReadPacket<any>): Promise<any> {
    const pattern = this.normalizePattern(packet.pattern);
    const serializedPacket = this.serializer.serialize(packet);
    const options = serializedPacket.options;
    delete serializedPacket.options;

    const payload = this.getPayload(serializedPacket, options);

    return new Promise<void>((resolve, reject) =>
      this.mqttClient.publish(pattern, payload, this.mergePacketOptions(options), (err) =>
        err ? reject(err) : resolve(),
      ),
    );
  }

  /**
   * Get payload depending on the content type.
   * If it's set to 'application/octet-stream' or the payload itself is a Buffer, send it as-is.
   * Otherwise preserve default NestJS behavior and serialize the payload.
   */
  protected getPayload(serializedPacket: MqttRecord, options?: MqttRecordOptions): string | Buffer {
    if (options?.properties?.contentType === 'application/octet-stream' || serializedPacket.data instanceof Buffer) {
      return serializedPacket.data as Buffer;
    }

    return JSON.stringify(serializedPacket);
  }
}
