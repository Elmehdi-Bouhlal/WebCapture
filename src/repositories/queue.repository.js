import prisma from '../../config/prisma.js';

class QueueRepository {
  async findQueueByUrl(url) {
    const activeJobs = await prisma.capture_requests.findFirst({
      where: { url }
    });
    return activeJobs;
  }

  async removeQueue(queueId) {
    await prisma.capture_requests.delete({
      where: {
        id: queueId
      },
    });
  }

  async createQueue(url, guestSessionId) {
    return await prisma.capture_requests.create({
      data: {
        url,
        guest_session_id: guestSessionId,
        status: 'pending',
      },
    });
  }

  async updateQueueStatus(queueId, status) {
    return await prisma.capture_requests.update({
      where: {
        id: queueId
      },
      data: {
        status,
      },
    });
  }
}

export default new QueueRepository();