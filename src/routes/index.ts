import { Router } from 'express';
import adminRoutes from './admin';
import authRoutes from './auth';
import userRoutes from './user';

const router: Router = Router();

// /api/auth 경로에 인증 라우트 연결
router.use('/api/auth', authRoutes);

// /api/admin 경로에 관리자 라우트 연결
router.use('/api/admin', adminRoutes);

// /api/user 경로에 사용자 라우트 연결
router.use('/api/user', userRoutes);

export default router; 