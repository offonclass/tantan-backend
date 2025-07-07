// 환경변수 로드 (가장 먼저 실행되어야 함)
import dotenv from 'dotenv';
dotenv.config();  

// 환경에 따라 다른 .env 파일 로드
// if (process.env.NODE_ENV === 'production') {
//   dotenv.config({ path: '.env' });           // 프로덕션: .env
// } else {
//   dotenv.config({ path: '.env.local' });     // 개발: .env.local
// }

import { sequelize } from '../config/database';
import { User } from '../models/User';
import bcrypt from 'bcryptjs';

type UserRole = 'system_admin' | 'academy_admin' | 'instructor';

interface AdminUser {
  user_id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  is_active: boolean;
}

/**
 * 시스템 관리자 시드 데이터 생성
 */
const runSeeds = async () => {
  try {
    console.log('🌱 시스템 관리자 계정 생성 시작...\n');

    // 데이터베이스 연결 확인
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공!\n');

    // 시스템 관리자 데이터
    const adminUsers: AdminUser[] = [
      {
        user_id: 'admin1',
        email: 'admin1@tantan.com',
        password: await bcrypt.hash('admin123!', 10),
        name: '관리자1',
        role: 'system_admin',
        is_active: true
      },
      {
        user_id: 'admin2',
        email: 'admin2@tantan.com',
        password: await bcrypt.hash('admin123!', 10),
        name: '관리자2',
        role: 'system_admin',
        is_active: true
      },
      {
        user_id: 'admin3',
        email: 'admin3@tantan.com',
        password: await bcrypt.hash('admin123!', 10),
        name: '관리자3',
        role: 'system_admin',
        is_active: true
      }
    ];

    // 시스템 관리자 생성
    await User.bulkCreate(adminUsers);
    console.log('✅ 시스템 관리자 계정 생성 완료!');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ 시드 데이터 생성 실패:', error);
    process.exit(1);
  }
};

// 시드 실행
runSeeds(); 