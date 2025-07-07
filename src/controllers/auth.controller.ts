import { RequestHandler, Request, Response } from 'express';
import { User } from '../models/User';
import { Academy } from '../models/Academy';
import { generateToken, verifyToken } from '../utils/jwt';

/**
 * 인증 컨트롤러
 */
export const authController = {
  /**
   * 사용자 로그인
   * - 아이디와 패스워드로 인증
   * - 성공 시 JWT 토큰과 사용자 정보, 학원 정보 반환
   */
  login: (async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;

      // 필수 필드 검증
      if (!username?.trim() || !password?.trim()) {
        return res.status(400).json({
          success: false,
          message: '아이디와 패스워드를 입력해주세요.'
        });
      }

      // 사용자 조회 (존재하는 계정만, 학원 정보 포함)
      const user = await User.findOne({
        where: { 
          userId: username.trim(),
          isExisted: true,
          isActive: true
        },
        include: [
          {
            model: Academy,
            as: 'academy', // alias 추가
            required: false, // LEFT JOIN (시스템 관리자는 학원이 없을 수 있음)
            where: {
              isExisted: true
            }
          }
        ]
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: '아이디 또는 패스워드가 올바르지 않습니다.'
        });
      }

      // 패스워드 검증
      const isPasswordValid = await user.validatePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: '아이디 또는 패스워드가 올바르지 않습니다.'
        });
      }

      // JWT 토큰 생성
      const token = generateToken({
        userId: user.id,
        username: user.userId,
        role: user.role,
        ...(user.academyId && { academyId: user.academyId })
      });

      // 마지막 로그인 시간 업데이트
      await user.updateLastLogin();

      return res.status(200).json({
        success: true,
        token,
        user: {
          id: user.id,
          username: user.userId,
          name: user.name,
          email: user.email || '',
          phoneNumber: user.phoneNumber || '',
          role: user.role,
          academyId: user.academyId,
          lastLoginAt: user.lastLoginAt
        },
        academy: (user as any).academy || null
      });
    } catch (error) {
      console.error('❌ 로그인 실패:', error);
      return res.status(500).json({
        success: false,
        message: '로그인 처리 중 오류가 발생했습니다.'
      });
    }
  }) as unknown as RequestHandler,

  /**
   * JWT 토큰 검증 및 사용자 정보 반환
   * - Authorization 헤더의 토큰 검증
   * - 유효한 토큰인 경우 사용자 정보와 학원 정보 반환
   */
  verifyAuth: (async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          message: '인증 토큰이 필요합니다.'
        });
      }

      const token = authHeader.substring(7); // 'Bearer ' 제거
      
      // 토큰 검증
      const decoded = verifyToken(token);
      if (!decoded) {
        return res.status(401).json({
          success: false,
          message: '유효하지 않은 토큰입니다.'
        });
      }

      // 사용자 정보 조회 (학원 정보 포함)
      const user = await User.findOne({
        where: { 
          id: decoded.userId,
          isExisted: true,
          isActive: true
        },
        include: [
          {
            model: Academy,
            as: 'academy', // alias 추가
            required: false, // LEFT JOIN (시스템 관리자는 학원이 없을 수 있음)
            where: {
              isExisted: true
            }
          }
        ]
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: '사용자를 찾을 수 없습니다.'
        });
      }

      return res.status(200).json({
        success: true,
        user: {
          id: user.id,
          username: user.userId,
          name: user.name,
          email: user.email || '',
          phoneNumber: user.phoneNumber || '',
          role: user.role,
          academyId: user.academyId,
          lastLoginAt: user.lastLoginAt
        },
        academy: (user as any).academy || null
      });
    } catch (error) {
      console.error('❌ 토큰 검증 실패:', error);
      return res.status(500).json({
        success: false,
        message: '토큰 검증 중 오류가 발생했습니다.'
      });
    }
  }) as unknown as RequestHandler,

  /**
   * 로그아웃
   * - 클라이언트에서 토큰 삭제를 위한 응답
   * - 실제 토큰 무효화는 클라이언트에서 처리
   */
  logout: (async (req: Request, res: Response) => {
    try {
      return res.status(200).json({
        success: true,
        message: '로그아웃되었습니다.'
      });
    } catch (error) {
      console.error('❌ 로그아웃 실패:', error);
      return res.status(500).json({
        success: false,
        message: '로그아웃 처리 중 오류가 발생했습니다.'
      });
    }
  }) as unknown as RequestHandler
}; 