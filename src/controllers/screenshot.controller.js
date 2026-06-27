import ScreenshotService from '../services/screenshot.service';
import ApiResponse from '../utils/ApiResponse';

class ScreenshotController {
  async capture(req, res, next) {
    try {
      const { url } = req.body;
      const ipAdress = req.ip;
      
      const result = await ScreenshotService.capture(url, ipAdress);
      
      return ApiResponse.created(res, result, 'Screenshot request created');
    } catch (error) {
      next(error);
    }
  }
}

export default new ScreenshotController();
