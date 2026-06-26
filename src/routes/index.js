import { Router } from 'express';
import screenshotRoutes from './screenshot.routes.js';

const router = Router();

router.use('/screenshots', screenshotRoutes);

export default router;