import { RequestHandler, Request, Response } from 'express';
import { LectureMaterial } from '../../models/LectureMaterial';
import { Page } from '../../models/Page';
import UserFavoriteMaterial from '../../models/UserFavoriteMaterial';

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
   * - body.userId(또는 id)가 있으면 해당 사용자의 즐겨찾기 루트 서브트리도 함께 반환
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

      // 요청 본문에서 사용자 id 파싱 (userId 우선, 없으면 id)
      const rawUserId = (req.body?.userId ?? req.body?.id) as number | undefined;

      // 즐겨찾기 섹션 구성 (선택)
      let favorites: TreeNode[] | undefined = undefined;
      if (rawUserId && Number.isFinite(Number(rawUserId))) {
        const userId = Number(rawUserId);

        // 해당 사용자의 즐겨찾기 대상 id 목록 조회
        const favoriteJoinRows = await UserFavoriteMaterial.findAll({
          where: { userId }
        });
        const favoriteIds = new Set<number>(favoriteJoinRows.map(r => r.lectureMaterialId));

        if (favoriteIds.size > 0) {
          // 전체 material에서 id -> 원본 TreeNode 매핑
          const idToNode = indexTreeById(tree);

          // 각 즐겨찾기 대상에 대해 서브트리를 깊은 복제 후 level 0 기준으로 재기준화
          favorites = Array.from(favoriteIds)
            .map((favId) => {
              const node = idToNode.get(favId);
              if (!node) return undefined;
              const cloned = cloneTree(node);
              rebaseLevels(cloned, cloned.level); // 최상위가 0이 되도록
              return cloned;
            })
            .filter((n): n is TreeNode => Boolean(n));
        }
      }

      return res.status(200).json({
        success: true,
        tree,
        ...(favorites ? { favorites } : {})
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
   * 즐겨찾기 추가
   * Body: { userId?: number, id?: number, materialId: number }
   */
  addFavorite: (async (req: Request, res: Response) => {
    try {
      const rawUserId = (req.body?.userId ?? req.body?.id) as number | undefined;
      const materialId = Number(req.body?.materialId);

      if (!rawUserId || !Number.isFinite(Number(rawUserId))) {
        return res.status(400).json({ success: false, message: 'userId가 필요합니다.' });
      }
      if (!materialId || !Number.isFinite(materialId)) {
        return res.status(400).json({ success: false, message: 'materialId가 필요합니다.' });
      }

      const userId = Number(rawUserId);

      // 교재 존재/활성 검증(선택, 안전성 향상)
      const material = await LectureMaterial.findOne({ where: { id: materialId, isActive: true } });
      if (!material) {
        return res.status(404).json({ success: false, message: '유효하지 않은 교재/폴더입니다.' });
      }

      // upsert 성격: findOrCreate
      await UserFavoriteMaterial.findOrCreate({
        where: { userId, lectureMaterialId: materialId },
        defaults: { userId, lectureMaterialId: materialId }
      });

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('❌ 즐겨찾기 추가 실패:', error);
      return res.status(500).json({ success: false, message: '즐겨찾기를 추가하는 중 오류가 발생했습니다.' });
    }
  }) as unknown as RequestHandler,

  /**
   * 즐겨찾기 해제
   * Body: { userId?: number, id?: number, materialId: number }
   */
  removeFavorite: (async (req: Request, res: Response) => {
    try {
      const rawUserId = (req.body?.userId ?? req.body?.id) as number | undefined;
      const materialId = Number(req.body?.materialId);

      if (!rawUserId || !Number.isFinite(Number(rawUserId))) {
        return res.status(400).json({ success: false, message: 'userId가 필요합니다.' });
      }
      if (!materialId || !Number.isFinite(materialId)) {
        return res.status(400).json({ success: false, message: 'materialId가 필요합니다.' });
      }

      const userId = Number(rawUserId);

      await UserFavoriteMaterial.destroy({ where: { userId, lectureMaterialId: materialId } });

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('❌ 즐겨찾기 해제 실패:', error);
      return res.status(500).json({ success: false, message: '즐겨찾기를 해제하는 중 오류가 발생했습니다.' });
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

/**
 * 트리에서 id로 노드를 빠르게 찾기 위한 인덱스 생성
 */
const indexTreeById = (roots: TreeNode[]): Map<number, TreeNode> => {
  const map = new Map<number, TreeNode>();
  const walk = (node: TreeNode) => {
    map.set(node.id, node);
    node.children.forEach(walk);
  };
  roots.forEach(walk);
  return map;
};

/**
 * 트리 깊은 복제
 */
const cloneTree = (node: TreeNode): TreeNode => {
  return {
    id: node.id,
    folderName: node.folderName,
    type: node.type,
    level: node.level,
    parentId: node.parentId,
    totalPages: node.totalPages,
    children: node.children.map(cloneTree)
  };
};

/**
 * 레벨 재기준화: 기준 level을 0으로 맞추고 자식들도 동일 오프셋을 적용
 */
const rebaseLevels = (node: TreeNode, baseLevel: number) => {
  node.level = node.level - baseLevel;
  node.parentId = null; // 즐겨찾기 섹션에서는 최상위로 취급
  node.children.forEach((child) => rebaseLevels(child, baseLevel));
}; 