import { RequestHandler, Request, Response } from "express";
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, S3_BUCKET_NAME, createAudioS3Key, getMimeType } from "../../config/aws";
import { Audio, Page, sequelize } from "../../models";
import crypto from 'crypto';

/**
 * 오디오 업로드 관련 컨트롤러
 */
export const audioUploadController = {

  /**
   * 오디오 업로드용 Presigned URL 발급
   * - 페이지 존재 확인
   * - 파일 유효성 검사
   * - Audio 레코드 생성
   * - Presigned URL 생성
   */
  getUploadUrl: (async (req: Request, res: Response) => {
    try {
      const { pageId, fileName, fileSize, audioName } = req.body;

      // 입력값 검증
      if (!pageId || !fileName || !fileSize || !audioName) {
        return res.status(400).json({
          success: false,
          message: "필수 정보가 누락되었습니다.",
        });
      }

      // 페이지 존재 확인
      const page = await Page.findByPk(pageId);
      if (!page) {
        return res.status(404).json({
          success: false,
          message: "해당 페이지를 찾을 수 없습니다.",
        });
      }

      // 파일 크기 제한 (100MB)
      const MAX_FILE_SIZE = 100 * 1024 * 1024;
      if (fileSize > MAX_FILE_SIZE) {
        return res.status(400).json({
          success: false,
          message: "파일 크기는 100MB를 초과할 수 없습니다.",
        });
      }

      // 오디오 파일 확장자 검증
      const allowedExtensions = ['mp3', 'wav', 'ogg', 'aac', 'm4a', 'flac'];
      const fileExtension = fileName.split('.').pop()?.toLowerCase();
      if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
        return res.status(400).json({
          success: false,
          message: "지원되지 않는 파일 형식입니다. (MP3, WAV, OGG, AAC, M4A, FLAC만 지원)",
        });
      }

      // MIME 타입 확인
      const mimeType = getMimeType(fileName);

      // 트랜잭션 시작
      const result = await sequelize.transaction(async (t) => {
        // Audio 레코드 생성
        const audioUuid = crypto.randomUUID();
        const s3Key = createAudioS3Key(page.uuid, audioUuid, fileName);

        const audio = await Audio.create({
          uuid: audioUuid,
          pageId: pageId,
          audioName: audioName.trim(),
          originalFileName: fileName,
          fileSize: fileSize,
          mimeType: mimeType,
          s3Key: s3Key,
          uploadedBy: req.user?.id, // 현재 로그인한 관리자 ID
        }, { transaction: t });

        // Presigned URL 생성
        const command = new PutObjectCommand({
          Bucket: S3_BUCKET_NAME,
          Key: s3Key,
          ContentType: mimeType,
          ContentLength: fileSize,
          ServerSideEncryption: 'AES256',
          Metadata: {
            audioUuid: audioUuid,
            pageId: pageId.toString(),
            originalFileName: fileName,
            audioName: audioName
          }
        });

        const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 }); // 15분

        return { audio, presignedUrl };
      });

      console.log(`✅ 오디오 업로드 URL 생성 완료: ${result.audio.uuid}`);

      return res.status(200).json({
        success: true,
        data: {
          presignedUrl: result.presignedUrl,
          audioUuid: result.audio.uuid,
          s3Key: result.audio.s3Key
        }
      });

    } catch (error) {
      console.error("❌ 오디오 업로드 URL 발급 실패:", error);
      return res.status(500).json({
        success: false,
        message: "오디오 업로드 URL 발급 중 오류가 발생했습니다.",
      });
    }
      }) as unknown as RequestHandler,

  /**
   * 페이지별 오디오 목록 조회
   * - 특정 페이지에 업로드된 모든 활성 오디오 조회
   */
  getPageAudios: (async (req: Request, res: Response) => {
    try {
      const { pageId } = req.body;

      if (!pageId) {
        return res.status(400).json({
          success: false,
          message: "페이지 ID가 필요합니다.",
        });
      }

      // 페이지 존재 확인
      const page = await Page.findByPk(pageId);
      if (!page) {
        return res.status(404).json({
          success: false,
          message: "해당 페이지를 찾을 수 없습니다.",
        });
      }

      // 해당 페이지의 모든 활성 오디오 조회
      const audios = await Audio.findAll({
        where: { 
          pageId: pageId,
        },
        attributes: [
          'id', 'uuid', 'audioName', 'originalFileName', 
          'fileSize', 'duration', 's3Key', 'createdAt'
        ],
        order: [['createdAt', 'DESC']] // 최신 업로드 순
      });

      console.log(`✅ 페이지 id:${pageId} 의 오디오 목록 조회: ${audios.length}개`);

      return res.status(200).json({
        success: true,
        data: audios
      });

    } catch (error) {
      console.error("❌ 페이지 오디오 목록 조회 실패:", error);
      return res.status(500).json({
        success: false,
        message: "오디오 목록을 조회하는 중 오류가 발생했습니다.",
      });
    }
  }) as unknown as RequestHandler,

  /**
   * 오디오 삭제 (DB 레코드 + S3 파일 완전 삭제)
   * - 시스템 관리자만 접근 가능
   */
  deleteAudio: (async (req: Request, res: Response) => {
    try {
      const { audioUuid } = req.body;

      if (!audioUuid) {
        return res.status(400).json({
          success: false,
          message: "오디오 UUID가 필요합니다.",
        });
      }

      // 오디오 레코드 조회
      const audio = await Audio.findOne({
        where: { uuid: audioUuid }
      });

      if (!audio) {
        return res.status(404).json({
          success: false,
          message: "해당 오디오를 찾을 수 없습니다.",
        });
      }

      // 트랜잭션으로 DB 삭제와 S3 삭제를 함께 처리
      await sequelize.transaction(async (t) => {
        // 1. DB 레코드 삭제
        await audio.destroy({ transaction: t });

        // 2. S3 파일 삭제
        const deleteCommand = new DeleteObjectCommand({
          Bucket: S3_BUCKET_NAME,
          Key: audio.s3Key
        });

        await s3Client.send(deleteCommand);
      });

      console.log(`✅ 오디오 삭제 완료: ${audio.audioName} (${audio.s3Key})`);

      return res.status(200).json({
        success: true,
        message: "오디오가 성공적으로 삭제되었습니다.",
        data: {
          deletedAudioName: audio.audioName,
          deletedS3Key: audio.s3Key
        }
      });

    } catch (error) {
      console.error("❌ 오디오 삭제 실패:", error);
      return res.status(500).json({
        success: false,
        message: "오디오 삭제 중 오류가 발생했습니다.",
      });
    }
  }) as unknown as RequestHandler,

}; 