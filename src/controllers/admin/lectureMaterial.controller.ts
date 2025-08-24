import { RequestHandler, Request, Response } from 'express';
import { LectureMaterial } from '../../models/LectureMaterial';
import { sequelize } from '../../config/database';
import { deleteFolder } from '../../utils/s3';

/**
 * 교재/폴더 관리 컨트롤러
 */
export const lectureMaterialController = {
  /**
   * 교재/폴더 트리 구조 조회
   * - 모든 활성화된 교재/폴더를 트리 구조로 반환
   */
  getTree: (async (req: Request, res: Response) => {
    try {
      // 모든 교재/폴더 조회 (level 순으로 정렬)
      const materials = await LectureMaterial.findAll({
        order: [['level', 'ASC'], ['sortOrder', 'ASC']]
      });

      // 트리 구조로 변환
      const tree = buildTree(materials);

      return res.status(200).json({
        success: true,
        tree
      });
    } catch (error) {
      console.error('❌ 교재/폴더 트리 조회 실패:', error);
      return res.status(500).json({
        success: false,
        message: '교재/폴더 트리를 조회하는 중 오류가 발생했습니다.'
      });
    }
  }) as unknown as RequestHandler,

  /**
   * 교재/폴더 생성
   * - folderName과 type은 필수
   * - parentId는 선택사항 (없으면 루트)
   * - S3에 해당 UUID로 폴더 생성
   */
  createMaterial: (async (req: Request, res: Response) => {
    const t = await sequelize.transaction();

    try {
      const { folderName, parentId, type } = req.body;

      // 최소한의 필수 값만 체크
      if (!folderName || !type) {
        return res.status(400).json({
          success: false,
          message: '필수 정보가 누락되었습니다.'
        });
      }

      // 부모 폴더 존재 확인 (parentId가 있는 경우만)
      let level = 0;
      if (parentId) {
        const parent = await LectureMaterial.findByPk(parentId);
        if (!parent) {
          return res.status(404).json({
            success: false,
            message: '상위 폴더를 찾을 수 없습니다.'
          });
        }
        level = parent.level + 1;
      }

      // 1. DB에 교재/폴더 생성
      const material = await LectureMaterial.create({
        folderName,
        parentId,
        type,
        level,
        isActive: true,
        isFavorite: false
      }, { transaction: t });

      // 3. 트랜잭션 커밋
      await t.commit();

      return res.status(201).json({
        success: true,
        material: {
          id: material.id,
          uuid: material.uuid,
          folderName: material.folderName,
          parentId: material.parentId,
          level: material.level,
          type: material.type,
          isActive: material.isActive,
          isFavorite: material.isFavorite,
          createdAt: material.createdAt,
          updatedAt: material.updatedAt
        }
      });
    } catch (error) {
      // 롤백
      await t.rollback();
      
      console.error('❌ 교재/폴더 생성 실패:', error);
      return res.status(500).json({
        success: false,
        message: '교재/폴더를 생성하는 중 오류가 발생했습니다.'
      });
    }
  }) as unknown as RequestHandler,

  /**
   * 교재/폴더 수정
   * - 존재하는 항목만 수정 가능
   */
  updateMaterial: (async (req: Request, res: Response) => {
    try {
      const { id, folderName, isActive, isFavorite, parentId } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: '수정할 교재/폴더의 ID가 필요합니다.'
        });
      }

      // 대상 항목 조회
      const material = await LectureMaterial.findByPk(id);

      if (!material) {
        return res.status(404).json({
          success: false,
          message: '수정할 교재/폴더를 찾을 수 없습니다.'
        });
      }

      // 수정할 데이터 준비
      const updateData: any = {};
      if (folderName !== undefined) updateData.folderName = folderName;
      if (isActive !== undefined) updateData.isActive = isActive;
      if (isFavorite !== undefined) updateData.isFavorite = isFavorite;

      // 위치 이동 처리: parentId가 전달된 경우만 수행
      if (parentId !== undefined) {
       
        // 동일 부모로 이동이면 위치 변경은 생략 (이름 변경만 반영)
        const isSameParent = (
          (material.parentId == null && (parentId == null || parentId === '')) ||
          (material.parentId != null && parentId === material.parentId)
        );

        if (!isSameParent) {
          // 루트로 이동하는 경우(level=0)도 허용
          if (parentId == null || parentId === '') {
            updateData.parentId = null;
            updateData.level = 0;
          } else {
            // 새 부모 유효성 검증 (존재 여부, 타입이 category인지)
            const newParent = await LectureMaterial.findByPk(parentId);
            if (!newParent) {
              return res.status(404).json({
                success: false,
                message: '이동 대상 폴더를 찾을 수 없습니다.'
              });
            }
            if (newParent.type !== 'category') {
              return res.status(400).json({
                success: false,
                message: '이동 대상은 폴더(category)만 가능합니다.'
              });
            }

            // 새 level 계산: 부모 level + 1
            updateData.parentId = newParent.id;
            updateData.level = newParent.level + 1;
          }

          // 같은 부모 하위 정렬 마지막으로 이동 (sortOrder = max + 1)
          const lastSibling = await LectureMaterial.findOne({
            where: { parentId: (parentId == null || parentId === '') ? null : parentId },
            order: [['sortOrder', 'DESC']]
          });
          const nextSort = (lastSibling && lastSibling.sortOrder != null) ? lastSibling.sortOrder + 1 : 0;
          updateData.sortOrder = nextSort;
        }
      }

      // DB 업데이트
      await material.update(updateData);

      return res.status(200).json({
        success: true,
        material: {
          id: material.id,
          uuid: material.uuid,
          folderName: material.folderName,
          parentId: material.parentId,
          level: material.level,
          type: material.type,
          isActive: material.isActive,
          isFavorite: material.isFavorite,
          createdAt: material.createdAt,
          updatedAt: material.updatedAt
        }
      });
    } catch (error) {
      console.error('❌ 교재/폴더 수정 실패:', error);
      return res.status(500).json({
        success: false,
        message: '교재/폴더 정보를 수정하는 중 오류가 발생했습니다.'
      });
    }
  }) as unknown as RequestHandler,

  /**
   * 교재/폴더 삭제 (하위 항목 포함 실제 삭제)
   * - DB에서 삭제
   * - S3에서 폴더와 내용물 삭제
   */
  deleteMaterial: (async (req: Request, res: Response) => {
    const t = await sequelize.transaction();
    
    try {
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: '삭제할 교재/폴더의 ID가 필요합니다.'
        });
      }

      // 삭제할 항목 확인
      const material = await LectureMaterial.findByPk(id);
      
      if (!material) {
        return res.status(404).json({
          success: false,
          message: '삭제할 교재/폴더를 찾을 수 없습니다.'
        });
      }

      // 1. 하위 항목 모두 조회 (재귀적으로)
      const childIds = await getChildIds(id);
      
      // 2. 하위 항목들의 UUID 수집 (book 타입만)
      const childMaterials = await LectureMaterial.findAll({
        where: { id: childIds },
        transaction: t
      });
      
      // 3. 현재 항목과 하위 항목들 중 book 타입인 것들의 UUID 목록 생성
      const uuidsToDelete = [
        ...(material.type === 'book' ? [material.uuid] : []),
        ...childMaterials
          .filter(m => m.type === 'book')
          .map(m => m.uuid)
      ];

      // 4. S3에서 book 타입 폴더들만 삭제
      if (uuidsToDelete.length > 0) {
        await Promise.all(uuidsToDelete.map(uuid => deleteFolder(uuid)));
      }

      // 5. DB에서 하위 항목 삭제
      if (childIds.length > 0) {
        await LectureMaterial.destroy({
          where: { id: childIds },
          transaction: t
        });
      }

      // 6. DB에서 현재 항목 삭제
      await material.destroy({ transaction: t });

      // 7. 트랜잭션 커밋
      await t.commit();

      return res.status(200).json({
        success: true,
        message: '교재/폴더가 성공적으로 삭제되었습니다.'
      });

    } catch (error) {
      // 롤백
      await t.rollback();
      
      console.error('❌ 교재/폴더 삭제 실패:', error);
      return res.status(500).json({
        success: false,
        message: '교재/폴더를 삭제하는 중 오류가 발생했습니다.'
      });
    }
  }) as unknown as RequestHandler
};

