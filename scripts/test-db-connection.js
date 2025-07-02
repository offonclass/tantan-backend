// 데이터베이스 연결 테스트 스크립트
require('dotenv').config();
const mysql = require('mysql2/promise');

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'tantan-dev',
  connectTimeout: 60000,
  acquireTimeout: 60000,
  timeout: 60000,
  ssl: false
};

async function testConnection() {
  console.log('🔍 데이터베이스 연결 테스트 시작...');
  console.log('📍 연결 정보:', {
    host: config.host,
    port: config.port,
    user: config.user,
    database: config.database,
    // password는 보안상 출력하지 않음
  });

  let connection;
  
  try {
    console.log('⏳ 연결 시도 중...');
    connection = await mysql.createConnection(config);
    
    console.log('✅ 데이터베이스 연결 성공!');
    
    // 간단한 쿼리 테스트
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ 쿼리 테스트 성공:', rows);
    
    // 데이터베이스 목록 확인
    const [databases] = await connection.execute('SHOW DATABASES');
    console.log('📋 사용 가능한 데이터베이스:', databases.map(db => db.Database));
    
  } catch (error) {
    console.error('❌ 연결 실패:', error.message);
    console.error('상세 정보:', {
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 연결 종료');
    }
  }
}

testConnection(); 