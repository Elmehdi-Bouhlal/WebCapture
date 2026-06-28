import ScreenshotService from '../services/screenshot.service.js';
import ApiResponse from '../utils/ApiResponse.js';

class ScreenshotController {

  async capture(req, res, next) {
    try {
      const { url, retry } = req.body;
      const ipAddress = req.ip;
      const retryBool = retry === true || retry === 'true';

      const result = await ScreenshotService.capture(url, ipAddress, retryBool);
      return ApiResponse.created(res, result, 'Screenshot request created');
    } catch (error) {
      next(error);
    }
  }

}

export default new ScreenshotController();