/**
 * 배열을 트리 구조로 변환하는 유틸리티 함수
 */
function buildTree(materials: LectureMaterial[]): any[] {
  const map = new Map();
  const roots: any[] = [];

  // 먼저 모든 항목을 맵에 저장
  materials.forEach(material => {
    map.set(material.id, {
      id: material.id,
      uuid: material.uuid,
      folderName: material.folderName,
      parentId: material.parentId,
      level: material.level,
      type: material.type,
      isActive: material.isActive,
      isFavorite: material.isFavorite,
      createdAt: material.createdAt,
      updatedAt: material.updatedAt,
      children: []
    });
  });

  // 트리 구조 생성
  materials.forEach(material => {
    const node = map.get(material.id);
    if (material.parentId) {
      const parent = map.get(material.parentId);
      if (parent) {
        parent.children.push(node);
      }
    } else {
      roots.push(node);
    }
  });

  return roots;
}

/**
 * 하위 항목 ID 조회 유틸리티 함수
 */
async function getChildIds(parentId: number): Promise<number[]> {
  const children = await LectureMaterial.findAll({
    where: { parentId }
  });

  const childIds = children.map(child => child.id);
  
  // 재귀적으로 하위 항목 조회
  for (const childId of childIds) {
    const grandChildIds = await getChildIds(childId);
    childIds.push(...grandChildIds);
  }

  return childIds;
} 