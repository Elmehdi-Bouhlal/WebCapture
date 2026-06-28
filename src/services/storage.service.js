import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import r2Client from '../../config/r2.js';
import config from '../../config/index.js';
import logger from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

class StorageService {

  async upload(fileBuffer, captureRequestId, mimeType = 'image/png') {
    const key = `screenshots/${captureRequestId}/${uuidv4()}.png`;

    try {
      await r2Client.send(new PutObjectCommand({
        Bucket: config.r2.bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: mimeType,
      }));

      logger.info({
        message: 'Screenshot uploaded to R2',
        key,
        captureRequestId,
      });

      return {
        key,
        bucket: config.r2.bucketName,
        size: fileBuffer.length,
      };

    } catch (error) {
      logger.error({
        message: 'Failed to upload screenshot to R2',
        error: error.message,
        captureRequestId,
      });
      throw error;
    }
  }

  async delete(key) {
    try {
      await r2Client.send(new DeleteObjectCommand({
        Bucket: config.r2.bucketName,
        Key: key,
      }));

      logger.info({
        message: 'Screenshot deleted from R2',
        key,
      });

    } catch (error) {
      logger.error({
        message: 'Failed to delete screenshot from R2',
        error: error.message,
        key,
      });
      throw error;
    }
  }

}

export default new StorageService();