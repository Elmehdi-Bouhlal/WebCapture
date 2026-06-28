import ScreenshotQueueService from '../../services/screenshotqueue.service.js';
import ScreenShotRepository from '../../repositories/screenShot.repository.js';
import QueueRepository from '../../repositories/queue.repository.js';
import logger from '../../utils/logger.js';

export const screenshotWorker = async ([job]) => {
  const { url, captureRequestId } = job.data;

  logger.info({
    message: 'Processing screenshot job',
    url,
    captureRequestId,
  });

  try {
    await QueueRepository.updateQueueStatus(captureRequestId, 'processing');
    const sections = await ScreenshotQueueService.capture(url, captureRequestId);

    for (const section of sections) {
      await ScreenShotRepository.create(
        {
          r2Key: section.r2Key,
          bucket: section.r2Bucket,
          size: section.r2Size,
        },
        captureRequestId,
      );
    }

    await QueueRepository.updateQueueStatus(captureRequestId, 'completed');

    logger.info({
      message: 'Screenshot job completed',
      url,
      captureRequestId,
    });
  } catch (error) {
    await QueueRepository.updateQueueStatus(captureRequestId, 'failed');

    logger.error({
      message: 'Screenshot job failed',
      url,
      captureRequestId,
      error: error.message,
      stack: error.stack,
    });

    throw error;
  }
};
