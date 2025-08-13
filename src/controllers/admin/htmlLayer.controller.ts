import { Request, Response } from 'express';
import { Page } from '../../models/Page';
import { uploadHTMLLayerToS3, downloadHTMLLayerFromS3 } from '../../utils/s3';

/**
 * HTML 레이어 관리 컨트롤러
 * - system_admin 전용 업로드 기능
 * - 모든 사용자 조회 기능 (파일 없어도 에러 아님)
 */
export const htmlLayerController = {

  /**
   * HTML 레이어 업로드 (system_admin 전용)
   * POST /api/admin/html-layer/upload
   */
  uploadHTMLLayer: (async (req: Request, res: Response) => {
    try {
      const { pageUuid, htmlContent } = req.body;

      // 입력값 검증
      if (!pageUuid || !htmlContent) {
        return res.status(400).json({
          success: false,
          message: 'pageUuid와 htmlContent가 필요합니다.'
        });
      }

      // pageUuid 형식 검증 (UUID v4)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(pageUuid)) {
        return res.status(400).json({
          success: false,
          message: '유효하지 않은 pageUuid 형식입니다.'
        });
      }

      // 권한 체크 제거 - 누구나 접근 가능

      // 페이지 존재 확인
      const page = await Page.findOne({
        where: { uuid: pageUuid }
      });

      if (!page) {
        return res.status(404).json({
          success: false,
          message: '해당 페이지를 찾을 수 없습니다.'
        });
      }

      // HTML 내용 길이 제한 (1MB)
      if (htmlContent.length > 1024 * 1024) {
        return res.status(400).json({
          success: false,
          message: 'HTML 내용이 너무 큽니다. (최대 1MB)'
        });
      }

      // S3에 HTML 파일 업로드
      const { s3Key } = await uploadHTMLLayerToS3(pageUuid, htmlContent);

      // console.log(`✅ HTML 레이어 업로드 완료: 페이지 ${page.pageNumber}, S3키 ${s3Key}`);

      return res.status(200).json({
        success: true,
        message: 'HTML 레이어가 성공적으로 업로드되었습니다.',
        data: {
          pageUuid,
          s3Key,
          pageNumber: page.pageNumber
        }
      });

    } catch (error) {
      console.error('❌ HTML 레이어 업로드 실패:', error);
      return res.status(500).json({
        success: false,
        message: 'HTML 레이어 업로드 중 오류가 발생했습니다.',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }) as any,

  /**
   * HTML 레이어 조회 (모든 사용자)
   * POST /api/admin/html-layer/get
   */
  getHTMLLayer: (async (req: Request, res: Response) => {
    try {
      const { pageUuid } = req.body;

      // 입력값 검증
      if (!pageUuid) {
        return res.status(400).json({
          success: false,
          message: 'pageUuid가 필요합니다.'
        });
      }

      // pageUuid 형식 검증 (UUID v4)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(pageUuid)) {
        return res.status(400).json({
          success: false,
          message: '유효하지 않은 pageUuid 형식입니다.'
        });
      }

      // 권한 체크 제거 - 누구나 접근 가능

      // 페이지 존재 확인
      const page = await Page.findOne({
        where: { uuid: pageUuid }
      });

      if (!page) {
        return res.status(404).json({
          success: false,
          message: '해당 페이지를 찾을 수 없습니다.'
        });
      }

      // S3에서 HTML 파일 다운로드 시도
      const { htmlContent, hasFile } = await downloadHTMLLayerFromS3(pageUuid);

      if (hasFile) {
        // console.log(`✅ HTML 레이어 조회 완료: 페이지 ${page.pageNumber}`);
        
        return res.status(200).json({
          success: true,
          message: 'HTML 레이어를 성공적으로 조회했습니다.',
          data: {
            pageUuid,
            htmlContent,
            hasFile: true,
            pageNumber: page.pageNumber
          }
        });
      } else {
        console.log(`📄 HTML 레이어 파일 없음: 페이지 ${page.pageNumber}`);
        
        return res.status(200).json({
          success: true,
          message: 'HTML 레이어 파일이 없습니다.',
          data: {
            pageUuid,
            htmlContent: '',
            hasFile: false,
            pageNumber: page.pageNumber
          }
        });
      }

    } catch (error) {
      console.error('❌ HTML 레이어 조회 실패:', error);
      return res.status(500).json({
        success: false,
        message: 'HTML 레이어 조회 중 오류가 발생했습니다.',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }) as any

}; 