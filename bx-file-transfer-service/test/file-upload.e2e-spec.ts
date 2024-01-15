import { createHash } from 'node:crypto';

import { count, lastValueFrom, toArray } from 'rxjs';

import { HASH_ALGORITHM } from '../src/configs/file-upload';
import { FileUploadClient } from '../src/services/file-upload-client/file-upload.client';

import { finishTest, prepareTestApp, prepareVariables } from './utils';

const TEST_STRING =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla sed elit sit amet nisl aliquam lacinia.';

describe('FileUpload (e2e)', () => {
  let { app, moduleRef } = prepareVariables();
  let fileUploadClient: FileUploadClient;

  beforeAll(async () => {
    ({ app, moduleRef } = await prepareTestApp());

    fileUploadClient = moduleRef.get<FileUploadClient>(FileUploadClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await finishTest({ app, moduleRef });
  });

  const setup = async (sizeInBytes?: number) => {
    const uid = Math.random().toString(36).substring(2, 15);
    const filename = `${uid}.txt`;

    let contents: Buffer;
    if (!sizeInBytes) {
      contents = Buffer.from(TEST_STRING);
    } else {
      contents = Buffer.alloc(
        sizeInBytes,
        TEST_STRING.repeat(Math.floor(sizeInBytes / TEST_STRING.length)) +
          TEST_STRING.substring(0, sizeInBytes % TEST_STRING.length),
        'utf-8',
      );
    }

    return {
      filename,
      contents,
    };
  };

  const getHashsum = (contents: Buffer) => createHash(HASH_ALGORITHM).update(contents).digest('hex');

  describe('upload', () => {
    it('should upload buffer in parts', async () => {
      expect.assertions(1);

      const { contents, filename } = await setup(1024 * 2);

      await fileUploadClient.uploadFile(filename, contents.length, getHashsum(contents), contents);

      // verify integrity
      const file$ = await fileUploadClient.downloadFile(filename);
      const chunks: Buffer[] = await lastValueFrom(file$.pipe(toArray()));
      const file = Buffer.concat(chunks);

      expect(file.compare(contents)).toEqual(0);
    });

    it('should throw an error when hashsums do not match', async () => {
      expect.assertions(1);

      const { contents, filename } = await setup(1024 * 2);

      await expect(
        fileUploadClient.uploadFile(filename, contents.length, getHashsum(contents) + 'a', contents),
      ).rejects.toThrowError('Hashsum mismatch');
    });

    it('should throw an error when uploading files larger than limit', async () => {
      expect.assertions(1);

      const { contents, filename } = await setup(1024 * 1024 * 2);

      try {
        await fileUploadClient.uploadFile(filename, 1, getHashsum(contents), contents);
      } catch (error: any) {
        expect(error.message).toMatch('File is too large');
      }
    });

    it('should throw validation errors on upload start', async () => {
      expect.assertions(2);
      const { contents, filename } = await setup(1024);

      try {
        await fileUploadClient.uploadFile(filename, 0, 'invalid' + getHashsum(contents), contents);
      } catch (error: any) {
        expect(error).toHaveLength(1);
        expect(error[0].property).toBe('contentLength');
      }
    });
  });

  describe('download', () => {
    it('should download file in chunks', async () => {
      const { contents, filename } = await setup(1024 * 512);

      await fileUploadClient.uploadFile(filename, contents.length, getHashsum(contents), contents);

      const file$ = await fileUploadClient.downloadFile(filename);
      const chunks = await lastValueFrom(file$.pipe(toArray()));
      const file = Buffer.concat(chunks);

      expect(chunks.length).toBeGreaterThan(1);
      expect(file.compare(contents)).toEqual(0);
    });

    it('should not emity anything for non-existent files', async () => {
      const { filename } = await setup(0);

      const file$ = await fileUploadClient.downloadFile(filename);
      const partsCount = await lastValueFrom(file$.pipe(count()));
      expect(partsCount).toEqual(0);
    });
  });
});
