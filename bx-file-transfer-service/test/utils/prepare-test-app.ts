import { INestMicroservice } from '@nestjs/common';
import { ClientMqtt, ClientsModule, MicroserviceOptions } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';

import mqttConfig from '../../src/configs/mqtt';
import { FILE_SIZE_TOKEN } from '../../src/file-upload/file-upload.providers';
import { AppModule } from '../../src/modules/app.module';
import { FileUploadClientModule } from '../../src/services/file-upload-client/file-upload-client.module';

import { TEST_CLIENT } from './test-client';

interface TestVariables {
  app: INestMicroservice;
  moduleRef: TestingModule;
  clientProxy: ClientMqtt;
}

const empty = <T>() => undefined as T;

export const prepareVariables = (): TestVariables => ({
  app: empty<INestMicroservice>(),
  clientProxy: empty<ClientMqtt>(),
  moduleRef: empty<TestingModule>(),
});

export const prepareTestApp = async () => {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule, ClientsModule.register([{ ...mqttConfig, name: TEST_CLIENT }]), FileUploadClientModule],
  })
    .overrideProvider(FILE_SIZE_TOKEN)
    .useValue(1024 * 1024)
    .compile();

  const clientProxy = moduleRef.get<ClientMqtt>(TEST_CLIENT);

  const app = moduleRef.createNestMicroservice<MicroserviceOptions>({ ...mqttConfig });
  app.enableShutdownHooks();

  await app.listen();

  return {
    app,
    clientProxy,
    moduleRef,
  };
};
