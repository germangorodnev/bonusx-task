import { TestBed } from '@automock/jest';

import mqttConfig from '../../configs/mqtt';

import { IMqttClientService } from './mqtt-client.interface';
import { MqttClientService } from './mqtt-client.service';

describe('MqttClientService', () => {
  const channel = 'channel';
  const message = 'message';
  const mockedEmit = jest.fn();

  let underTest: IMqttClientService;

  beforeEach(async () => {
    const { unit } = TestBed.create(MqttClientService)
      .mock(mqttConfig.name as string)
      .using({ emit: mockedEmit })
      .compile();

    underTest = unit;
  });

  it('should expect message is sended', () => {
    underTest.emit(channel, message);
    expect(mockedEmit).toBeCalledWith(channel, { data: 'message', options: { qos: 0, retain: false } });
  });
});
