import { RequestHandler, Request, Response } from "express";
import { generatePdfUploadUrl } from "../../utils/s3";
import { LectureMaterial, Page, sequelize } from "../../models";
import { SSEManager } from "../../utils/SSEManager";

/**
 * PDF 업로드 관련 컨트롤러
 */
export const pdfUploadController = {

  // SSE 연결 설정
  subscribeToConversion: ((req: Request, res: Response): void => {
    try {
      const { uuid } = req.params;  // URL 파라미터로 uuid 받기

      // console.log("sse 연결시도", uuid);
  
      // UUID 유효성 검증
      LectureMaterial.findOne({ where: { uuid } })
        .then(material => {
          if (!material) {
            return res.status(404).json({ 
              success: false, 
              message: '해당 교재를 찾을 수 없습니다.' 
            });
          }
  
          // SSE 클라이언트 등록
          return SSEManager.addClient(uuid, res);
        })
        .catch(error => {
          console.error('SSE 연결 실패:', error);
          res.status(500).json({ 
            success: false, 
            message: 'SSE 연결 중 오류가 발생했습니다.' 
          });
        });
  
    } catch (error) {
      console.error('SSE 연결 실패:', error);
      res.status(500).json({ 
        success: false, 
        message: 'SSE 연결 중 오류가 발생했습니다.' 
      });
    }
  }) as RequestHandler,


  /**
   * PDF 업로드용 Presigned URL 발급
   * - 파일 정보 검증
   * - Presigned URL 생성
   */
  getUploadUrl: (async (req: Request, res: Response) => {
    try {
      const { fileName, fileSize, uuid } = req.body;

      // 입력값 검증
      if (!fileName || !fileSize || !uuid) {
        return res.status(400).json({
          success: false,
          message: "필수 정보가 누락되었습니다.",
        });
      }

      // 파일 크기 제한 (50MB)
      const MAX_FILE_SIZE = 50 * 1024 * 1024;
      if (fileSize > MAX_FILE_SIZE) {
        return res.status(400).json({
          success: false,
          message: "파일 크기는 50MB를 초과할 수 없습니다.",
        });
      }

      // 파일 확장자 검증
      if (!fileName.toLowerCase().endsWith(".pdf")) {
        return res.status(400).json({
          success: false,
          message: "PDF 파일만 업로드 가능합니다.",
        });
      }

      // Presigned URL 생성
      const { presignedUrl, tempKey } = await generatePdfUploadUrl(
        uuid,
        fileName,
        fileSize
      );

      return res.status(200).json({
        success: true,
        presignedUrl,
      });
    } catch (error) {
      console.error("❌ Presigned URL 발급 실패:", error);
      return res.status(500).json({
        success: false,
        message: "Presigned URL 발급 중 오류가 발생했습니다.",
      });
    }
  }) as unknown as RequestHandler,

  // 변환 완료 알림 처리(lambda 콜백)
  conversionComplete: (async (req: Request, res: Response) => {
    try {
      console.log("변환완료 알림 받음 from lambda, 페이지 수:", req.body.pages.length);
      
      const { uuid, pages } = req.body;

      // 트랜잭션 시작
      const result = await sequelize.transaction(async (t) => {
        // 1. UUID로 LectureMaterial 찾기
        const material = await LectureMaterial.findOne({
          where: { uuid },
          transaction: t,
        });

        if (!material) {
          throw new Error(`UUID ${uuid}에 해당하는 교재를 찾을 수 없습니다.`);
        }

        // 2. Page 테이블에 bulk insert
        await Page.bulkCreate(
          pages.map((page: any) => ({
            lectureMaterialId: material.id, // 찾은 교재의 id를 외래키로 사용
            pageNumber: page.pageNumber,
            fileName: page.fileName,
            s3Key: page.s3Key,
          })),
          { transaction: t }
        );

        // 3. LectureMaterial의 totalPages 업데이트
        await material.update(
          {
            totalPages: pages.length,
          },
          { transaction: t }
        );

        return material;
      });

      SSEManager.sendMessage(uuid, {
        type: "conversion-complete",
        data: {
          materialId: result.id,
          totalPages: pages.length,
        },
      });

    } catch (error) {
      console.error("변환 완료 처리 실패:", error);
      res.status(500).json({
        error: "변환 완료 처리 실패",
        message:
          error instanceof Error
            ? error.message
            : "알 수 없는 오류가 발생했습니다.",
      });
    }
  }) as unknown as RequestHandler,
};
