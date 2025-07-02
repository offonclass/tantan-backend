import { Sequelize } from 'sequelize';

// 환경변수에서 데이터베이스 설정 값들을 가져옵니다
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = parseInt(process.env.DB_PORT || '3306', 10);
const DB_USERNAME = process.env.DB_USERNAME || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_DATABASE = process.env.DB_DATABASE || 'tantan-dev';

// Sequelize 인스턴스 생성 - MySQL 연결 설정
export const sequelize = new Sequelize(DB_DATABASE, DB_USERNAME, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: 'mysql',
  
  // 연결 풀 설정 - 동시 연결 수 관리
  pool: {
    max: 5,        // 최대 연결 수
    min: 0,        // 최소 연결 수
    acquire: 30000, // 연결 획득 최대 대기 시간 (30초)
    idle: 10000    // 유휴 연결 해제 시간 (10초)
  },
  
  // 로깅 설정 - 개발 환경에서만 SQL 쿼리 로그 출력
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  
  // 타임존 설정 - 한국 시간
  timezone: '+09:00',
  
  // 추가 MySQL 설정
  define: {
    charset: 'utf8mb4',           // 이모지 포함 UTF-8 지원
    collate: 'utf8mb4_unicode_ci', // 유니코드 정렬
    timestamps: true,             // createdAt, updatedAt 자동 추가
    underscored: true,            // snake_case 컬럼명 사용
    freezeTableName: true,        // 테이블명 복수형 변환 방지
  }
});

// 데이터베이스 동기화 함수
export const syncDatabase = async (): Promise<void> => {
  try {
    await sequelize.sync({ 
      force: false,  // true로 설정하면 기존 테이블 삭제 후 재생성 (주의!)
      alter: false   // 스키마 변경이 필요할 때만 수동으로 true로 변경 후 실행
    });
    console.log('✅ Database connected and synchronized successfully');
    console.log(`📍 Connected to: ${DB_HOST}:${DB_PORT}/${DB_DATABASE}`);
  } catch (error) {
    console.error('❌ Database connection or synchronization failed:', error);
    throw error;
  }
}; 