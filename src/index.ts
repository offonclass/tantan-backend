// 환경변수 로드 (가장 먼저 실행되어야 함)
import dotenv from 'dotenv';

// 환경에 따라 다른 .env 파일 로드
if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: '.env' });           // 프로덕션: .env
} else {
  dotenv.config({ path: '.env.local' });     // 개발: .env.local
}

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { syncDatabase } from './config/database';
import { setupErrorHandlers } from './middlewares/errorHandler';
import routes from './routes';
import './models'; // 모델들을 import하여 Sequelize에 등록

// Express 애플리케이션 생성
const app = express();

// 서버 포트 설정 (환경변수 또는 기본값 8000)
const PORT = process.env.PORT || 8000;

// =============================================================================
// 미들웨어 설정
// =============================================================================

// CORS 설정 - 프론트엔드에서 API 호출을 허용
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000', // tantan-front 주소
  credentials: true, // 쿠키, 인증 헤더 등을 포함한 요청 허용
}));

// Helmet - 보안 헤더 설정 (XSS, 클릭재킹 등 방어)
app.use(helmet());

// JSON 파싱 미들웨어 - 요청 본문의 JSON 데이터를 파싱
app.use(express.json({ limit: '100mb' }));

// URL 인코딩 파싱 미들웨어 - 폼 데이터를 파싱
app.use(express.urlencoded({ extended: true }));

// =============================================================================
// API 라우트 설정
// =============================================================================

// 메인 라우터 연결
app.use('/', routes);

// =============================================================================
// 에러 핸들링
// =============================================================================

// 에러 핸들러 설정 (404, 500 등 모든 에러 처리)
setupErrorHandlers(app);

// =============================================================================
// 서버 시작
// =============================================================================

// 데이터베이스 초기화 및 서버 시작
const startServer = async () => {
  try {
    // 1. 데이터베이스 연결 및 테이블 동기화 실행 (alter: false 기본)
    await syncDatabase();
    
    // 3. Express 서버 시작
    app.listen(PORT, () => {
      console.log('🚀 TantanClass Backend Server Started!');
      console.log(`📍 Server running on: http://localhost:${PORT}`);
      console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
      console.log('================================================');
    });
    
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
};

// 서버 시작
startServer();

// Graceful shutdown - 서버 종료 시 정리 작업
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
}); 