/**
 * PM2 배포 설정 파일
 * 프로덕션 환경에서 Express 서버를 안정적으로 실행하기 위한 설정
 */

module.exports = {
  apps: [
    {
      // 애플리케이션 이름
      name: 'tantan-backend',
      
      // 실행할 스크립트 (빌드된 JS 파일)
      script: './dist/index.js',
      
      // 클러스터 모드로 실행 (CPU 코어 수만큼 인스턴스 생성)
      // instances: 'max',
      // exec_mode: 'cluster',

      // 단일 인스턴스로 실행 (개발 초기 단계)
      instances: 1,
      exec_mode: 'fork',
      
      // 메모리 사용량이 750MB를 넘으면 자동 재시작
      max_memory_restart: '750M',
      
      // 파일 변경 감지 (개발환경에서만 사용)
      watch: false,
      
      // 자동 재시작 설정
      autorestart: true,
      
      // 최대 재시작 횟수 (10회 재시작 후 멈춤)
      max_restarts: 10,
      
      // 재시작 딜레이 (ms)
      restart_delay: 1000,
      
      // 로그 설정
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // 환경변수 설정
      env: {
        NODE_ENV: 'production',
        PORT: 8000
      },
      
      // 개발환경 설정
      env_development: {
        NODE_ENV: 'development',
        PORT: 8000
      },
      
      // 프로덕션 환경 설정
      env_production: {
        NODE_ENV: 'production',
        PORT: 8000
        // 실제 환경변수는 .env.production 또는 시스템에서 설정
      }
    }
  ]
}; 