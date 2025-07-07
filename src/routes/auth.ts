import { Router, RequestHandler } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router: Router = Router();

/**
 * 인증 관련 라우트
 */

// 로그인
router.post('/login', authController.login);

// 토큰 검증 및 사용자 정보 조회
router.post('/verify', authController.verifyAuth);

// 로그아웃
router.post('/logout', authController.logout);

// 보호된 라우트 예시 (인증 필요)
router.get('/profile', authenticateToken as any, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

export default router; 