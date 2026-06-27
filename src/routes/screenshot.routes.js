import { Router } from 'express';
import { captureController } from '../controllers/screenshot.controller';
import validateCaptureRequest from '../middlewares/validators/screenshot.validator';


const router = Router();

router.get('/analyze',validateCaptureRequest, captureController.capture);

export default router;