import { Router } from 'express';

const router = Router();

router.get('/test', function(){ console.log("test");return { message: 'test' }  });

export default router;