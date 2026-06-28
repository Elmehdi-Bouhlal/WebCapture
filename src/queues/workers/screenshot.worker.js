import QueueRepository from '../../repositories/queue.repository.js';
import logger from '../../utils/logger.js';

export const screenshotWorker = async (job) => {
  const { url, captureRequestId } = job.data;

  logger.info({
    message: 'Processing screenshot job',
    url,
    captureRequestId,
  });

  try {

    await QueueRepository.updateQueueStatus(captureRequestId, 'processing');

    // Step 2 — take the screenshot
    // this is where Puppeteer/Playwright will go later
    const screenshot = await ScreenshotService.takeScreenshot(url);

    // Step 3 — save screenshot to storage
    // this is where R2/S3 upload will go later
    const savedFile = await StorageService.upload(screenshot, captureRequestId);

    // Step 4 — save screenshot record to database
    await ScreenshotRepository.create({
      captureRequestId,
      r2ObjectKey: savedFile.key,
      r2BucketName: savedFile.bucket,
      fileSizeBytes: savedFile.size,
    });

    // Step 5 — update status to completed
    await CaptureRequestRepository.updateStatus(captureRequestId, 'completed');

    logger.info({
      message: 'Screenshot job completed',
      url,
      captureRequestId,
    });

  } catch (error) {

    // update status to failed
    await CaptureRequestRepository.updateStatus(captureRequestId, 'failed');

    logger.error({
      message: 'Screenshot job failed',
      url,
      captureRequestId,
      error: error.message,
      stack: error.stack,
    });

    // rethrow so pg-boss marks job as failed
    throw error;
  }

};