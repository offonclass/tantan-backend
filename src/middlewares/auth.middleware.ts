import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt';
import { User } from '../models/User';

// Request 타입 확장
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
        role: 'system_admin' | 'academy_admin' | 'instructor';
        academyId?: number;
      };
    }
  }
}

/**
 * JWT 토큰 인증 미들웨어
 * Authorization 헤더의 Bearer 토큰을 검증하고 사용자 정보를 req.user에 설정
 */
export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: '인증 토큰이 필요합니다.'
      });
      return;
    }

    const token = authHeader.substring(7); // 'Bearer ' 제거
    
    // 토큰 검증
    const decoded = verifyToken(token);
    if (!decoded) {
      res.status(401).json({
        success: false,
        message: '유효하지 않은 토큰입니다.'
      });
      return;
    }

    // 사용자 존재 여부 확인
    const user = await User.findOne({
      where: { 
        id: decoded.userId,
        isExisted: true,
        isActive: true
      }
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.'
      });
      return;
    }

    // 사용자 정보를 req.user에 설정
    req.user = {
      id: user.id,
      username: user.userId,
      role: user.role,
      ...(user.academyId && { academyId: user.academyId })
    };

    next();
  } catch (error) {
    console.error('❌ 인증 미들웨어 오류:', error);
    res.status(500).json({
      success: false,
      message: '인증 처리 중 오류가 발생했습니다.'
    });
  }
};

/**
 * 역할 기반 접근 제어 미들웨어
 * 특정 역할을 가진 사용자만 접근을 허용
 * @param allowedRoles - 허용할 역할 배열
 */
export const authorizeRole = (allowedRoles: Array<'system_admin' | 'academy_admin' | 'instructor'>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // authenticateToken 미들웨어가 먼저 실행되어야 함
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: '인증이 필요합니다.'
        });
        return;
      }

      // 사용자 역할 확인
      if (!allowedRoles.includes(req.user.role)) {
        res.status(403).json({
          success: false,
          message: '접근 권한이 없습니다.'
        });
        return;
      }

      next();
    } catch (error) {
      console.error('❌ 권한 확인 미들웨어 오류:', error);
      res.status(500).json({
        success: false,
        message: '권한 확인 중 오류가 발생했습니다.'
      });
    }
  };
};

/**
 * 시스템 관리자 전용 미들웨어
 * system_admin 역할만 접근 허용
 */
export const requireSystemAdmin = authorizeRole(['system_admin']);

/**
 * 학원 관리자 및 강사 접근 미들웨어
 * academy_admin, instructor 역할 접근 허용
 */
export const requireAcademyAccess = authorizeRole(['academy_admin', 'instructor']);

/**
 * 모든 인증된 사용자 접근 미들웨어
 * 모든 역할 접근 허용
 */
export const requireAuth = authorizeRole(['system_admin', 'academy_admin', 'instructor']); 