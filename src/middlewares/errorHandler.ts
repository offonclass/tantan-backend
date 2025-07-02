import { Request, Response, NextFunction } from 'express';

// 404 에러 핸들러 - 존재하지 않는 라우트 접근 시
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.originalUrl,
    message: 'Please check the API documentation'
  });
};

// 전역 에러 핸들러 - 서버 내부 오류 처리
export const globalErrorHandler = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  console.error('Server Error:', err);
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
};

// 에러 핸들러들을 한번에 적용하는 함수
export const setupErrorHandlers = (app: any): void => {
  // 404 핸들러는 모든 라우트 뒤에 적용 (Express 5 호환)
  app.use(notFoundHandler);
  
  // 전역 에러 핸들러는 맨 마지막에 적용
  app.use(globalErrorHandler);
}; 