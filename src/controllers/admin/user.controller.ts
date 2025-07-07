import { RequestHandler, Request, Response } from 'express';
import { User } from '../../models/User';
import { Op } from 'sequelize';

/**
 * 사용자 계정 관리자 컨트롤러
 */
export const userController = {
  /**
   * 사용자 계정 목록 조회
   * - 특정 학원의 사용자만 조회
   * - is_existed가 true인 사용자만 조회
   * - 생성일 기준 내림차순 정렬
   */
  getUsers: (async (req: Request, res: Response) => {
    try {
      const { academyId } = req.body;

      if (!academyId) {
        return res.status(400).json({
          success: false,
          message: '학원 ID가 필요합니다.'
        });
      }

      const users = await User.findAll({
        where: { 
          academy_id: academyId,
          is_existed: true 
        },
        order: [['created_at', 'DESC']]
      });

      return res.status(200).json({
        success: true,
        users: users.map(user => ({
          id: user.id,
          academyId: user.academy_id,
          username: user.user_id,
          name: user.name,
          email: user.email || '',
          phoneNumber: user.phone_number || '',
          createdAt: user.created_at,
          updatedAt: user.updated_at
        }))
      });
    } catch (error) {
      console.error('❌ 사용자 계정 목록 조회 실패:', error);
      return res.status(500).json({
        success: false,
        message: '사용자 계정 목록을 조회하는 중 오류가 발생했습니다.'
      });
    }
  }) as unknown as RequestHandler,

  /**
   * 사용자 계정 생성
   * - 아이디, 패스워드, 이름은 필수
   * - 이메일, 폰번호는 선택사항
   * - role은 'academy_admin'으로 고정
   */
  createUser: (async (req: Request, res: Response) => {
    try {
      const { academyId, username, password, name, email, phoneNumber } = req.body;

      // 필수 필드 검증
      if (!academyId || !username?.trim() || !password?.trim() || !name?.trim()) {
        return res.status(400).json({
          success: false,
          message: '학원 ID, 아이디, 패스워드, 이름은 필수 입력사항입니다.'
        });
      }

      // 아이디 중복 확인
      const existingUser = await User.findOne({
        where: { 
          user_id: username.trim(),
          is_existed: true
        }
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: '이미 존재하는 아이디입니다.'
        });
      }

      // 사용자 생성
      const user = await User.create({
        user_id: username.trim(),
        password: password, // bcrypt 자동 해시화
        name: name.trim(),
        role: 'academy_admin', // 고정값
        academy_id: academyId,
        ...(email && { email: email.trim() }),
        ...(phoneNumber && { phone_number: phoneNumber.trim() })
      });

      return res.status(201).json({
        success: true,
        user: {
          id: user.id,
          academyId: user.academy_id,
          username: user.user_id,
          name: user.name,
          email: user.email || '',
          phoneNumber: user.phone_number || '',
          createdAt: user.created_at,
          updatedAt: user.updated_at
        }
      });
    } catch (error) {
      console.error('❌ 사용자 계정 생성 실패:', error);
      return res.status(500).json({
        success: false,
        message: '사용자 계정을 생성하는 중 오류가 발생했습니다.'
      });
    }
  }) as unknown as RequestHandler,

  /**
   * 사용자 계정 정보 수정
   * - 존재하는(is_existed: true) 사용자만 수정 가능
   * - 아이디, 이름은 필수
   * - 패스워드는 선택사항 (빈 값이면 변경하지 않음)
   * - 이메일, 폰번호는 선택사항
   */
  updateUser: (async (req: Request, res: Response) => {
    try {
      const { id, username, password, name, email, phoneNumber } = req.body;

      // 필수 필드 검증
      if (!id || !username?.trim() || !name?.trim()) {
        return res.status(400).json({
          success: false,
          message: 'ID, 아이디, 이름은 필수 입력사항입니다.'
        });
      }

      // 사용자 조회
      const user = await User.findOne({
        where: { 
          id,
          is_existed: true
        }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: '수정할 사용자를 찾을 수 없습니다.'
        });
      }

      // 아이디 중복 확인 (자신 제외)
      if (username.trim() !== user.user_id) {
        const existingUser = await User.findOne({
          where: { 
            user_id: username.trim(),
            is_existed: true,
            id: { [Op.ne]: id }
          }
        });

        if (existingUser) {
          return res.status(409).json({
            success: false,
            message: '이미 존재하는 아이디입니다.'
          });
        }
      }

      // 사용자 정보 수정
      const updateData: any = {
        user_id: username.trim(),
        name: name.trim(),
        email: email?.trim() || null,
        phone_number: phoneNumber?.trim() || null
      };

      // 패스워드가 제공된 경우에만 업데이트
      if (password?.trim()) {
        updateData.password = password;
      }

      await user.update(updateData);

      return res.status(200).json({
        success: true,
        user: {
          id: user.id,
          academyId: user.academy_id,
          username: user.user_id,
          name: user.name,
          email: user.email || '',
          phoneNumber: user.phone_number || '',
          createdAt: user.created_at,
          updatedAt: user.updated_at
        }
      });
    } catch (error) {
      console.error('❌ 사용자 계정 수정 실패:', error);
      return res.status(500).json({
        success: false,
        message: '사용자 계정 정보를 수정하는 중 오류가 발생했습니다.'
      });
    }
  }) as unknown as RequestHandler,

  /**
   * 사용자 계정 삭제 (소프트 삭제)
   * - is_existed를 false로 변경
   */
  deleteUser: (async (req: Request, res: Response) => {
    try {
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: '삭제할 사용자의 ID가 필요합니다.'
        });
      }

      // 사용자 조회
      const user = await User.findOne({
        where: { 
          id,
          is_existed: true
        }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: '삭제할 사용자를 찾을 수 없습니다.'
        });
      }

      // 소프트 삭제 실행
      await user.softDelete();

      return res.status(200).json({
        success: true,
        message: '사용자 계정이 성공적으로 삭제되었습니다.'
      });
    } catch (error) {
      console.error('❌ 사용자 계정 삭제 실패:', error);
      return res.status(500).json({
        success: false,
        message: '사용자 계정을 삭제하는 중 오류가 발생했습니다.'
      });
    }
  }) as unknown as RequestHandler
}; 