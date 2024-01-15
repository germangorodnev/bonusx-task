import { INestMicroservice } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';

export const finishTest = async ({ app, moduleRef }: { app: INestMicroservice; moduleRef: TestingModule }) => {
  try {
    await app.close();
  } catch (error) {
    console.error(error);
  }
  try {
    await moduleRef.close();
  } catch (error) {
    console.error(error);
  }
};
