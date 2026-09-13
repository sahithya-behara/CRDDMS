import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  login,
  logout,
  register,
  verifyEmail,
  resendVerification,
  getMe,
  forgotPassword,
  resetPassword,
} from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Rate limiter for password recovery endpoints (max 10 requests per 15 minutes)
const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Too many password recovery attempts. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for registration & verification requests (max 15 requests per 15 minutes)
const authActionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: {
    success: false,
    message: 'Too many verification attempts. Please wait a few minutes before trying again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login',               login);
router.post('/register',            authActionLimiter, register);
router.get('/verify-email',         authActionLimiter, verifyEmail);
router.post('/verify-email',        authActionLimiter, verifyEmail);
router.post('/resend-verification', authActionLimiter, resendVerification);
router.post('/logout',              authenticate, logout);
router.get('/me',                   authenticate, getMe);
router.post('/forgot-password',     passwordResetLimiter, forgotPassword);
router.post('/reset-password',      passwordResetLimiter, resetPassword);

export default router;
