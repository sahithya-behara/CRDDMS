import { Router } from 'express';
import {
  listUsers,
  getUser,
  updateUser,
  deleteUser,
  getPendingRegistrations,
  approveRegistration,
  rejectRegistration,
} from '../controllers/users.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

// Super Admin dedicated registration approval endpoints
router.get('/pending-registrations', authorize('super_admin'), getPendingRegistrations);
router.post('/:id/approve-registration', authorize('super_admin'), approveRegistration);
router.post('/:id/reject-registration', authorize('super_admin'), rejectRegistration);

// Standard user management
router.get('/',        authorize('admin', 'super_admin'), listUsers);
router.get('/:id',     getUser);
router.put('/:id',     authorize('admin', 'super_admin'), updateUser);
router.delete('/:id',  authorize('super_admin'), deleteUser);

export default router;
