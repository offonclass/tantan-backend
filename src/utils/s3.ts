import { 
  PutObjectCommand, 
  DeleteObjectCommand, 
  ListObjectsV2Command,
  DeleteObjectsCommand,
  HeadObjectCommand,
  GetObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, S3_BUCKET_NAME, S3_BUCKET_TEMP, createS3Key, createTempKey, createAudioS3Key, createHTMLLayerS3Key, getMimeType } from '../config/aws';

/**
 * S3 관련 유틸리티 함수들
 */


/**
 * 폴더 존재 여부 확인
 */
export const folderExists = async (uuid: string): Promise<boolean> => {
  try {
    const command = new HeadObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: createS3Key(uuid)
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * 폴더 내 모든 객체 조회
 */
export const listFolderContents = async (uuid: string): Promise<string[]> => {
  try {
    const command = new ListObjectsV2Command({
      Bucket: S3_BUCKET_NAME,
      Prefix: createS3Key(uuid)
    });

    const response = await s3Client.send(command);
    return response.Contents?.map(item => item.Key!) || [];
  } catch (error) {
    console.error('❌ S3 폴더 내용 조회 실패:', error);
    throw error;
  }
};

/**
 * 폴더와 내부 파일들 모두 삭제
 */
export const deleteFolder = async (uuid: string): Promise<void> => {
  try {
    // 1. 폴더 내 모든 객체 조회
    const objects = await listFolderContents(uuid);
    
    if (objects.length === 0) {
      console.log(`⚠️ S3 폴더가 비어있거나 존재하지 않음: ${uuid}/`);
      return;
    }

    // 2. 모든 객체 삭제
    const command = new DeleteObjectsCommand({
      Bucket: S3_BUCKET_NAME,
      Delete: {
        Objects: objects.map(Key => ({ Key })),
        Quiet: false
      }
    });

    await s3Client.send(command);
    // console.log(`✅ S3 폴더 삭제 완료: ${uuid}/`);
  } catch (error) {
    console.error('❌ S3 폴더 삭제 실패:', error);
    throw error;
  }
};

/**
 * 단일 파일 삭제
 */
export const deleteFile = async (uuid: string, fileName: string): Promise<void> => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: createS3Key(uuid, fileName)
    });

    await s3Client.send(command);
    // console.log(`✅ S3 파일 삭제 완료: ${uuid}/${fileName}`);
  } catch (error) {
    console.error('❌ S3 파일 삭제 실패:', error);
    throw error;
  }
}; 

/**
 * PDF 업로드용 Presigned URL 생성
 */
export const generatePdfUploadUrl = async (
  uuid: string,
  fileName: string,
  fileSize: number
): Promise<{ presignedUrl: string; tempKey: string }> => {
  try {
    
    const tempKey = createTempKey(uuid, fileName);    
    
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET_TEMP,
      Key: tempKey,
      ContentType: 'application/pdf',
      ContentLength: fileSize,
      ServerSideEncryption: 'AES256',
      Metadata: {
        uuid,
        originalFileName: fileName,
        'callback-url': `${process.env.BACKEND_URL_FOR_LAMBDA}/api/admin/conversion-complete`
      }
    });

    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 }); // 15분

    // console.log(`✅ Presigned URL 생성 완료: ${tempKey}`);
    return { presignedUrl, tempKey };
  } catch (error) {
    console.error('❌ Presigned URL 생성 실패:', error);
    throw error;
  }
};

/**
 * 오디오 업로드용 Presigned URL 생성
 */
export const generateAudioUploadUrl = async (
  pageUuid: string,
  audioUuid: string,
  fileName: string,
  fileSize: number,
  mimeType: string
): Promise<{ presignedUrl: string; s3Key: string }> => {
  try {
    const s3Key = createAudioS3Key(pageUuid, audioUuid, fileName);
    
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: s3Key,
      ContentType: mimeType,
      ContentLength: fileSize,
      ServerSideEncryption: 'AES256',
      Metadata: {
        audioUuid,
        pageUuid,
        originalFileName: fileName
      }
    });

    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 }); // 15분

    // console.log(`✅ 오디오 Presigned URL 생성 완료: ${s3Key}`);
    return { presignedUrl, s3Key };
  } catch (error) {
    console.error('❌ 오디오 Presigned URL 생성 실패:', error);
    throw error;
  }
};

/**
 * HTML 레이어 파일 S3에 직접 업로드
 */
export const uploadHTMLLayerToS3 = async (
  pageUuid: string,
  htmlContent: string
): Promise<{ s3Key: string }> => {
  try {
    const s3Key = createHTMLLayerS3Key(pageUuid);
    
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: s3Key,
      Body: htmlContent,
      ContentType: 'text/html; charset=utf-8',
      ServerSideEncryption: 'AES256',
      Metadata: {
        pageUuid,
        contentType: 'html-layer'
      }
    });

    await s3Client.send(command);
    
    // console.log(`✅ HTML 레이어 업로드 완료: ${s3Key}`);
    return { s3Key };
  } catch (error) {
    console.error('❌ HTML 레이어 업로드 실패:', error);
    throw error;
  }
};

/**
 * HTML 레이어 파일 S3에서 다운로드
 */
export const downloadHTMLLayerFromS3 = async (
  pageUuid: string
): Promise<{ htmlContent: string; hasFile: boolean }> => {
  try {
    const s3Key = createHTMLLayerS3Key(pageUuid);
    
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: s3Key
    });

    const response = await s3Client.send(command);
    
    if (response.Body) {
      const htmlContent = await response.Body.transformToString('utf-8');
      // console.log(`✅ HTML 레이어 다운로드 완료: ${s3Key}`);
      return { htmlContent, hasFile: true };
    } else {
      return { htmlContent: '', hasFile: false };
    }
  } catch (error: any) {
    // S3에서 파일이 없는 경우 (NoSuchKey 에러)
    if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
      // console.log(`📄 HTML 레이어 파일 없음: ${pageUuid}`);
      return { htmlContent: '', hasFile: false };
    }
    
    console.error('❌ HTML 레이어 다운로드 실패:', error);
    throw error;
  }
};

