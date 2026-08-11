import { Router } from 'express';
import { listDepartments } from '../controllers/departments.controller.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();
router.get('/', optionalAuth, listDepartments);
export default router;

