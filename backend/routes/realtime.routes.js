import { Router } from 'express';
import { streamEvents, getRealtimeStatus } from '../controllers/realtime.controller.js';

const router = Router();

router.get('/stream', streamEvents);
router.get('/status', getRealtimeStatus);

export default router;
