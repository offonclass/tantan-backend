import { S3Client } from '@aws-sdk/client-s3';

// 환경변수 체크
const requiredEnvVars = [
  'AWS_ACCESS_KEY',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_REGION',
  'S3_BUCKET_NAME',
  'S3_BUCKET_TEMP'  // 임시 저장소 버킷 추가
];

// 필수 환경변수 체크
requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    throw new Error(`❌ 필수 환경변수가 없습니다: ${varName}`);
  }
});

// S3 클라이언트 설정
export const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
});

// S3 버킷 이름 export
export const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME!;
export const S3_BUCKET_TEMP = process.env.S3_BUCKET_TEMP!;  // 임시 저장소 버킷

// S3 경로 상수
export const S3_PATHS = {
  BOOK_PAGE: 'book-page/',  // 변환된 이미지 저장 경로
  TEMP: 'temp/',            // 임시 PDF 저장 경로
  AUDIO: 'audio/',          // 오디오 파일 저장 경로
  HTML_LAYER: 'html-layer/' // HTML 레이어 저장 경로
} as const;

// 유틸리티 함수: S3 키 생성 (폴더 경로)
export const createS3Key = (uuid: string, fileName?: string): string => {
  // book-page/ 경로를 기본으로 사용
  const basePath = S3_PATHS.BOOK_PAGE;
  
  if (fileName) {
    return `${basePath}${uuid}/${fileName}`;
  }
  return `${basePath}${uuid}/`;
};

// 유틸리티 함수: 임시 저장소 키 생성
export const createTempKey = (uploadId: string, fileName: string): string => {
  return `${S3_PATHS.TEMP}${uploadId}/${fileName}`;
};

// 유틸리티 함수: 오디오 S3 키 생성
export const createAudioS3Key = (pageUuid: string, audioUuid: string, fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  return `${S3_PATHS.AUDIO}${pageUuid}/${audioUuid}.${extension}`;
};

// 유틸리티 함수: HTML 레이어 S3 키 생성
export const createHTMLLayerS3Key = (pageUuid: string): string => {
  return `${S3_PATHS.HTML_LAYER}${pageUuid}/layer.html`;
};

// 유틸리티 함수: Content-Type 추측
export const getMimeType = (fileName: string): string => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'pdf':
      return 'application/pdf';
    // 오디오 파일 MIME 타입 추가
    case 'mp3':
      return 'audio/mpeg';
    case 'wav':
      return 'audio/wav';
    case 'ogg':
      return 'audio/ogg';
    case 'aac':
      return 'audio/aac';
    case 'm4a':
      return 'audio/mp4';
    case 'flac':
      return 'audio/flac';
    default:
      return 'application/octet-stream';
  }
}; 