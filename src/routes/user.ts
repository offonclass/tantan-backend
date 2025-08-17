import { Router } from 'express';
import { userLectureMaterialController } from '../controllers/user/lectureMaterial.controller';

const router: Router = Router();

/**
 * 사용자용 교재/폴더 관련 라우트
 */

// 교재/폴더 트리 조회 (즐겨찾기 섹션 포함 가능)
router.post('/get-materials-tree', userLectureMaterialController.getTree);

// 즐겨찾기 추가/해제
router.post('/favorites/add', userLectureMaterialController.addFavorite);
router.post('/favorites/remove', userLectureMaterialController.removeFavorite);

// 교재 상세 정보 조회
router.get('/material/:id', userLectureMaterialController.getMaterialDetail);

export default router; 