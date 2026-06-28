import prisma from '../../config/prisma.js';

class ScreenShotRepository {

  async create(screenshotData, captureRequestId) {
    return await prisma.screenshots.create({
      data: {
        capture_request_id: captureRequestId,
        r2_object_key: screenshotData.r2Key,
        r2_bucket_name: screenshotData.bucket,
        file_size_bytes: screenshotData.size,
      },
    });
  }

  async findByCaptureRequestId(captureRequestId) {
    return await prisma.screenshots.findMany({
      where: { capture_request_id: captureRequestId },
    });
  }

  async delete(id) {
    return await prisma.screenshots.delete({
      where: { id },
    });
  }

}

export default new ScreenShotRepository();