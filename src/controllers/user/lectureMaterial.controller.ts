import { RequestHandler, Request, Response } from 'express';
import { LectureMaterial } from '../../models/LectureMaterial';
import { Page } from '../../models/Page';

// 트리 노드 타입 정의
interface TreeNode {
  id: number;
  folderName: string;
  type: 'category' | 'book';
  level: number;
  parentId: number | null;
  totalPages?: number;
  children: TreeNode[];
}

/**
 * 사용자용 교재/폴더 관리 컨트롤러
 */
export const userLectureMaterialController = {
  /**
   * 교재/폴더 트리 구조 조회
   * - 활성화된 교재/폴더만 트리 구조로 반환
   */
  getTree: (async (req: Request, res: Response) => {
    try {
      // 활성화된 교재/폴더만 조회 (level 순으로 정렬)
      const materials = await LectureMaterial.findAll({
        where: { isActive: true },
        order: [
          ['level', 'ASC'], 
          ['sortOrder', 'ASC']
        ]
      });

      // 트리 구조로 변환
      const tree = buildTree(materials);

      return res.status(200).json({
        success: true,
        tree
      });
    } catch (error) {
      console.error('❌ 사용자용 교재/폴더 트리 조회 실패:', error);
      return res.status(500).json({
        success: false,
        message: '교재/폴더 트리를 조회하는 중 오류가 발생했습니다.'
      });
    }
  }) as unknown as RequestHandler,

  /**
   * 교재 상세 정보 조회
   * - 특정 교재의 상세 정보를 반환 (페이지 정보 포함)
   */
  getMaterialDetail: (async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // 교재 정보와 페이지 정보 함께 조회
      const material = await LectureMaterial.findOne({
        where: { 
          id,
          isActive: true,
          type: 'book'
        },
        include: [{
          model: Page,
          as: 'pages',  // alias 추가
          attributes: ['id', 'pageNumber', 's3Key', 'uuid'],  // id 필드 추가 (오디오 업로드용)
          order: [['pageNumber', 'ASC']]
        }]
      });

      if (!material) {
        return res.status(404).json({
          success: false,
          message: '교재를 찾을 수 없습니다.'
        });
      }

      // 프론트엔드 기대 형식으로 응답 구조화
      return res.status(200).json({
        success: true,
        data: {
          id: material.id,
          name: material.folderName,
          pages: material.pages?.map(page => ({
            id: page.id,           // id 필드 추가 (오디오 업로드용)
            pageNumber: page.pageNumber,
            s3Key: page.s3Key,
            uuid: page.uuid
          })) || []
        }
      });
    } catch (error) {
      console.error('❌ 교재 상세 정보 조회 실패:', error);
      return res.status(500).json({
        success: false,
        message: '교재 정보를 조회하는 중 오류가 발생했습니다.'
      });
    }
  }) as unknown as RequestHandler
};

/**
 * 배열 형태의 교재/폴더 데이터를 트리 구조로 변환
 */
const buildTree = (materials: LectureMaterial[]): TreeNode[] => {
  const materialMap = new Map<number, TreeNode>();
  const tree: TreeNode[] = [];

  // 먼저 모든 노드를 맵에 저장
  materials.forEach(material => {
    materialMap.set(material.id, {
      id: material.id,
      folderName: material.folderName,
      type: material.type as 'category' | 'book',
      level: material.level,
      parentId: material.parentId ?? null, // undefined를 null로 변환
      totalPages: material.totalPages,
      children: []
    });
  });

  // 트리 구조 생성
  materials.forEach(material => {
    const node = materialMap.get(material.id);
    if (!node) return; // 노드가 없으면 스킵
    
    if (!material.parentId) {
      // 루트 노드 (parentId가 null 또는 undefined인 경우)
      tree.push(node);
    } else {
      // 부모 노드의 자식으로 추가
      const parent = materialMap.get(material.parentId);
      if (parent) {
        parent.children.push(node);
      }
    }
  });

  return tree;
}; 