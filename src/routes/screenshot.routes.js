import { Router } from 'express';
import ScreenshotController from '../controllers/screenshot.controller.js';
import validateCaptureRequest from '../middlewares/validators/screenshot.validator.js';


const router = Router();

router.post('/analyze',validateCaptureRequest, ScreenshotController.capture);

export default router;