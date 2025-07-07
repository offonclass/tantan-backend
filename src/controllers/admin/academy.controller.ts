import { RequestHandler, Request, Response } from 'express';
import { Academy } from '../../models/Academy';

/**
 * 가맹학원 관리자 컨트롤러
 */
export const academyController = {
  /**
   * 가맹학원 목록 조회
   * - isExisted가 true인 학원만 조회
   * - 생성일 기준 내림차순 정렬
   */
  getAcademies: (async (req: Request, res: Response) => {
    try {
      const academies = await Academy.findAll({
        where: { 
          isExisted: true 
        },
        order: [['createdAt', 'DESC']]
      });

      return res.status(200).json({
        success: true,
        academies: academies.map(academy => ({
          id: academy.id,
          campusName: academy.campusName,
          region: academy.region,
          contactNumber: academy.contactNumber || '',
          isActive: academy.isActive,
          createdAt: academy.createdAt,
          updatedAt: academy.updatedAt
        }))
      });
    } catch (error) {
      console.error('❌ 가맹학원 목록 조회 실패:', error);
      return res.status(500).json({
        success: false,
        message: '가맹학원 목록을 조회하는 중 오류가 발생했습니다.'
      });
    }
  }) as unknown as RequestHandler,

  /**
   * 가맹학원 생성
   * - 캠퍼스명과 지역명은 필수
   * - 연락처는 선택사항
   */
  createAcademy: (async (req: Request, res: Response) => {
    try {
      const { campusName, region, contactNumber } = req.body;

      // 필수 필드 검증
      if (!campusName?.trim() || !region?.trim()) {
        return res.status(400).json({
          success: false,
          message: '캠퍼스명과 지역명은 필수 입력사항입니다.'
        });
      }

      // 학원 생성
      const academy = await Academy.create({
        campusName: campusName.trim(),
        region: region.trim(),
        ...(contactNumber && { contactNumber: contactNumber.trim() })
      });

      return res.status(201).json({
        success: true,
        academy: {
          id: academy.id,
          campusName: academy.campusName,
          region: academy.region,
          contactNumber: academy.contactNumber || '',
          isActive: academy.isActive,
          createdAt: academy.createdAt,
          updatedAt: academy.updatedAt
        }
      });
    } catch (error) {
      console.error('❌ 가맹학원 생성 실패:', error);
      return res.status(500).json({
        success: false,
        message: '가맹학원을 생성하는 중 오류가 발생했습니다.'
      });
    }
  }) as unknown as RequestHandler,

  /**
   * 가맹학원 정보 수정
   * - 존재하는(isExisted: true) 학원만 수정 가능
   * - 캠퍼스명과 지역명은 필수
   * - 연락처는 선택사항
   */
  updateAcademy: (async (req: Request, res: Response) => {
    try {
      const { id, campusName, region, contactNumber } = req.body;

      // 필수 필드 검증
      if (!id || !campusName?.trim() || !region?.trim()) {
        return res.status(400).json({
          success: false,
          message: 'ID, 캠퍼스명, 지역명은 필수 입력사항입니다.'
        });
      }

      // 학원 조회
      const academy = await Academy.findOne({
        where: { 
          id,
          isExisted: true
        }
      });

      if (!academy) {
        return res.status(404).json({
          success: false,
          message: '수정할 학원을 찾을 수 없습니다.'
        });
      }

      // 학원 정보 수정
      await academy.update({
        campusName: campusName.trim(),
        region: region.trim(),
        contactNumber: contactNumber?.trim()
      });

      return res.status(200).json({
        success: true,
        academy: {
          id: academy.id,
          campusName: academy.campusName,
          region: academy.region,
          contactNumber: academy.contactNumber || '',
          isActive: academy.isActive,
          createdAt: academy.createdAt,
          updatedAt: academy.updatedAt
        }
      });
    } catch (error) {
      console.error('❌ 가맹학원 수정 실패:', error);
      return res.status(500).json({
        success: false,
        message: '가맹학원 정보를 수정하는 중 오류가 발생했습니다.'
      });
    }
  }) as unknown as RequestHandler,

  /**
   * 가맹학원 삭제 (소프트 삭제)
   * - isExisted를 false로 변경
   */
  deleteAcademy: (async (req: Request, res: Response) => {
    try {
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: '삭제할 학원의 ID가 필요합니다.'
        });
      }

      // 학원 조회
      const academy = await Academy.findOne({
        where: { 
          id,
          isExisted: true
        }
      });

      if (!academy) {
        return res.status(404).json({
          success: false,
          message: '삭제할 학원을 찾을 수 없습니다.'
        });
      }

      // 소프트 삭제 실행
      await academy.update({
        isExisted: false
      });

      return res.status(200).json({
        success: true,
        message: '학원이 성공적으로 삭제되었습니다.'
      });
    } catch (error) {
      console.error('❌ 가맹학원 삭제 실패:', error);
      return res.status(500).json({
        success: false,
        message: '가맹학원을 삭제하는 중 오류가 발생했습니다.'
      });
    }
  }) as unknown as RequestHandler
}; 