import GuestSessionRepository from '../repositories/guestSession.repository.js';
import QueueRepository from '../repositories/queue.repository.js';
import { ReachlimitError, UrlPingError, ConflictError } from '../errors/index.js';
import { MAX_TRIES } from '../../config/constants.js';
import WebsiteService from './website.service.js';
import boss from '../../config/pgboss.js';
import { QUEUE_NAME } from '../../config/constants.js';

class ScreenshotCaptureService {
  async capture(url, ip, retry = false) {
    const guestSession = await GuestSessionRepository.findOrCreate(ip);
    if (guestSession.is_blocked) throw new ReachlimitError('You have been permanently blocked');
    if (guestSession.tries_used >= MAX_TRIES) {
      await GuestSessionRepository.block(guestSession.id);
      throw new ReachlimitError('You have exceeded the maximum number of tries');
    }
    const queue = await QueueRepository.findQueueByUrl(url);
    if (queue) {
      switch (queue.status) {
        case 'pending':
        case 'processing':
          throw new ConflictError('This URL is already being processed');
        case 'completed':
          return queue;
        case 'failed':
          if (retry) {
            await QueueRepository.removeQueue(queue.id);
          } else {
            throw new ConflictError('This request failed, please try again later');
          }
          break;
      }
    }
    const reachable = await WebsiteService.isReachable(url);
    if (!reachable) throw new UrlPingError('website url is not reachable');
    const captureRequest = await QueueRepository.createQueue(url, guestSession.id);
    await boss.send(QUEUE_NAME, {
      url,
      captureRequestId: captureRequest.id,
    });
    await GuestSessionRepository.incrementTries(guestSession.id);
    return captureRequest;
  }
}

export default new ScreenshotCaptureService();
