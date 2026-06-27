import { Router } from 'express';
import screenshotRoutes from './screenshot.routes.js';

const router = Router();

router.use('/webcapture', screenshotRoutes);

export default router;