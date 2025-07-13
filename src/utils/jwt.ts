import jwt from 'jsonwebtoken';

/**
 * JWT 토큰 관련 유틸리티 함수들
 */

// JWT 페이로드 인터페이스
export interface JwtPayload {
  userId: number;
  username: string;
  role: 'system_admin' | 'academy_admin' | 'instructor';
  academyId?: number;
  iat?: number;
  exp?: number;
}

/**
 * JWT 토큰 생성
 * @param payload - 토큰에 포함할 사용자 정보
 * @returns JWT 토큰 문자열
 */
export const generateToken = (payload: Omit<JwtPayload, 'iat' | 'exp'>): string => {
  const secret = process.env.JWT_SECRET || 'your-secret-key';
  const expiresIn = process.env.JWT_EXPIRATION || '24h';
  
  // 환경변수에서 설정한 유효기간 사용 (24시간 기본값)
  const token = jwt.sign(payload, secret, {
    expiresIn: '24h',
    issuer: 'tantan-backend'
  });
  
  return token;
};

/**
 * JWT 토큰 검증
 * @param token - 검증할 JWT 토큰
 * @returns 검증된 페이로드 또는 null
 */
export const verifyToken = (token: string): JwtPayload | null => {
  try {
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    
    const decoded = jwt.verify(token, secret) as JwtPayload;
    
    // 토큰이 유효한지 확인
    if (!decoded.userId || !decoded.username || !decoded.role) {
      console.error('❌ JWT 토큰에 필수 정보가 없습니다:', decoded);
      return null;
    }
    
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      // console.error('❌ JWT 토큰이 만료되었습니다:', error.message);
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.error('❌ 유효하지 않은 JWT 토큰입니다:', error.message);
    } else {
      console.error('❌ JWT 토큰 검증 중 오류:', error);
    }
    return null;
  }
};

/**
 * JWT 토큰 디코딩 (검증 없이)
 * @param token - 디코딩할 JWT 토큰
 * @returns 디코딩된 페이로드 또는 null
 */
export const decodeToken = (token: string): JwtPayload | null => {
  try {
    const decoded = jwt.decode(token) as JwtPayload;
    
    if (!decoded || typeof decoded !== 'object') {
      return null;
    }
    
    return decoded;
  } catch (error) {
    console.error('❌ JWT 토큰 디코딩 실패:', error);
    return null;
  }
};

/**
 * 토큰 만료 시간 확인
 * @param token - 확인할 JWT 토큰
 * @returns 만료 여부
 */
export const isTokenExpired = (token: string): boolean => {
  const decoded = decodeToken(token);
  
  if (!decoded || !decoded.exp) {
    return true;
  }
  
  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.exp < currentTime;
};

/**
 * 토큰에서 사용자 ID 추출
 * @param token - JWT 토큰
 * @returns 사용자 ID 또는 null
 */
export const getUserIdFromToken = (token: string): number | null => {
  const decoded = verifyToken(token);
  return decoded ? decoded.userId : null;
}; 